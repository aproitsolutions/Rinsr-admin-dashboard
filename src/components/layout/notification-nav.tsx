'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Bell, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/providers/socket-provider';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  _id: string;
  title: string;
  body: string;
  vendor_order_id?: string;
  status: 'read' | 'unread';
  type: string;
  createdAt: string;
}

interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
  total: number;
}

export function NotificationNav() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const { socket } = useSocket();

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => {
      console.log('🔔 Socket event received, refreshing notifications...');
      fetchNotifications();
    };
    socket.on('vendor_order_dispatched', handleRefresh);
    socket.on('vendor_order_declined', handleRefresh);
    return () => {
      socket.off('vendor_order_dispatched', handleRefresh);
      socket.off('vendor_order_declined', handleRefresh);
    };
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications/hub', {
        credentials: 'include',
        cache: 'no-store',
        headers: { Pragma: 'no-cache' }
      });
      const data: NotificationResponse = await res.json();
      if (data.success) {
        const unreadOnes = data.notifications.filter(
          (n) =>
            n.status === 'unread' &&
            (n.type === 'VENDOR_ORDER_DISPATCHED' ||
              n.type === 'VENDOR_ORDER_DECLINED')
        );
        setNotifications(unreadOnes);
        setUnreadCount(unreadOnes.length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (vendorOrderId: string) => {
    router.push(`/dashboard/vendor-orders/${vendorOrderId}`);
  };

  const handleMarkGroupAsRead = async (
    vendorOrderId: string,
    ids: string[]
  ) => {
    try {
      setActionLoadingId(vendorOrderId);

      // Parallel processing for simpler implementation (since we lack bulk API)
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/notifications/${id}/read`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
          })
        )
      );

      // Optimistic update: Remove all notifications with these IDs
      setNotifications((prev) => prev.filter((n) => !ids.includes(n._id)));
      setUnreadCount((prev) => Math.max(0, prev - ids.length));
    } catch (error) {
      console.error('Failed to mark group as read:', error);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Grouping Logic
  const groupedNotifications = notifications.reduce(
    (acc, curr) => {
      const key = curr.vendor_order_id || 'others';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(curr);
      return acc;
    },
    {} as Record<string, Notification[]>
  );

  const sortedGroups = Object.entries(groupedNotifications).sort(
    ([, a], [, b]) => {
      // Sort by most recent notification in the group
      const dateA = new Date(a[0].createdAt).getTime();
      const dateB = new Date(b[0].createdAt).getTime();
      return dateB - dateA;
    }
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon' className='relative'>
          <Bell className='h-4 w-4' />
          {unreadCount > 0 && (
            <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white'>
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-80' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm leading-none font-medium'>Notifications</p>
            <p className='text-muted-foreground text-xs leading-none'>
              You have {unreadCount} unread messages
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <ScrollArea className='h-[300px]'>
            {sortedGroups.length === 0 ? (
              <div className='text-muted-foreground p-4 text-center text-sm'>
                No notifications
              </div>
            ) : (
              sortedGroups.map(([groupId, groupItems]) => {
                const latest = groupItems[0];
                const isGroup = groupItems.length > 1;
                const count = groupItems.length;
                const groupKey = groupId === 'others' ? latest._id : groupId;

                return (
                  <div
                    key={groupKey}
                    className='hover:bg-muted/50 flex flex-col gap-2 border-b p-3 last:border-0'
                  >
                    <div className='flex flex-col gap-1'>
                      <div className='flex items-center justify-between'>
                        <p className='text-sm leading-none font-medium'>
                          {groupId === 'others'
                            ? latest.title
                            : `Order #${groupId.slice(-6)}`}
                        </p>
                        {count > 1 && (
                          <span className='bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-medium'>
                            {count} updates
                          </span>
                        )}
                      </div>
                      <p className='text-muted-foreground line-clamp-2 text-xs leading-none'>
                        {latest.body}
                      </p>
                      {count > 1 && (
                        <p className='text-muted-foreground text-[10px] italic'>
                          + {count - 1} more
                        </p>
                      )}
                    </div>
                    <div className='flex items-center gap-2'>
                      {groupId !== 'others' && (
                        <Button
                          variant='outline'
                          size='sm'
                          className='h-7 flex-1 text-xs'
                          onClick={() => handleView(groupId)}
                        >
                          View Order
                        </Button>
                      )}
                      <Button
                        variant='ghost'
                        size='sm'
                        className='hover:bg-muted h-7 flex-1 text-xs'
                        onClick={() =>
                          handleMarkGroupAsRead(
                            groupId,
                            groupItems.map((n) => n._id)
                          )
                        }
                        disabled={actionLoadingId === groupId}
                      >
                        {actionLoadingId === groupId ? (
                          <Loader2 className='h-3 w-3 animate-spin' />
                        ) : (
                          'Mark read'
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </ScrollArea>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
