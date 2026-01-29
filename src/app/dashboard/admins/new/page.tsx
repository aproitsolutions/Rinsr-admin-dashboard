'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction
} from '@/components/ui/alert-dialog';

//   Validation schema
const adminSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.string().min(1, 'Role is required'),
    hub_id: z.string().optional()
  })
  .refine(
    (data) => {
      if (data.role === 'hub_user') {
        return !!data.hub_id && data.hub_id.trim() !== '';
      }
      return true;
    },
    {
      message: 'Hub is required for Hub Users',
      path: ['hub_id']
    }
  );

type AdminFormData = z.infer<typeof adminSchema>;

interface Hub {
  _id: string;
  name: string;
}

export default function CreateAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [hubs, setHubs] = useState<Hub[]>([]);

  useEffect(() => {
    async function fetchHubs() {
      try {
        const res = await fetch('/api/hubs');
        const data = await res.json();
        if (data.success && Array.isArray(data.hubs)) {
          setHubs(data.hubs);
        }
      } catch (err) {
        console.error('Failed to fetch hubs', err);
      }
    }
    fetchHubs();
  }, []);

  const form = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: '',
      hub_id: ''
    }
  });

  async function onSubmit(values: AdminFormData) {
    setLoading(true);
    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      const data = await res.json();

      if (data.success) {
        setIsSuccess(true);
        setAlertMessage('Admin created successfully!');
        setTimeout(() => router.push('/dashboard/admins'), 1500);
      } else {
        setIsSuccess(false);
        setAlertMessage(data.message || 'Failed to create admin.');
      }
    } catch (err) {
      console.error(err);
      setIsSuccess(false);
      setAlertMessage('Something went wrong while saving.');
    } finally {
      setLoading(false);
      setAlertOpen(true);
    }
  }

  return (
    <PageContainer scrollable={false}>
      <div className='bg-card flex max-w-3xl flex-1 flex-col space-y-6 rounded-lg p-6 shadow'>
        <h1 className='text-foreground text-2xl font-bold'>Create Admin</h1>

        <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
          <div className='grid gap-4'>
            {/* Name */}
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder='John Doe' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='admin@example.com'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      placeholder='Enter password'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role */}
            <FormField
              control={form.control}
              name='role'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select role' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='super_admin'>Super Admin</SelectItem>
                      <SelectItem value='admin'>Admin</SelectItem>
                      <SelectItem value='vendor_user'>Vendor User</SelectItem>
                      <SelectItem value='hub_user'>Hub User</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hub Selection */}
            <FormField
              control={form.control}
              name='hub_id'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hub (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select Hub' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {hubs.map((hub) => (
                        <SelectItem key={hub._id} value={hub._id}>
                          {hub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Buttons */}
          <div className='flex gap-4 pt-6'>
            <Button type='submit' disabled={loading}>
              {loading ? 'Saving...' : 'Create Admin'}
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.push('/dashboard/admins')}
            >
              Cancel
            </Button>
          </div>
        </Form>
      </div>

      {/*   Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isSuccess ? '  Success' : '❌ Error'}
            </AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setAlertOpen(false);
                if (isSuccess) router.push('/dashboard/admins');
              }}
            >
              {isSuccess ? 'Go to Admins' : 'Close'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
