'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { getOrders } from '@/lib/api/orders';
import { Order } from '@/constants/data';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Eye, Pencil, Scale, Loader2 } from 'lucide-react';

interface OrdersPageProps {
  className?: string;
}

import { Checkbox } from '@/components/ui/checkbox';
import { useUser } from '@/components/layout/user-provider';

export default function OrdersPage({ className }: OrdersPageProps) {
  const { admin } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [vendors, setVendors] = useState<
    { _id: string; companyName: string }[]
  >([]);
  const [services, setServices] = useState<{ _id: string; name: string }[]>([]);
  const [selectedVendorForAssign, setSelectedVendorForAssign] = useState<
    string | null
  >(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(
    new Set()
  );

  // Add Weight State
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [selectedOrderIdForWeight, setSelectedOrderIdForWeight] = useState<
    string | null
  >(null);
  const [weightInput, setWeightInput] = useState('');
  const [isUpdatingWeight, setIsUpdatingWeight] = useState(false);

  // Fetch Filters on mount
  useEffect(() => {
    async function fetchFilters() {
      try {
        // Vendors
        const resVendors = await fetch('/api/vendors', { cache: 'no-store' });
        const dataVendors = await resVendors.json();
        const rawVendors =
          dataVendors.data?.vendors || dataVendors.vendors || [];
        setVendors(
          rawVendors.map((v: any) => ({
            _id: v._id,
            companyName: v.company_name || v.companyName || 'Unknown Vendor'
          }))
        );

        // Services
        const resServices = await fetch('/api/services', { cache: 'no-store' });
        const dataServices = await resServices.json();
        const rawServices = dataServices.services || [];
        setServices(
          rawServices.map((s: any) => ({
            _id: s._id,
            name: s.name
          }))
        );
      } catch (err) {
        console.error('Failed to fetch filters:', err);
      }
    }
    fetchFilters();
  }, []);

  // Fetch Orders
  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        const response = await getOrders({
          page: pageIndex,
          limit: perPage,
          status: userStatusFilter === 'all' ? '' : userStatusFilter,
          search,
          hub_id: admin?.role === 'hub_user' ? admin.hub_id : undefined
        });

        if (response.success && Array.isArray(response.data)) {
          setOrders(response.data);
          setTotalOrders(response.total || 0);
          setSelectedOrderIds(new Set());
        } else {
          setOrders([]);
          setTotalOrders(0);
          setSelectedOrderIds(new Set());
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
        setTotalOrders(0);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [search, pageIndex, perPage, userStatusFilter, serviceFilter]);

  // Handle Bulk Assign
  const handleBulkAssign = async () => {
    if (!selectedVendorForAssign) return;

    const selectedIds = Array.from(selectedOrderIds);

    if (selectedIds.length === 0) {
      setAlertMessage('⚠️ Please select at least one order to assign.');
      setSelectedVendorForAssign(null);
      return;
    }

    const vendorId = selectedVendorForAssign; // define local var for logging/logic

    console.log(
      `📦 Bulk Assigning ${selectedIds.length} orders to vendor ${vendorId}`,
      selectedIds
    );

    setIsAssigning(true);
    try {
      const response = await fetch('/api/vendor-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendorId,
          order_ids: selectedIds
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAlertMessage(
          `  Successfully assigned ${selectedIds.length} orders to vendor!`
        );
        setSelectedVendorForAssign(null); // Reset selection
        setSelectedOrderIds(new Set()); // Clear checkboxes
        setSearch((prev) => prev + ' '); // Dummy trigger re-fetch
      } else {
        setAlertMessage(`⚠️ ${data.message || 'Failed to assign orders.'}`);
      }
    } catch (error) {
      console.error('Bulk assign failed:', error);
      setAlertMessage('❌ Failed to assign orders.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Selection Handlers
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSet = new Set(
        displayedOrders.filter((o) => !o.vendor_id).map((o) => o.id)
      );
      setSelectedOrderIds(newSet);
    } else {
      setSelectedOrderIds(new Set());
    }
  };

  const toggleSelectOrder = (orderId: string, checked: boolean) => {
    const newSet = new Set(selectedOrderIds);
    if (checked) {
      newSet.add(orderId);
    } else {
      newSet.delete(orderId);
    }
    setSelectedOrderIds(newSet);
  };

  // Filter logic (Client-side search only)
  const filteredOrders = useMemo(() => {
    let result = orders;

    // 1. Service Filter (Client-side)
    if (serviceFilter !== 'all') {
      result = result.filter((o) => {
        const sId =
          typeof (o as any).service_id === 'string'
            ? (o as any).service_id
            : (o as any).service_id?._id;
        return sId === serviceFilter;
      });
    }

    // 2. Search Filter
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.name?.toLowerCase().includes(lowerSearch) ||
          o.plan_name?.toLowerCase().includes(lowerSearch) ||
          o.address_line?.toLowerCase().includes(lowerSearch)
      );
    }
    return result;
  }, [orders, search, serviceFilter]);

  const displayedOrders = filteredOrders;
  const pageCount = Math.max(1, Math.ceil(totalOrders / perPage));

  // Checking "All" state
  const isAllSelected =
    displayedOrders.length > 0 &&
    selectedOrderIds.size === displayedOrders.length;
  const isIndeterminate =
    selectedOrderIds.size > 0 && selectedOrderIds.size < displayedOrders.length; // primitive Checkbox might not support indeterminate via prop directly easily without ref, skipping for now logic-wise

  // Add Weight Handlers
  const openWeightDialog = (orderId: string) => {
    setSelectedOrderIdForWeight(orderId);
    setWeightInput('');
    setWeightDialogOpen(true);
  };

  const handleSaveWeight = async () => {
    if (!selectedOrderIdForWeight || !weightInput) return;

    setIsUpdatingWeight(true);
    try {
      const response = await fetch(
        `/api/orders/order/${selectedOrderIdForWeight}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ used_weight_kg: Number(weightInput) })
        }
      );
      const data = await response.json();

      if (data.success) {
        setAlertMessage('  Weight updated successfully!');
        setWeightDialogOpen(false);
      } else {
        setAlertMessage(`⚠️ ${data.message || 'Failed to update weight'}`);
      }
    } catch (err) {
      console.error('Error updating weight:', err);
      setAlertMessage('❌ Error updating weight');
    } finally {
      setIsUpdatingWeight(false);
    }
  };

  // Cancel order function
  const handleCancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/order/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      console.log(data);

      if (data.success) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: 'cancelled' } : order
          )
        );
        setAlertMessage('  Order cancelled successfully!');
      } else {
        setAlertMessage(`⚠️ ${data.message || 'Failed to cancel the order'}`);
      }
    } catch (error) {
      console.error('Error canceling order:', error);
      setAlertMessage('❌ Something went wrong. Please try again.');
    }
  };
  // ... (handleBulkAssign and selection methods unchanged) ...

  // ...
  return (
    <PageContainer scrollable={true}>
      <div className='flex min-w-0 flex-1 flex-col space-y-4 p-6'>
        {/* Header */}
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <h1 className='text-foreground text-2xl font-bold'>Orders</h1>

          <div className='flex flex-col gap-2 text-sm sm:flex-row sm:items-center'>
            {/* Service Filter */}
            <Select
              value={serviceFilter}
              onValueChange={(val) => {
                setServiceFilter(val);
                setPageIndex(1);
              }}
            >
              <SelectTrigger className='w-[160px]'>
                <SelectValue placeholder='Filter Service' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Services</SelectItem>
                {services.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={userStatusFilter}
              onValueChange={(val) => {
                setUserStatusFilter(val);
                setPageIndex(1);
              }}
            >
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Filter Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Statuses</SelectItem>
                <SelectItem value='scheduled'>Pickup Scheduled</SelectItem>
                <SelectItem value='picked_up'>In Transit to Hub</SelectItem>
                <SelectItem value='processing'>At Hub (Sorting)</SelectItem>
                <SelectItem value='vendor_picked_up'>
                  Sent to Laundry Partner
                </SelectItem>
                <SelectItem value='washing'>Washing / Processing</SelectItem>
                <SelectItem value='service_completed'>
                  Returned to Hub (QC + Packing)
                </SelectItem>
                <SelectItem value='ready'>Ready to deliver</SelectItem>
                <SelectItem value='out_for_delivery'>
                  Out for Delivery
                </SelectItem>
                <SelectItem value='delivered'>Delivered</SelectItem>
                <SelectItem value='cancelled'>Cancelled / Failed</SelectItem>
              </SelectContent>
            </Select>

            {/* Vendor Bulk Assign (Selection + Button) */}
            <div className='flex items-center space-x-2'>
              <Select
                value={selectedVendorForAssign || ''}
                onValueChange={(val) => setSelectedVendorForAssign(val)}
              >
                <SelectTrigger className='w-[200px]'>
                  <SelectValue placeholder='Select Vendor' />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v._id} value={v._id}>
                      {v.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant='default'
                onClick={handleBulkAssign}
                disabled={
                  !selectedVendorForAssign ||
                  selectedOrderIds.size === 0 ||
                  isAssigning
                }
              >
                {isAssigning ? 'Assigning...' : 'Assign'}
              </Button>
            </div>

            <Input
              type='text'
              placeholder='Search orders...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='bg-card text-foreground border-input focus:ring-ring max-w-xs'
            />
          </div>
        </div>

        {/* Table */}
        <div className='border-border bg-card text-foreground overflow-x-auto rounded-lg border shadow-sm'>
          <Table className='w-full border-collapse'>
            <TableHeader className='bg-muted/70 sticky top-0 z-10'>
              <TableRow>
                <TableHead className='w-[50px] pl-4'>
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) =>
                      toggleSelectAll(checked as boolean)
                    }
                  />
                </TableHead>
                <TableHead className='text-foreground/80'>Service</TableHead>
                <TableHead className='text-foreground/80'>Plan Name</TableHead>
                <TableHead className='text-foreground/80'>Name</TableHead>
                <TableHead className='text-foreground/80'>
                  Vendor Status
                </TableHead>
                <TableHead className='text-foreground/80'>Address</TableHead>
                <TableHead className='text-foreground/80'>
                  Delivery Date
                </TableHead>
                <TableHead className='text-foreground/80'>
                  Order Status
                </TableHead>
                {/* <TableHead className='text-foreground/80'>
                  User Status
                </TableHead> */}
                <TableHead className='text-foreground/80'>Emergency</TableHead>
                {admin?.role !== 'hub_user' && (
                  <TableHead className='text-foreground/80'>Hub</TableHead>
                )}
                <TableHead className='text-foreground/80 pr-6 text-right'>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: perPage }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className='bg-muted/40 h-4 w-4' />
                    </TableCell>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className='bg-muted/40 h-6 w-full' />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : displayedOrders.length > 0 ? (
                displayedOrders.map((order, idx) => {
                  const isCancelled = order.status === 'cancelled';
                  const isSelected = selectedOrderIds.has(order.id);
                  return (
                    <TableRow
                      key={order.id ?? idx}
                      className={`transition-colors ${
                        order.emergency
                          ? 'bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <TableCell className='pl-4'>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            toggleSelectOrder(order.id, checked as boolean)
                          }
                          disabled={!!order.vendor_id}
                        />
                      </TableCell>
                      <TableCell className='font-medium'>
                        {/* Display Service Name. Try direct field first, then lookup map */}
                        {(() => {
                          if ((order as any).service_id?.name)
                            return (order as any).service_id.name;
                          if ((order as any).service_name)
                            return (order as any).service_name;
                          const serviceId =
                            typeof (order as any).service_id === 'string'
                              ? (order as any).service_id
                              : (order as any).service_id?._id;
                          const matchedService = services.find(
                            (s) => s._id === serviceId
                          );
                          return matchedService
                            ? matchedService.name
                            : serviceId
                              ? 'Unknown Service'
                              : '—';
                        })()}
                      </TableCell>
                      <TableCell className='font-medium'>
                        {order.plan_name || '—'}
                      </TableCell>

                      <TableCell>
                        {order.name && order.name !== 'N/A'
                          ? order.name
                          : 'Admin'}
                      </TableCell>

                      <TableCell>{order.vendor_status || '—'}</TableCell>
                      <TableCell title={order.address_line || ''}>
                        {order.address_line
                          ? order.address_line.length > 25
                            ? `${order.address_line.substring(0, 25)}...`
                            : order.address_line
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {typeof order.delivery_date === 'string'
                          ? order.delivery_date
                          : '—'}
                      </TableCell>
                      <TableCell>{order.status || '—'}</TableCell>
                      {/* <TableCell>{order.user_status || '—'}</TableCell> */}
                      <TableCell>
                        <span
                          className={`font-semibold ${order.emergency ? 'text-red-600' : ''}`}
                        >
                          {order.emergency ? 'Yes' : 'No'}
                        </span>
                      </TableCell>
                      {/* Hide Hub column for hub_user if desired, OR just show it.
                          If we want to hide it completely, we need to hide the Header too.
                          For now, let's keep it visible so they confirm it's THEIR hub.
                       */}
                      {admin?.role !== 'hub_user' && (
                        <TableCell>
                          {(() => {
                            const hub = order.hub_id || order.hub;
                            if (typeof hub === 'object' && hub?.name) {
                              return hub.name;
                            }
                            if (typeof hub === 'string') {
                              return hub;
                            }
                            return '—';
                          })()}
                        </TableCell>
                      )}

                      <TableCell className='space-x-2 pr-6 text-right'>
                        {/* Add Weight Button */}
                        <Button
                          variant='outline'
                          size='sm'
                          className='hover:bg-accent hover:text-accent-foreground cursor-pointer'
                          onClick={() => openWeightDialog(order.id)}
                        >
                          <Scale className='mr-2 h-4 w-4' />
                          Add Weight
                        </Button>

                        {/* Edit Button - Visible to All */}
                        <Link href={`/dashboard/orders/order/${order.id}/edit`}>
                          <Button
                            variant='outline'
                            size='sm'
                            className='hover:bg-accent hover:text-accent-foreground cursor-pointer'
                          >
                            <Pencil className='mr-2 h-4 w-4' />
                            View
                          </Button>
                        </Link>

                        {/* Cancel Button - Visible only to Super Admins (not hub users) */}
                        {admin?.role !== 'hub_user' && (
                          <>
                            {isCancelled ? (
                              <Button
                                variant='secondary'
                                size='sm'
                                disabled
                                className='ml-2 cursor-not-allowed opacity-70'
                              >
                                Cancelled
                              </Button>
                            ) : (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant='destructive'
                                    size='sm'
                                    className='ml-2 cursor-pointer'
                                  >
                                    Cancel
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Cancel Order
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to cancel this
                                      order? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Close</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleCancelOrder(order.id)
                                      }
                                    >
                                      Confirm Cancel
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className='text-muted-foreground py-10 text-center text-sm'
                  >
                    No results found.
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
              {totalOrders} total orders found.
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
                Page {pageIndex}
                {/* of {pageCount} - API total pagination needed */}
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
                  // disabled={pageIndex >= pageCount}
                  className='size-8'
                >
                  ›
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  // onClick={() => setPageIndex(pageCount)}
                  // disabled={pageIndex >= pageCount}
                  className='hidden size-8 lg:flex'
                >
                  »
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/*   Alert Dialog for messages */}
        {alertMessage && (
          <AlertDialog
            open={!!alertMessage}
            onOpenChange={() => setAlertMessage(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Notification</AlertDialogTitle>
                <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction onClick={() => setAlertMessage(null)}>
                  OK
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Weight Input Dialog */}
        <Dialog open={weightDialogOpen} onOpenChange={setWeightDialogOpen}>
          <DialogContent className='sm:max-w-[425px]'>
            <DialogHeader>
              <DialogTitle>Add Weight (kg)</DialogTitle>
              <DialogDescription>
                Enter the used weight for this order in kilograms.
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-4 items-center gap-4'>
                <span className='text-right text-sm font-medium'>
                  Weight (kg):
                </span>
                <Input
                  id='weight'
                  type='number'
                  className='col-span-3'
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder='e.g., 5.5'
                />
              </div>
            </div>
            <div className='flex justify-end space-x-2'>
              <Button
                variant='outline'
                onClick={() => setWeightDialogOpen(false)}
                disabled={isUpdatingWeight}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveWeight} disabled={isUpdatingWeight}>
                {isUpdatingWeight ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}
