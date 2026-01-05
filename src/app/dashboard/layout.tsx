import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { UserProvider } from '@/components/layout/user-provider';
import { SocketProvider } from '@/providers/socket-provider';
import PermissionGuard from '@/components/layout/permission-guard';

export const metadata: Metadata = {
  title: 'Rinsr Admin Panel',
  description: 'Monitor your laundry service operations in real-time'
};

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Persisting the sidebar state in the cookie.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  return (
    <KBar>
      <UserProvider>
        <SocketProvider>
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />
            <SidebarInset>
              <Header />
              {/* page main content */}
              <PermissionGuard>{children}</PermissionGuard>
              {/* page main content ends */}
            </SidebarInset>
          </SidebarProvider>
        </SocketProvider>
      </UserProvider>
    </KBar>
  );
}
