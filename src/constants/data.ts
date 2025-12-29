import { NavItem } from '@/types';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

export type Order = {
  id: string;

  // Legacy fields used by earlier UI
  customer?: string;
  customer_email?: string;
  customer_phone?: string;
  total?: number;
  status?: 'pending' | 'shipped' | 'cancelled' | 'completed' | string;
  date?: string;
  created_at?: string;
  updated_at?: string;
  items?: OrderItem[];
  vendor_status?: string;
  user_status?: string;

  // Fields used by current orders listing UI (from real API)
  plan_name?: string;
  name?: string;
  plan_id_name?: string;
  address_line?: string;
  pickup_time_slot?: string;

  vendor_id?:
    | string
    | {
        _id: string;
        company_name?: string;
        phone_number?: string;
        status?: string;
        location?: string;
      };

  vendor?: {
    _id: string;
    company_name?: string;
    phone_number?: string;
    status?: string;
    location?: string;
  };

  hub_id?: string | { _id: string; name?: string };
  hub?: { _id: string; name?: string };
  service_id?: string | null;
  service_name?: string;
};

export type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
};

export type OrderResponse = {
  success: boolean;
  message: string;
  data?: Order | Order[];
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
};

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Orders',
    url: '/dashboard/orders',
    icon: 'order',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Vendor Orders',
    url: '/dashboard/vendor-orders',
    icon: 'order',
    isActive: false,
    shortcut: ['d', 'v'],
    items: []
  },
  {
    title: 'Vendors',
    url: '/dashboard/vendors',
    icon: 'kanban',
    isActive: false,
    shortcut: ['d', 'd'],
    items: [] // Empty array as there are no child items for Dashboard
  },
  {
    title: 'Subscription Plans',
    url: '/dashboard/plans',
    icon: 'billing',
    isActive: false,
    shortcut: ['d', 'd'],
    items: [] // Empty array as there are no child items for Dashboard
  },
  {
    title: 'Admins',
    url: '/dashboard/admins',
    icon: 'admin',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Customers',
    url: '/dashboard/users',
    icon: 'users',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Services',
    url: '/dashboard/services',
    icon: 'service',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: 'Delivery Partners',
    url: '/dashboard/delivery-partners',
    icon: 'truck',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: 'Hubs',
    url: '/dashboard/hubs',
    icon: 'hub',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: 'Web Users',
    url: '/dashboard/webusers',
    icon: 'users',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: 'Account',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'billing',
    isActive: true,

    items: [
      {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: 'userPen',
        shortcut: ['m', 'm']
      },
      {
        title: 'Actions',
        url: '/dashboard/actions',
        icon: 'userPen',
        shortcut: ['m', 'm']
      }
      // {
      //   title: 'Login',
      //   shortcut: ['l', 'l'],
      //   url: '/',
      //   icon: 'login'
      // }
    ]
  }
  // {
  //   title: 'Kanban',
  //   url: '/dashboard/kanban',
  //   icon: 'kanban',
  //   shortcut: ['k', 'k'],
  //   isActive: false,
  //   items: [] // No child items
  // }
];

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export type UserRole = 'super_admin' | 'admin' | 'vendor_user' | 'hub_user';

export interface CurrentAdmin {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  allowedPages: string[]; // ['*'] means all pages
  hub_id?: string;
}

function hasAccessToUrl(url: string, user: CurrentAdmin): boolean {
  // super_admin can see everything
  if (user.role === 'super_admin') return true;

  // wildcard if you ever send ['*'] from backend
  if (user.allowedPages.includes('*')) return true;

  // parent with '#' is controlled by its children
  if (!url || url === '#') return true;

  // simple rule: any allowed page is a prefix of url
  // BUT special case: '/dashboard' should not match everything under it (like /dashboard/orders)
  // It should only match itself or overview
  return user.allowedPages.some((page) => {
    if (page === '/dashboard') {
      return url === '/dashboard' || url === '/dashboard/overview';
    }
    return url.startsWith(page);
  });
}

// no NavItem | null, so no TS error
export function filterNavItemsByPermissions(user: CurrentAdmin): NavItem[] {
  const result: NavItem[] = [];

  for (const item of navItems) {
    const childItems = (item.items ?? []).filter((child) =>
      hasAccessToUrl(child.url, user)
    );

    const canSeeSelf = hasAccessToUrl(item.url, user);

    const keepParent = item.url === '#' ? childItems.length > 0 : canSeeSelf;

    if (!keepParent) continue;

    result.push({
      ...item,
      items: childItems
    });
  }

  return result;
}
