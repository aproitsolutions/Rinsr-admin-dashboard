'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { useEffect, useState } from 'react';

export function RecentSales() {
  const [latestOrders, setLatestOrders] = useState<any[]>([]);

  useEffect(() => {
    async function fetchLatestOrders() {
      try {
        const res = await fetch('/api/orders/latest');
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setLatestOrders(data.orders);
        }
      } catch (err) {
        console.error('Error fetching recent sales:', err);
      }
    }
    fetchLatestOrders();
  }, []);

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
        <CardDescription>Latest sales transactions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-8'>
          {latestOrders.map((order, index) => (
            <div key={index} className='flex items-center'>
              <Avatar className='h-9 w-9'>
                <AvatarImage src={order.avatar} alt='Avatar' />
                <AvatarFallback>{order.fallback}</AvatarFallback>
              </Avatar>
              <div className='ml-4 space-y-1'>
                <p className='text-sm leading-none font-medium'>{order.name}</p>
                <p className='text-muted-foreground text-sm'>{order.email}</p>
              </div>
              <div className='ml-auto font-medium'>{order.amount}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
