'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconPlus } from '@tabler/icons-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog';

interface PlanService {
  serviceId: string;
  name: string;
  _id: string;
}

interface Plan {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  validity_days: number;
  weight_limit_kg: number;
  pickups_per_month: number;
  features: string[];
  services: PlanService[];
  extra_kg_rate: number;
  rollover_limit_months: number;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 🧠 Fetch all plans
  useEffect(() => {
    async function fetchPlans() {
      setLoading(true);
      try {
        const response = await fetch('/api/plans', { cache: 'no-store' });
        const data = await response.json();

        if (data.success && Array.isArray(data.plans)) {
          setPlans(data.plans);
        } else {
          setPlans([]);
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
        setPlans([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPlans();
  }, []);

  // 🗑️ Delete plan (calls your API -> external RINSR -> DB)
  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/plans/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Remove deleted plan from table immediately
        setPlans((prev) => prev.filter((p) => p._id !== id));
      } else {
        console.error('Delete failed:', data.message || 'Unknown error');
      }
    } catch (err) {
      console.error('Error deleting plan:', err);
    } finally {
      setDeleting(false);
      setAlertOpen(false);
      setSelectedId(null);
    }
  }

  // 🔍 Filter
  const filteredPlans = useMemo(() => {
    if (!search.trim()) return plans;
    return plans.filter(
      (plan) =>
        plan.name?.toLowerCase().includes(search.toLowerCase()) ||
        plan.description?.toLowerCase().includes(search.toLowerCase())
    );
  }, [plans, search]);

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4 p-6'>
        {/* Header */}
        <div className='flex w-full items-center justify-between gap-2'>
          <h1 className='text-foreground text-2xl font-bold'>Plans</h1>
          <div className='flex items-center gap-2'>
            <Input
              placeholder='Search plans...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='bg-card text-foreground border-input focus:ring-ring max-w-xs'
            />
            <Link
              href='/dashboard/plans/new'
              className={cn(buttonVariants(), 'text-xs md:text-sm')}
            >
              <IconPlus className='mr-2 h-4 w-4' /> Add New
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className='border-border bg-card text-foreground overflow-x-auto rounded-lg border shadow-sm transition-colors'>
          <Table className='w-full border-collapse'>
            <TableHeader className='bg-muted/70 sticky top-0 z-10'>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration (Days)</TableHead>
                <TableHead>Weight Limit (kg)</TableHead>
                <TableHead>Pickups / Month</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='pr-6 text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className='bg-muted/50 h-5 w-full' />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredPlans.length > 0 ? (
                filteredPlans.map((plan, idx) => (
                  <TableRow
                    key={plan._id}
                    className={cn(
                      'hover:bg-accent hover:text-accent-foreground transition-colors',
                      idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                    )}
                  >
                    <TableCell className='font-medium'>{plan.name}</TableCell>
                    <TableCell>{plan.description || '—'}</TableCell>
                    <TableCell>₹{plan.price}</TableCell>
                    <TableCell>{plan.validity_days ?? '—'}</TableCell>
                    <TableCell>{plan.weight_limit_kg ?? '—'}</TableCell>
                    <TableCell>{plan.pickups_per_month ?? '—'}</TableCell>
                    <TableCell>
                      {plan.is_active === true
                        ? 'Active'
                        : plan.is_active === false
                          ? 'Inactive'
                          : '—'}
                    </TableCell>

                    {/*   Actions Column */}
                    <TableCell className='pr-6 text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        <Link href={`/dashboard/plans/${plan._id}/edit`}>
                          <Button
                            variant='outline'
                            size='sm'
                            className='hover:bg-accent hover:text-accent-foreground cursor-pointer'
                          >
                            <Pencil className='mr-2 h-4 w-4' />
                            Edit
                          </Button>
                        </Link>

                        <Button
                          className='cursor-pointer'
                          variant={plan.is_active ? 'destructive' : 'outline'}
                          size='sm'
                          disabled={plan.is_active === false}
                          onClick={() => {
                            if (plan.is_active) {
                              setSelectedId(plan._id);
                              setAlertOpen(true);
                            }
                          }}
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          {plan.is_active === true
                            ? 'Disable'
                            : plan.is_active === false
                              ? 'Inactive'
                              : '—'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-muted-foreground py-10 text-center text-sm'
                  >
                    No plans found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 🧩 Delete Confirmation */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this plan from the database. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              onClick={() => selectedId && handleDelete(selectedId)}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
