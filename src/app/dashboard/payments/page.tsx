'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw } from 'lucide-react';
import { getPayments } from '@/lib/api/payments';
import { Payment } from '@/constants/data';
import { useUser } from '@/components/layout/user-provider';
import PageContainer from '@/components/layout/page-container';

export default function PaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { admin } = useUser();

  // -- State --
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);

  // -- Filters --
  const pageParam = searchParams.get('page');
  const pageIndex = pageParam ? parseInt(pageParam) : 1;
  const [search, setSearch] = useState('');
  const perPage = 10;

  // -- Fetch Data --
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getPayments({
        page: pageIndex,
        limit: perPage,
        search: search.trim()
      });

      if (res.success && res.payments) {
        setPayments(res.payments);
        setTotalPayments(res.total || 0);
        setPageCount(Math.ceil((res.total || 0) / perPage));
      } else {
        setPayments([]);
        setTotalPayments(0);
        setPageCount(1);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [pageIndex, search]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pageCount) {
      router.push(`/dashboard/payments?page=${page}`);
    }
  };

  if (!admin) return <div className='p-8 text-center'>Loading admin...</div>;

  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;

    let startPage = Math.max(1, pageIndex - Math.floor(maxVisible / 2));
    let endPage = Math.min(pageCount, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            href='#'
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(i);
            }}
            isActive={pageIndex === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (startPage > 1) {
      if (startPage > 2) {
        items.unshift(
          <PaginationItem key='start-ellipsis'>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      items.unshift(
        <PaginationItem key={1}>
          <PaginationLink
            href='#'
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(1);
            }}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < pageCount) {
      if (endPage < pageCount - 1) {
        items.push(
          <PaginationItem key='end-ellipsis'>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      items.push(
        <PaginationItem key={pageCount}>
          <PaginationLink
            href='#'
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(pageCount);
            }}
          >
            {pageCount}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6 p-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <h1 className='text-2xl font-bold'>Payments</h1>
            <Button onClick={fetchData} variant='outline' size='sm'>
              <RefreshCw className='mr-2 h-4 w-4' />
              Refresh
            </Button>
          </div>
          <div className='flex items-center gap-2'>
            <div className='relative'>
              <Search className='text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4' />
              <Input
                placeholder='Search transactions...'
                className='w-full pl-8 md:w-[250px]'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className='border-border bg-card text-foreground overflow-x-auto rounded-lg border shadow-sm transition-colors'>
          <Table className='w-full border-collapse'>
            <TableHeader className='bg-muted/70 sticky top-0 z-10'>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Razorpay ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Order Status</TableHead>
                <TableHead>Payment For</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className='h-16 text-center'>
                      <div className='flex h-full items-center justify-center'>
                        Loading...
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-muted-foreground h-32 text-center'
                  >
                    No payments found.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => {
                  const order = payment.order_id;
                  const orderId =
                    order && typeof order === 'object'
                      ? order._id || order.id
                      : '—';
                  const userName =
                    order && typeof order === 'object' && order.user_id
                      ? typeof order.user_id === 'object' &&
                        'name' in order.user_id
                        ? order.user_id.name
                        : typeof order.user_id === 'string'
                          ? order.user_id
                          : 'User'
                      : '—';

                  const amount =
                    order && typeof order === 'object'
                      ? order.total_price
                      : '—';
                  const orderStatus =
                    order && typeof order === 'object' ? order.status : '—';

                  // Get exact payment status from API - check payment object first, then order
                  const paymentStatus =
                    payment.status ||
                    (order && typeof order === 'object'
                      ? order.payment_status
                      : null) ||
                    '—';

                  // Determine badge color based on status
                  const getStatusColor = (paymentStatus: string) => {
                    const statusLower = paymentStatus.toLowerCase();
                    if (statusLower === 'captured' || statusLower === 'paid') {
                      return 'bg-green-600 hover:bg-green-700 text-white';
                    } else if (
                      statusLower === 'pending' ||
                      statusLower === 'created'
                    ) {
                      return 'bg-yellow-500 hover:bg-yellow-600 text-white';
                    } else if (statusLower === 'failed') {
                      return 'bg-red-600 hover:bg-red-700 text-white';
                    } else {
                      return 'bg-gray-500 hover:bg-gray-600 text-white';
                    }
                  };

                  return (
                    <TableRow
                      key={payment._id}
                      className='hover:bg-accent transition-colors'
                    >
                      <TableCell className='font-mono text-xs font-semibold'>
                        {String(orderId).slice(-6).toUpperCase()}
                      </TableCell>
                      <TableCell className='font-medium'>{userName}</TableCell>
                      <TableCell className='font-mono text-xs'>
                        {payment.razorpay_payment_id || '—'}
                      </TableCell>
                      <TableCell className='text-primary font-semibold'>
                        ₹{amount}
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline' className='capitalize'>
                          {orderStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline' className='capitalize'>
                          {payment.payment_for}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(paymentStatus)}>
                          {paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-muted-foreground text-xs whitespace-nowrap'>
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {pageCount > 1 && (
          <div className='mt-4 flex w-full items-center justify-between px-2'>
            <div className='text-muted-foreground text-sm'>
              Showing {payments.length} of {totalPayments} payments
            </div>
            <Pagination className='mx-0 w-auto'>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href='#'
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(pageIndex - 1);
                    }}
                    className={
                      pageIndex <= 1
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
                {renderPaginationItems()}
                <PaginationItem>
                  <PaginationNext
                    href='#'
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(pageIndex + 1);
                    }}
                    className={
                      pageIndex >= pageCount
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
