import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PaymentResponse } from '@/constants/data';

/**
 * GET /api/payments
 * Get all payments with optional query parameters for filtering and pagination
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';

    const baseUrl = process.env.RINSR_API_BASE;
    const cookieToken = (await cookies()).get('rinsr_token')?.value;
    const token = cookieToken || undefined;

    if (!baseUrl) {
      const errorResponse: PaymentResponse = {
        success: false,
        message: 'Server is not configured with RINSR_API_BASE',
        error: 'Missing server environment variable'
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    if (!token) {
      const errorResponse: PaymentResponse = {
        success: false,
        message: 'Unauthorized',
        error: 'Missing bearer token'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Normalize base URL
    const normalizedBase = baseUrl?.endsWith('/api')
      ? baseUrl
      : `${baseUrl?.replace(/\/+$/, '')}/api`;

    // Add query params
    const upstreamUrl = new URL(`${normalizedBase}/payments/`);
    if (page) upstreamUrl.searchParams.set('page', page);
    if (limit) upstreamUrl.searchParams.set('limit', limit);
    if (search) upstreamUrl.searchParams.set('search', search);

    // console.log('🔗 Fetching Upstream Payments URL:', upstreamUrl.toString());

    const upstreamRes = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    const data = await upstreamRes.json().catch(() => ({}));

    if (!upstreamRes.ok) {
      const errorResponse: PaymentResponse = {
        success: false,
        message: 'Upstream payments fetch failed',
        error:
          data?.message ||
          upstreamRes.statusText ||
          `HTTP ${upstreamRes.status}`
      };
      return NextResponse.json(errorResponse, {
        status: upstreamRes.status
      });
    }

    if (data.payments && Array.isArray(data.payments)) {
      // Create a map of User IDs to fetch names for
      const userIdsToFetch = new Set<string>();
      data.payments.forEach((payment: any) => {
        const order = payment.order_id;
        if (
          order &&
          typeof order === 'object' &&
          typeof order.user_id === 'string' &&
          order.user_id.length > 10
        ) {
          userIdsToFetch.add(order.user_id);
        }
      });

      // Fetch users if we have any incomplete IDs
      const userMap = new Map<string, string>();
      if (userIdsToFetch.size > 0) {
        try {
          console.log(
            `🔍 Fetching names for ${userIdsToFetch.size} users for payments...`
          );
          // Fetch in parallel
          await Promise.all(
            Array.from(userIdsToFetch).map(async (uid) => {
              try {
                const userRes = await fetch(`${normalizedBase}/users/${uid}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (userRes.ok) {
                  const userData = await userRes.json();
                  const u = userData.user || userData.data || userData;
                  const fullName =
                    u.name ||
                    `${u.first_name || ''} ${u.last_name || ''}`.trim() ||
                    'Unknown User';
                  userMap.set(uid, fullName);
                }
              } catch (err) {
                /* ignore individual failures */
              }
            })
          );
        } catch (error) {
          console.error('Error fetching user names for payments:', error);
        }
      }

      // Enrich payments with names
      data.payments = data.payments.map((payment: any) => {
        const order = payment.order_id;
        if (
          order &&
          typeof order === 'object' &&
          typeof order.user_id === 'string'
        ) {
          const resolvedName = userMap.get(order.user_id) || order.user_id;
          // Mutate order.user_id to be an object so frontend can read .name
          order.user_id = { _id: order.user_id, name: resolvedName };
        }
        return payment;
      });
    }

    const response: PaymentResponse = {
      success: true,
      message: 'Payments fetched successfully',
      payments: data.payments || [],
      count: data.count,
      total: data.total,
      page: data.page,
      totalPages: data.totalPages
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorResponse: PaymentResponse = {
      success: false,
      message: 'Failed to fetch payments',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
