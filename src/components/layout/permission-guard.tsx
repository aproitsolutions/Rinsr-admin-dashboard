'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser } from './user-provider';

// Pages that are always allowed for authenticated users
const COMMON_PAGES = [
  '/dashboard', // Dashboard root (often redirects to overview)
  '/dashboard/overview',
  '/dashboard/profile',
  '/dashboard/unauthorized' // Error page
];

export default function PermissionGuard({
  children
}: {
  children: React.ReactNode;
}) {
  const { admin, loading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!admin) {
      // Not logged in, middleware should have caught this, but doublesafe
      // router.push('/auth/login');
      // Let's assume middleware handles auth, we just handle permissions
      return;
    }

    // Super admin bypass
    if (admin.role === 'super_admin' || admin.allowedPages.includes('*')) {
      setIsAuthorized(true);
      return;
    }

    // Check against common pages
    if (
      COMMON_PAGES.some(
        (page) => pathname === page || pathname.startsWith(page + '/')
      )
    ) {
      setIsAuthorized(true);
      return;
    }

    // Check permissions
    // "admin.allowedPages" contains routes like "/dashboard/orders"
    // We check if current pathname starts with any of the allowed pages
    const hasAccess = admin.allowedPages.some((page) => {
      // Special case: '/dashboard' only allows overview, not everything
      if (page === '/dashboard') {
        return pathname === '/dashboard' || pathname === '/dashboard/overview';
      }

      // Exact match or sub-route match
      // e.g. allowed="/dashboard/orders", current="/dashboard/orders/123" -> OK
      return pathname === page || pathname.startsWith(`${page}/`);
    });

    if (hasAccess) {
      setIsAuthorized(true);
    } else {
      console.warn(`Access denied to ${pathname} for role ${admin.role}`);
      // Redirect or show unauthorized
      // For now, we can redirect to overview or a dedicated unauthorized page
      // preventing infinite loop if overview is also strictly checked (but we added it to COMMON_PAGES)
      if (pathname !== '/dashboard/overview') {
        router.replace('/dashboard/overview');
      }
    }
  }, [pathname, admin, loading, router]);

  if (loading) {
    return null; // or a spinner
  }

  // If not authorized yet (calculating) or explicitly denied (handled by redirect), hide content
  // We can show a 'Forbidden' UI here if we don't want to auto-redirect
  if (
    !isAuthorized &&
    admin?.role !== 'super_admin' &&
    !admin?.allowedPages.includes('*')
  ) {
    // If we are here, it means useEffect determined no access and triggered redirect.
    // We render null to avoid flashing confidential content.
    return null;
  }

  return <>{children}</>;
}
