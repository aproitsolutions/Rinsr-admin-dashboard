'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod'; // Ensure zod is installed, if not, remove resolver and validaton
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  price: z.coerce
    .number()
    .min(0, { message: 'Price must be a positive number.' }),
  gif: z.array(z.instanceof(File)).optional()
});

type ServiceFormValues = z.infer<typeof formSchema>;

export default function NewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      price: 0,
      gif: []
    }
  });

  const onSubmit = async (data: ServiceFormValues) => {
    setLoading(true);
    try {
      let gifValue = undefined;

      // Standard upload for all file types (JSON included)
      if (data.gif && data.gif.length > 0) {
        const file = data.gif[0];
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        const uploadData = await uploadRes.json();

        if (uploadData.success && uploadData.url) {
          gifValue = { url: uploadData.url };
        } else {
          toast.error('Failed to upload file');
          setLoading(false);
          return;
        }
      }

      const payload = {
        name: data.name,
        price: data.price,
        gif: gifValue
      };

      const res = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseData = await res.json();

      if (responseData.success) {
        toast.success('Service created successfully');
        router.push('/dashboard/services');
      } else {
        toast.error(responseData.message || 'Failed to create service');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer scrollable>
      <div className='flex flex-1 flex-col space-y-4 p-4 pt-6 md:p-8'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-3xl font-bold tracking-tight'>Create Service</h2>
        </div>

        <div className='grid grid-cols-1 gap-4'>
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
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
                        <Input placeholder='e.g. Premium Fold' {...field} />
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
                        <Input type='number' placeholder='250' {...field} />
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
                      <FormControl>
                        <FileUploader
                          value={field.value}
                          onValueChange={field.onChange}
                          maxFiles={1}
                          maxSize={4 * 1024 * 1024}
                          accept={{ 'image/gif': [], 'application/json': [] }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex justify-end gap-4'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button type='submit' disabled={loading}>
                    {loading && (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    )}
                    Create Service
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
