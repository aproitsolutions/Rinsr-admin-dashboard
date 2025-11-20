'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import PageContainer from '@/components/layout/page-container';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction
} from '@/components/ui/alert-dialog';

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      role: ''
    }
  });

  // Load current admin
  useEffect(() => {
    async function loadAdmin() {
      try {
        const res = await fetch('/api/profile/me', { cache: 'no-store' });

        const data = await res.json();
        // console.log('📥 profile data:', data);

        if (!data.success || !data.admin) {
          throw new Error(data.message || 'Failed to load admin');
        }

        setAdminId(data.admin._id);

        form.reset({
          name: data.admin.name || '',
          email: data.admin.email || '',
          role: data.admin.role || ''
        });
      } catch (err) {
        console.error('❌ Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAdmin();
  }, [form]);

  // Handle update
  async function onSubmit(values: any) {
    if (!adminId) return;

    setSaving(true);

    try {
      const payload: any = {
        name: values.name,
        email: values.email
      };

      if (values.password && values.password.trim() !== '') {
        payload.password = values.password;
      }

      // console.log('📤 Payload:', payload);

      const res = await fetch(`/api/profile/${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        setIsSuccess(true);
        setAlertMessage('Profile updated successfully!');
      } else {
        setIsSuccess(false);
        setAlertMessage(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      setIsSuccess(false);
      setAlertMessage('Something went wrong.');
    } finally {
      setSaving(false);
      setAlertOpen(true);
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <p className='text-muted-foreground p-6'>Loading profile...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6 p-6'>
        <header>
          <h1 className='text-2xl font-bold'>Profile</h1>
        </header>

        <section className='w-full max-w-xl'>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div>
              <label className='mb-2 block font-medium'>Name</label>
              <Input {...form.register('name')} />
            </div>

            <div>
              <label className='mb-2 block font-medium'>Email</label>
              <Input type='email' {...form.register('email')} />
            </div>

            <div>
              <label className='mb-2 block font-medium'>Role</label>
              <Input disabled {...form.register('role')} />
            </div>

            <div>
              <Button type='submit' disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </section>

        <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {isSuccess ? 'Success' : 'Error'}
              </AlertDialogTitle>
              <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => {
                  setAlertOpen(false);
                  if (isSuccess) router.refresh();
                }}
              >
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageContainer>
  );
}
