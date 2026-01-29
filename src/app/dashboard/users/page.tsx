'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
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
} from '@/components/ui/select';
import { Pencil, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, UserCheck, UserX, Crown } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
  is_subscribed?: boolean;
  plan_name?: string;
  createdAt?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [report, setReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(true);

  const [pageIndex, setPageIndex] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [totalUsers, setTotalUsers] = useState(0);

  // 🔹 Fetch customers report
  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch('/api/customers');
        const data = await res.json();
        if (data.success) setReport(data.data?.summary || data.summary);
      } catch (err) {
        console.error('Error fetching customer report:', err);
      } finally {
        setReportLoading(false);
      }
    }
    fetchReport();
  }, []);

  // 🔹 Fetch users with Server-Side Pagination
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: pageIndex.toString(),
          limit: perPage.toString(),
          search: search
        });

        const res = await fetch(`/api/users?${params.toString()}`, {
          cache: 'no-store'
        });
        const data = await res.json();

        if (data.users) {
          setUsers(data.users);
          setTotalUsers(data.total || 0);
        } else if (data.success && Array.isArray(data.data)) {
          // Fallback if structure is different
          setUsers(data.data);
          setTotalUsers(data.total || 0);
        } else {
          setUsers([]);
          setTotalUsers(0);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setUsers([]);
        setTotalUsers(0);
      } finally {
        setLoading(false);
      }
    }

    // Debounce search optional, but for now simple effect
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 500); // 500ms debounce for search

    return () => clearTimeout(timeoutId);
  }, [pageIndex, perPage, search]);

  const pageCount = Math.max(1, Math.ceil(totalUsers / perPage));

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6 p-6'>
        {/*   Customer Stats Section */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader>
              <CardDescription>Total Customers</CardDescription>
              <CardTitle className='text-2xl font-semibold'>
                {reportLoading ? '...' : report?.totalCustomers || 0}
              </CardTitle>
              <Badge variant='outline'>
                <Users className='mr-1 h-4 w-4' /> All
              </Badge>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Verified Customers</CardDescription>
              <CardTitle className='text-2xl font-semibold'>
                {reportLoading ? '...' : report?.verifiedCustomers || 0}
              </CardTitle>
              <Badge variant='outline'>
                <UserCheck className='mr-1 h-4 w-4' /> Verified
              </Badge>
            </CardHeader>
          </Card>

          {/* <Card>
            <CardHeader>
              <CardDescription>Active Customers</CardDescription>
              <CardTitle className='text-2xl font-semibold'>
                {reportLoading ? '...' : report?.activeCustomers || 0}
              </CardTitle>
              <Badge variant='outline'><TrendingUp className='w-4 h-4 mr-1' /> Active</Badge>
            </CardHeader>
          </Card> */}

          <Card>
            <CardHeader>
              <CardDescription>Subscribed Customers</CardDescription>
              <CardTitle className='text-2xl font-semibold'>
                {reportLoading ? '...' : report?.subscribedCustomers || 0}
              </CardTitle>
              <Badge variant='outline'>
                <Crown className='mr-1 h-4 w-4' /> Premium
              </Badge>
            </CardHeader>
          </Card>
        </div>

        {/* 🔍 Search + Table */}
        <div className='mt-4 flex w-full items-center justify-between gap-2'>
          <h1 className='text-foreground text-2xl font-bold'>Customers</h1>
          <Input
            placeholder='Search users...'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageIndex(1);
            }}
            className='bg-card text-foreground border-input focus:ring-ring max-w-xs'
          />
        </div>

        {/* 📋 Table */}
        <div className='border-border bg-card text-foreground overflow-x-auto rounded-lg border shadow-sm transition-colors'>
          <Table className='w-full border-collapse'>
            <TableHeader className='bg-muted/70 sticky top-0 z-10'>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Subscribed</TableHead>
                <TableHead>Plan Name</TableHead>
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
              ) : users.length > 0 ? (
                users.map((user, idx) => (
                  <TableRow
                    key={user._id}
                    className={cn(
                      'hover:bg-accent transition-colors',
                      idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                    )}
                  >
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || '—'}</TableCell>
                    <TableCell>{user.role || 'User'}</TableCell>
                    <TableCell>
                      {user.is_subscribed ? (
                        <span className='rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400'>
                          Yes
                        </span>
                      ) : (
                        <span className='text-muted-foreground text-sm'>
                          No
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{user.plan_name || '—'}</TableCell>
                    <TableCell className='pr-6 text-right'>
                      <Link href={`/dashboard/users/${user._id}/edit`}>
                        <Button variant='outline' size='sm'>
                          <Pencil className='mr-2 h-4 w-4' /> View
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
                    No users found.
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
              {totalUsers} total users found.
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
                Page {pageIndex} of {pageCount}
              </div>

              <div className='flex items-center space-x-2'>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => setPageIndex(1)}
                  disabled={pageIndex <= 1}
                  className='hidden size-8 lg:flex'
                >
                  «
                </Button>
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
                    setPageIndex((p) => Math.min(pageCount, p + 1))
                  }
                  disabled={pageIndex >= pageCount}
                  className='size-8'
                >
                  ›
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => setPageIndex(pageCount)}
                  disabled={pageIndex >= pageCount}
                  className='hidden size-8 lg:flex'
                >
                  »
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
