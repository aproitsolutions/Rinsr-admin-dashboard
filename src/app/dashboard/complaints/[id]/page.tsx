'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Corrected import source
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Calendar, Tag, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Added missing import

interface Complaint {
  _id: string;
  user_id: string;
  subject: string;
  user_name: string;
  description: string;
  status: string;
  ticket_id: string;
  createdAt: string;
  images: string[];
}

export default function ComplaintDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!id) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (data.success || res.ok) {
        setComplaint((prev) => (prev ? { ...prev, status: newStatus } : null));
      } else {
        console.error('Failed to update status:', data.message);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    params.then((unwrap) => setId(unwrap.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    async function fetchComplaint() {
      setLoading(true);
      try {
        const res = await fetch(`/api/complaints/${id}`);
        const data = await res.json();
        console.log('DEBUG: Single complaint API response:', data);
        if (data.success === false) {
          console.error('Failed to fetch complaint:', data.message);
        } else {
          // Handle both wrapped and unwrapped responses if API varies
          // Check for common keys: data, complaint, or direct object
          const complaintData = data.data || data.complaint || data;
          console.log('DEBUG: Setting complaint to:', complaintData);
          setComplaint(complaintData);
        }
      } catch (err) {
        console.error('Error fetching complaint details:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchComplaint();
  }, [id]);

  if (loading) {
    return (
      <PageContainer>
        <div className='space-y-4 p-6'>
          <Skeleton className='h-8 w-1/3' />
          <Skeleton className='h-64 w-full' />
        </div>
      </PageContainer>
    );
  }

  if (!complaint) {
    return (
      <PageContainer>
        <div className='flex flex-col items-center justify-center space-y-4 p-10 text-center'>
          <h2 className='text-2xl font-bold'>Complaint Not Found</h2>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6 p-6'>
        {/* Header */}
        <div className='flex items-center gap-4'>
          <Button variant='outline' size='icon' onClick={() => router.back()}>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div className='flex flex-col'>
            <h1 className='text-foreground text-2xl font-bold'>
              {complaint.subject}
            </h1>
            <p className='text-muted-foreground flex items-center gap-2 text-sm'>
              <Tag className='h-3 w-3' />
              {complaint.ticket_id}
            </p>
          </div>
          <div className='ml-auto'>
            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground mr-2 text-sm'>
                Status:
              </span>
              <Select
                disabled={updating}
                value={complaint.status}
                onValueChange={handleStatusUpdate}
              >
                <SelectTrigger className='h-8 w-[140px]'>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='resolved'>Resolved</SelectItem>
                  <SelectItem value='rejected'>Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Badge
                variant='outline'
                className={cn(
                  'hidden px-3 py-1 text-base md:inline-flex', // Hide badge on small screens if select is clear enough, or keep both
                  (complaint.status || 'unknown') === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : (complaint.status || 'unknown') === 'resolved'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                )}
              >
                {complaint.status ? complaint.status.toUpperCase() : 'UNKNOWN'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          {/* Main Info */}
          <div className='space-y-6 md:col-span-2'>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm leading-relaxed whitespace-pre-wrap'>
                  {complaint.description}
                </p>
              </CardContent>
            </Card>

            {/* Images Section */}
            {complaint.images && complaint.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex flex-wrap gap-4'>
                    {complaint.images.map((img, idx) => (
                      <div
                        key={idx}
                        className='relative h-40 w-40 overflow-hidden rounded-md border'
                      >
                        {/* Use simple img for now, could be replaced with Image component if domain configured */}
                        <img
                          src={img}
                          alt={`Evidence ${idx + 1}`}
                          className='h-full w-full object-cover'
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Info */}
          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Ticket Info</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 rounded-full p-2'>
                    <User className='text-primary h-4 w-4' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-xs'>
                      Submitted By
                    </p>
                    <p className='text-sm font-medium'>{complaint.user_name}</p>
                  </div>
                </div>

                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 rounded-full p-2'>
                    <Calendar className='text-primary h-4 w-4' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-xs'>
                      Date Created
                    </p>
                    <p className='text-sm font-medium'>
                      {new Date(complaint.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {/* ID for debugging/reference */}
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 rounded-full p-2'>
                    <AlertCircle className='text-primary h-4 w-4' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-xs'>System ID</p>
                    <p
                      className='text-muted-foreground w-32 truncate font-mono text-xs'
                      title={complaint._id}
                    >
                      {complaint._id}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
