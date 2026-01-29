'use client';

import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import React, { useEffect, useState } from 'react';

export default function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOverview() {
      try {
        const res = await fetch('/api/reports');
        const json = await res.json();

        if (json.success && json.data?.success) {
          setData(json.data.summary);
        } else {
          console.error('Failed to load report data:', json.message);
        }
      } catch (err) {
        console.error('Error fetching report data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <p className='text-muted-foreground p-6'>Loading dashboard...</p>
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer>
        <p className='text-destructive p-6'>Failed to load dashboard data.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex flex-col items-start justify-between space-y-1'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Dashboard Overview
          </h2>
          <h3>
            <span className='text-[20px] font-light tracking-tight'>
              Monitor your laundry service operations in real-time
            </span>
          </h3>
        </div>

        {/*   Stats Cards with Real Data */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader>
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className='text-2xl font-semibold'>
                ₹{data.totalRevenue?.toLocaleString() || 0}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconTrendingUp />
                  +0%
                </Badge>
              </CardAction>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Total Users</CardDescription>
              <CardTitle className='text-2xl font-semibold'>
                {data.totalUsers}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconTrendingUp />
                  Active
                </Badge>
              </CardAction>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Total Orders</CardDescription>
              <CardTitle className='text-2xl font-semibold'>
                {data.totalOrders}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconTrendingUp />+{data.currentMonthOrders}
                </Badge>
              </CardAction>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Cancelled Orders</CardDescription>
              <CardTitle className='text-destructive text-2xl font-semibold'>
                {data.ordersByStatus?.cancelled || 0}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconTrendingDown />-
                  {(
                    (data.ordersByStatus?.cancelled / data.totalOrders) *
                    100
                  ).toFixed(1)}
                  %
                </Badge>
              </CardAction>
            </CardHeader>
          </Card>
        </div>

        {/* Charts */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>{bar_stats}</div>
          <div className='col-span-4 md:col-span-3'>{sales}</div>
          {/* <div className='col-span-4'>{area_stats}</div> */}
          <div className='col-span-4 md:col-span-3'>{pie_stats}</div>
        </div>
      </div>
    </PageContainer>
  );
}
