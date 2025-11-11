'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import PageContainer from '@/components/layout/page-container';
import { toast } from 'sonner';

interface Service {
  _id: string;
  name: string;
  price: string | number;
}

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔹 Fetch service details
  useEffect(() => {
    async function fetchService() {
      setLoading(true);
      try {
        const res = await fetch(`/api/services/${id}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success) setService(data.service);
        else toast.error(data.message || 'Failed to fetch service');
      } catch (err) {
        toast.error('Error loading service');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchService();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!service) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: service.name,
          price: service.price
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Service updated successfully');
        router.push('/dashboard/services');
      } else {
        toast.error(data.message || 'Failed to update service');
      }
    } catch (err) {
      toast.error('Error updating service');
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <PageContainer>
        <div className='flex h-[60vh] items-center justify-center'>
          <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
        </div>
      </PageContainer>
    );

  if (!service)
    return (
      <PageContainer>
        <div className='text-muted-foreground mt-20 text-center'>
          Service not found.
        </div>
      </PageContainer>
    );

  return (
    <PageContainer>
      <form
        onSubmit={handleSubmit}
        className='flex items-start justify-center p-6'
      >
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Edit Service</CardTitle>
            <CardDescription>Update the service details below.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label htmlFor='name'>Service Name</Label>
              <Input
                id='name'
                value={service.name}
                onChange={(e) =>
                  setService({ ...service, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor='price'>Price (₹)</Label>
              <Input
                id='price'
                type='number'
                value={service.price}
                onChange={(e) =>
                  setService({ ...service, price: e.target.value })
                }
                required
              />
            </div>
          </CardContent>
          <CardFooter className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.push('/dashboard/services')}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={saving}>
              {saving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </PageContainer>
  );
}
