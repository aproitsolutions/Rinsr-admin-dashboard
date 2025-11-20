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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface HubOption {
  _id: string;
  name: string;
}

interface VendorOption {
  _id: string;
  company_name: string;
  status?: string;
  location?: string;
  phone_number?: string;
}

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  //   console.log("orders array",orders)
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(
    new Set()
  );
  const [hubs, setHubs] = useState<HubOption[]>([]);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [selectedHubId, setSelectedHubId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  // Fetch hubs
  useEffect(() => {
    async function fetchHubs() {
      try {
        const res = await fetch('/api/hubs');
        const data = await res.json();
        const raw =
          data.hubs ||
          data.data?.hubs ||
          (Array.isArray(data) ? data : []) ||
          [];

        setHubs(
          raw.map((hub: any) => ({
            _id: hub._id,
            name: hub.name || 'Unnamed Hub'
          }))
        );
      } catch (err) {
        console.error('Failed to fetch hubs:', err);
      }
    }
    fetchHubs();
  }, []);

  // Fetch vendors
  useEffect(() => {
    async function fetchVendors() {
      try {
        const res = await fetch('/api/vendors');
        const data = await res.json();
        const raw =
          data.vendors ||
          data.data?.vendors ||
          (Array.isArray(data) ? data : []) ||
          [];
        setVendors(
          raw.map((vendor: any) => ({
            _id: vendor._id,
            company_name:
              vendor.company_name || vendor.companyName || 'Unknown',
            status: vendor.status || 'N/A',
            location: vendor.location || '—',
            phone_number: vendor.phone_number || '—'
          }))
        );
      } catch (err) {
        console.error('Failed to fetch vendors:', err);
      }
    }
    fetchVendors();
  }, []);

  // Fetch orders
  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        const response = await getOrders({
          page: pageIndex,
          limit: perPage,
          search
        });

        if (response.success && Array.isArray(response.data)) {
          setOrders(response.data);
          console.log('API order:', response.data[0]);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [search, pageIndex, perPage]);

  const vendorMap = useMemo(() => {
    const map = new Map<string, VendorOption>();
    vendors.forEach((vendor) => {
      map.set(vendor._id, vendor);
    });
    return map;
  }, [vendors]);
  // console.log(orders);
  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;
    return orders.filter((order) => {
      const vendorId =
        typeof order.vendor_id === 'string'
          ? order.vendor_id
          : typeof order.vendor_id === 'object'
            ? order.vendor_id?._id
            : typeof order.vendor === 'string'
              ? order.vendor
              : typeof order.vendor === 'object'
                ? order.vendor?._id
                : '';
      const vendor = (vendorId && vendorMap.get(vendorId)) || null;
      const vendorMatches =
        vendor?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
        vendor?.location?.toLowerCase().includes(search.toLowerCase()) ||
        vendor?.phone_number?.toLowerCase().includes(search.toLowerCase());

      return (
        vendorMatches ||
        order.name?.toLowerCase().includes(search.toLowerCase()) ||
        order.plan_name?.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [orders, search, vendorMap]);

  const start = (pageIndex - 1) * perPage;
  const end = start + perPage;
  const displayedOrders = filteredOrders.slice(start, end);
  const pageCount = Math.max(
    1,
    Math.ceil((filteredOrders.length || 0) / perPage)
  );

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.size === displayedOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(displayedOrders.map((o) => o.id)));
    }
  };

  // Assign hub to selected orders using bulk API
  const handleAssignHub = async () => {
    if (!selectedHubId) {
      toast.error('Please select a hub');
      return;
    }

    if (selectedOrderIds.size === 0) {
      toast.error('Please select at least one order');
      return;
    }

    setAssigning(true);
    const orderIdsArray = Array.from(selectedOrderIds);

    try {
      const res = await fetch('/api/orders/bulk/assign-hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hub_id: selectedHubId,
          order_ids: orderIdsArray
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          `Hub assigned to ${orderIdsArray.length} order(s) successfully`
        );
        setSelectedOrderIds(new Set());
        setSelectedHubId('');
        const response = await getOrders({
          page: pageIndex,
          limit: perPage,
          search
        });
        if (response.success && Array.isArray(response.data)) {
          setOrders(response.data);
        }
      } else {
        toast.error(data.message || 'Failed to assign hub');
      }
    } catch (error) {
      console.error('Error assigning hub:', error);
      toast.error('Something went wrong while assigning hub');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4 p-6'>
        <div className='flex w-full items-center justify-between gap-2'>
          <h1 className='text-foreground text-2xl font-bold'>Vendor Orders</h1>
          <Input
            type='text'
            placeholder='Search by vendor, order, or plan...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='bg-card text-foreground border-input focus:ring-ring max-w-xs'
          />
        </div>

        {selectedOrderIds.size > 0 && (
          <div className='border-border bg-card text-foreground flex items-center gap-4 rounded-lg border p-4 shadow-sm'>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium'>
                {selectedOrderIds.size} order(s) selected
              </span>
            </div>
            <div className='flex flex-1 items-center gap-3'>
              <Select value={selectedHubId} onValueChange={setSelectedHubId}>
                <SelectTrigger className='bg-background text-foreground border-input w-[250px]'>
                  <SelectValue placeholder='Select hub to assign' />
                </SelectTrigger>
                <SelectContent className='bg-card text-foreground'>
                  {hubs.map((hub) => (
                    <SelectItem key={hub._id} value={hub._id}>
                      {hub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAssignHub}
                disabled={!selectedHubId || assigning}
                className='whitespace-nowrap'
              >
                {assigning ? 'Assigning...' : 'Assign Hub'}
              </Button>
              <Button
                variant='outline'
                onClick={() => setSelectedOrderIds(new Set())}
                disabled={assigning}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}

        <div className='border-border bg-card text-foreground overflow-x-auto rounded-lg border shadow-sm'>
          <Table className='w-full border-collapse'>
            <TableHeader className='bg-muted/70 sticky top-0 z-10'>
              <TableRow>
                <TableHead className='text-foreground/80 w-12'>
                  <Checkbox
                    checked={
                      displayedOrders.length > 0 &&
                      displayedOrders.every((o) => selectedOrderIds.has(o.id))
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className='text-foreground/80'>Vendor</TableHead>
                <TableHead className='text-foreground/80'>
                  Vendor Status
                </TableHead>
                <TableHead className='text-foreground/80'>Location</TableHead>
                <TableHead className='text-foreground/80'>Contact</TableHead>
                <TableHead className='text-foreground/80'>Order</TableHead>
                {/* <TableHead className='text-foreground/80'>Order Status</TableHead> */}
                <TableHead className='text-foreground/80'>Hub</TableHead>
                <TableHead className='text-foreground/80 pr-6 text-right'>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: perPage }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className='bg-muted/40 h-6 w-full' />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : displayedOrders.length > 0 ? (
                displayedOrders.map((order, idx) => {
                  const vendorId =
                    typeof order.vendor_id === 'string'
                      ? order.vendor_id
                      : typeof order.vendor_id === 'object'
                        ? order.vendor_id?._id
                        : typeof order.vendor === 'string'
                          ? order.vendor
                          : typeof order.vendor === 'object'
                            ? order.vendor?._id
                            : '';
                  const resolvedVendor =
                    typeof order.vendor === 'object'
                      ? order.vendor
                      : typeof order.vendor_id === 'object'
                        ? order.vendor_id
                        : vendorMap.get(vendorId);

                  const hub = order.hub_id || order.hub;

                  return (
                    <TableRow key={order.id ?? idx}>
                      <TableCell>
                        <Checkbox
                          checked={selectedOrderIds.has(order.id)}
                          onCheckedChange={() => toggleOrderSelection(order.id)}
                        />
                      </TableCell>
                      <TableCell className='font-medium'>
                        {resolvedVendor?.company_name || '—'}
                      </TableCell>
                      {/* <TableCell>{order.vendor_status || '—'}</TableCell> */}

                      <TableCell> {resolvedVendor?.location || '—'}</TableCell>
                      <TableCell>
                        {resolvedVendor?.phone_number || '—'}
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-col text-sm'>
                          <span className='font-semibold'>
                            Plan: {order.plan_name || '—'}
                          </span>
                          <span>Pickup: {order.pickup_time_slot || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{order.status || '—'}</TableCell>
                      <TableCell>
                        {typeof hub === 'object'
                          ? hub?.name || '—'
                          : hub || '—'}
                      </TableCell>
                      <TableCell className='space-x-2 pr-6 text-right'>
                        <Link href={`/dashboard/orders/order/${order.id}/edit`}>
                          <Button variant='outline' size='sm'>
                            View / Edit
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className='text-muted-foreground py-10 text-center text-sm'
                  >
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className='border-border bg-card text-foreground border-t p-3'>
          <div className='flex w-full flex-wrap items-center justify-between gap-4 sm:gap-8'>
            <div className='text-muted-foreground text-sm'>
              {filteredOrders.length} total orders found.
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
