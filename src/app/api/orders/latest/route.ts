import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

interface OrderItem {
  id: string;
  name: string;
  email: string;
  amount: string;
  avatar: string;
  fallback: string;
}

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
});

export async function GET() {
  const baseUrl = process.env.RINSR_API_BASE;
  const token = (await cookies()).get('rinsr_token')?.value;

  if (!baseUrl)
    return NextResponse.json(
      { success: false, message: 'Server not configured' },
      { status: 500 }
    );

  if (!token)
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );

  const apiBase = baseUrl.endsWith('/api')
    ? baseUrl
    : `${baseUrl.replace(/\/+$/, '')}/api`;

  const res = await fetch(`${apiBase}/orders/latest`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok)
    return NextResponse.json(
      {
        success: false,
        message: payload?.message || res.statusText
      },
      { status: res.status }
    );

  const rawOrders = Array.isArray(payload?.orders) ? payload.orders : [];

  const orders: OrderItem[] = rawOrders.slice(0, 5).map((o: any) => {
    const user = o.user_id || {};
    const name = user.name || 'Guest';

    return {
      id: o._id || o.id,
      name,
      email: user.email || 'No email',
      avatar: user.profileImage || user.profile_image || '',
      amount: INR.format(o.total_price || o.estimate_total_price || 0),
      fallback: name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    };
  });

  return NextResponse.json({
    success: true,
    message: 'Latest orders fetched successfully',
    orders
  });
}
