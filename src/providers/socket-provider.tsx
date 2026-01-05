'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '@/components/layout/user-provider'; // Adjust path if needed
import { toast } from 'sonner'; // Checking if sonner is used, if not I'll check toast
import { useRouter } from 'next/navigation';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  unreadDispatchCount: number;
  resetDispatchCount: () => void;
  markAsRead: (orderId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  unreadDispatchCount: 0,
  resetDispatchCount: () => {},
  markAsRead: () => {}
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { admin } = useUser();
  const router = useRouter();
  const [unreadOrderIds, setUnreadOrderIds] = useState<string[]>([]);

  const unreadDispatchCount = unreadOrderIds.length;

  const resetDispatchCount = useCallback(() => {
    setUnreadOrderIds([]);
  }, []);

  // Remove a specific order ID from the unread list
  const markAsRead = useCallback((orderId: string) => {
    setUnreadOrderIds((prev) => prev.filter((id) => id !== orderId));
  }, []);

  // Debug: Manual Trigger
  useEffect(() => {
    (window as any).testSocketNotifications = () => {
      console.log('🔔 Manually triggering test notifications...');

      // Test Dispatch
      const dispatchData = {
        vendorOrderId: 'TEST-DISPATCH-123',
        message: 'Test Dispatch Notification'
      };
      // manually call the handler logic (can't directly emit to self without loopback, so we simulate receipt)
      // Actually, we can just check if the listener is bound, but easiest is to define the handler outside or copy logic.
      // For now, let's just emit to server and hope it reflects, OR just log.

      // Better: Just expose the socket so they can emit if the server allows echo.
      // But server might not echo.

      // Let's just log that the tool is ready.
      console.log(
        'To test, run: socket.emit("vendor_order_declined", { message: "Test", vendorOrderId: "123" }) IF server reflects.'
      );
    };
  }, []);

  useEffect(() => {
    const url =
      process.env.NEXT_PUBLIC_API_URL || 'https://rinsrapi.aproitsolutions.in';

    const socketInstance = io(url, {
      autoConnect: true
      // transports: ['websocket'], // Removed to allow fallback to polling if needed
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);

      // Join hub (Likely fails here if admin is not loaded yet, handled by delayed effect)
      if (admin?.hub_id) {
        console.log('Joining hub (immediate):', admin.hub_id);
        socketInstance.emit('join_hub', admin.hub_id);
        socketInstance.emit('join_hub', `hub_${admin.hub_id}`);
      } else {
        console.log('Admin not loaded yet, skipping immediate hub join');
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    // Debug: Listen to ALL events
    socketInstance.onAny((eventName, ...args) => {
      console.log(`[Socket Debug] Received event: ${eventName}`, args);
    });

    // Listen for vendor order dispatch
    socketInstance.on('vendor_order_dispatched', (data) => {
      console.log('Vendor Order Dispatched Event Received:', data);

      // Robust ID extraction
      const orderId = data.vendorOrderId || data.id || data._id || data.orderId;

      if (orderId) {
        setUnreadOrderIds((prev) => {
          if (prev.includes(orderId)) return prev;
          return [...prev, orderId];
        });
      } else {
        console.warn(
          '⚠️ Received dispatch event without a valid order ID:',
          data
        );
      }

      toast.info(data.message || 'Vendor Order Dispatched', {
        description: orderId
          ? `Order ID: ${orderId}`
          : 'Check vendor orders for details',
        duration: 5000,
        action: orderId
          ? {
              label: 'View',
              onClick: () => {
                console.log('View clicked, marking as read:', orderId);
                markAsRead(orderId);
                router.push(`/dashboard/vendor-orders/${orderId}`);
              }
            }
          : undefined
      });
    });

    // Listen for vendor order declined
    socketInstance.on('vendor_order_declined', (data) => {
      console.log('Vendor Order Declined Event Received:', data);

      // Robust ID extraction
      const orderId = data.vendorOrderId || data.id || data._id || data.orderId;

      if (orderId) {
        setUnreadOrderIds((prev) => {
          if (prev.includes(orderId)) return prev;
          return [...prev, orderId];
        });
      } else {
        console.warn(
          '⚠️ Received decline event without a valid order ID:',
          data
        );
      }

      toast.error(data.message || 'Vendor Order Declined', {
        description: orderId
          ? `Order ID: ${orderId}`
          : 'Check vendor orders for details',
        duration: 5000,
        action: orderId
          ? {
              label: 'View',
              onClick: () => {
                console.log('View clicked, marking as read:', orderId);
                markAsRead(orderId);
                router.push(`/dashboard/vendor-orders/${orderId}`);
              }
            }
          : undefined
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Effect to join hub if admin loads LATER than socket connect
  useEffect(() => {
    if (socket && socket.connected && admin?.hub_id) {
      console.log('Joining hub (delayed effect):', admin.hub_id);
      socket.emit('join_hub', admin.hub_id);
      socket.emit('join_hub', `hub_${admin.hub_id}`);
    } else {
      console.log('Delayed Join Check:', {
        socketExists: !!socket,
        connected: socket?.connected,
        hubId: admin?.hub_id
      });
    }
  }, [socket, admin?.hub_id]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        unreadDispatchCount,
        resetDispatchCount,
        markAsRead
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
