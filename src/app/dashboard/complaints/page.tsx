'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'; // Corrected import source to @/components/ui/select
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Complaint {
  _id: string;
  user_id: string;
  subject: string;
  user_name: string;
  description: string;
  status: string;
  ticket_id: string;
  createdAt: string;
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalComplaints, setTotalComplaints] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchComplaints() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: pageIndex.toString(),
          limit: perPage.toString()
        });

        const res = await fetch(`/api/complaints?${params.toString()}`, {
          cache: 'no-store'
        });
        const data = await res.json();
        // console.log('Complaints data fetched successfully', data);
        if (data.complaints) {
          setComplaints(data.complaints);
          setTotalComplaints(data.total || 0);
          setTotalPages(data.totalPages || 1);
        } else {
          setComplaints([]);
          setTotalComplaints(0);
        }
      } catch (err) {
        console.error('Error fetching complaints:', err);
        setComplaints([]);
      } finally {
        setLoading(false);
      }
    }

    fetchComplaints();
  }, [pageIndex, perPage]);

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6 p-6'>
        <div className='flex w-full items-center justify-between gap-2'>
          <h1 className='text-foreground text-2xl font-bold'>Complaints</h1>
        </div>

        <div className='border-border bg-card text-foreground overflow-x-auto rounded-lg border shadow-sm transition-colors'>
          <Table className='w-full border-collapse'>
            <TableHeader className='bg-muted/70 sticky top-0 z-10'>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='pr-6 text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: perPage }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className='bg-muted/50 h-5 w-full' />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : complaints.length > 0 ? (
                complaints.map((complaint, idx) => (
                  <TableRow
                    key={complaint._id}
                    className={cn(
                      'hover:bg-accent transition-colors',
                      idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                    )}
                  >
                    <TableCell className='font-mono font-medium'>
                      {complaint.ticket_id}
                    </TableCell>
                    <TableCell>
                      {complaint.subject.length > 20
                        ? `${complaint.subject.substring(0, 20)}...`
                        : complaint.subject}
                    </TableCell>
                    <TableCell>{complaint.user_name}</TableCell>
                    <TableCell>
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant='outline'
                        className={cn(
                          complaint.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : complaint.status === 'resolved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                        )}
                      >
                        {complaint.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className='pr-6 text-right'>
                      <Link href={`/dashboard/complaints/${complaint._id}`}>
                        <Button variant='outline' size='sm'>
                          <Eye className='mr-2 h-4 w-4' /> View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className='text-muted-foreground py-10 text-center'
                  >
                    No complaints found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className='border-border bg-card text-foreground border-t p-3'>
          <div className='flex w-full flex-wrap items-center justify-between gap-4 sm:gap-8'>
            <div className='text-muted-foreground text-sm'>
              {totalComplaints} total complaints
            </div>

            <div className='flex items-center gap-4 sm:gap-6 lg:gap-8'>
              <div className='flex items-center space-x-2'>
                <p className='text-sm font-medium whitespace-nowrap'>
                  Rows per page
                </p>
                <Select
                  value={`${perPage}`}
                  onValueChange={(value) => {
                    setPageIndex(1);
                    setPerPage(Number(value));
                  }}
                >
                  <SelectTrigger className='border-input bg-background text-foreground h-8 w-[4.5rem] border'>
                    <SelectValue placeholder={perPage} />
                  </SelectTrigger>
                  <SelectContent side='top' className='bg-card text-foreground'>
                    {[10, 20, 30, 40, 50].map((n) => (
                      <SelectItem key={n} value={`${n}`}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='text-sm font-medium'>
                Page {pageIndex} of {totalPages}
              </div>

              <div className='flex items-center space-x-2'>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                  disabled={pageIndex <= 1}
                  className='size-8'
                >
                  ‹
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() =>
                    setPageIndex((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={pageIndex >= totalPages}
                  className='size-8'
                >
                  ›
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
