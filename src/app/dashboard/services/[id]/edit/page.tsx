'use client';

// Force recompile
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { FileUploader } from '@/components/file-uploader';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import Lottie from 'lottie-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  price: z.coerce
    .number()
    .min(0, { message: 'Price must be a positive number.' }),
  gif: z.array(z.instanceof(File)).optional()
});

type ServiceFormValues = z.infer<typeof formSchema>;

interface Service {
  _id: string;
  name: string;
  price: string | number;
  gif?: {
    url: string;
  };
}

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingGif, setExistingGif] = useState<string | null>(null);
  const [animationData, setAnimationData] = useState<any>(null);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      price: 0,
      gif: []
    }
  });

  // 🔹 Fetch service details
  useEffect(() => {
    async function fetchService() {
      setLoading(true);
      try {
        const res = await fetch(`/api/services/${id}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && data.service) {
          form.reset({
            name: data.service.name,
            price: Number(data.service.price),
            gif: []
          });
          if (data.service.gif?.url) {
            setExistingGif(data.service.gif.url);
          }
        } else {
          toast.error(data.message || 'Failed to fetch service');
        }
      } catch (err) {
        toast.error('Error loading service');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchService();
  }, [id, form]);

  // Fetch Lottie JSON
  useEffect(() => {
    if (existingGif && existingGif.endsWith('.json')) {
      fetch(existingGif)
        .then((res) => {
          console.log('🎬 Fetching Lottie JSON:', existingGif, res.status);
          return res.json();
        })
        .then((data) => {
          console.log('✅ Lottie Data Loaded:', data ? 'Valid Data' : 'Null');
          setAnimationData(data);
        })
        .catch((err) => console.error('❌ Failed to load Lottie', err));
    } else {
      console.log('ℹ️ No JSON GIF:', existingGif);
      setAnimationData(null);
    }
  }, [existingGif]);

  const onSubmit = async (data: ServiceFormValues) => {
    setSaving(true);
    try {
      let gifValue = undefined;

      // Upload GIF if present
      if (data.gif && data.gif.length > 0) {
        const file = data.gif[0];

        // Standard upload for all file types (JSON included)
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          gifValue = { url: uploadData.url };
        } else {
          toast.error('Failed to upload file');
          setSaving(false);
          return;
        }
      } else if (existingGif) {
        // Keep existing URL
        gifValue = { url: existingGif };
      }

      const payload: any = {
        name: data.name,
        price: data.price
      };

      // Only include gif if we have a value (newly uploaded or existing legacy URL)
      // If we switched to JSON and didn't upload new, gifValue is undefined (as existingGif is likely null),
      // so we don't send 'gif', which is good (simulates partial update or no-change).
      if (gifValue !== undefined) {
        payload.gif = gifValue;
      }

      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseData = await res.json();
      if (responseData.success) {
        toast.success('Service updated successfully');
        router.push('/dashboard/services');
      } else {
        toast.error(responseData.message || 'Failed to update service');
      }
    } catch (err) {
      toast.error('Error updating service');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <PageContainer>
        <div className='flex h-[60vh] items-center justify-center'>
          <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
        </div>
      </PageContainer>
    );

  return (
    <PageContainer scrollable>
      <div className='flex flex-1 flex-col space-y-4 p-4 pt-6 md:p-8'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-3xl font-bold tracking-tight'>Edit Service</h2>
        </div>

        <div className='grid grid-cols-1 gap-4'>
          <Card>
            <CardHeader>
              <CardTitle>Edit Service Details</CardTitle>
              <CardDescription>
                Update the service information below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form
                form={form}
                onSubmit={form.handleSubmit(onSubmit)}
                className='w-full max-w-lg space-y-8'
              >
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='price'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹)</FormLabel>
                      <FormControl>
                        <Input type='number' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='gif'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service GIF</FormLabel>
                      <div className='space-y-4'>
                        {existingGif && (
                          <div className='relative w-full max-w-xs overflow-hidden rounded-md border p-2'>
                            {existingGif.endsWith('.json') ? (
                              animationData ? (
                                <div className='bg-muted flex h-32 w-full items-center justify-center overflow-hidden'>
                                  <Lottie
                                    animationData={animationData}
                                    loop={true}
                                    style={{ height: 120, width: 120 }}
                                  />
                                </div>
                              ) : (
                                <div className='bg-muted text-muted-foreground flex h-32 items-center justify-center text-sm'>
                                  Loading Animation...
                                </div>
                              )
                            ) : (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={existingGif}
                                alt='Current GIF'
                                className='h-32 w-full object-cover'
                              />
                            )}
                          </div>
                        )}
                        <FormControl>
                          <FileUploader
                            value={field.value}
                            onValueChange={field.onChange}
                            maxFiles={1}
                            maxSize={4 * 1024 * 1024}
                            accept={{ 'image/gif': [], 'application/json': [] }}
                          />
                        </FormControl>
                        {existingGif && (
                          <p className='text-muted-foreground text-xs'>
                            Upload a new file to replace the current one.
                          </p>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex justify-end gap-4'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => router.push('/dashboard/services')}
                  >
                    Cancel
                  </Button>
                  <Button type='submit' disabled={saving}>
                    {saving && (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    )}
                    Save Changes
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
