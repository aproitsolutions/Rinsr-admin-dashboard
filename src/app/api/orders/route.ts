import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { OrderResponse } from '@/constants/data';

// This is a placeholder - replace with your actual database/API logic
// For example: Database queries, external API calls, etc.

/**
 * GET /api/orders
 * Get all orders with optional query parameters for filtering and pagination
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const baseUrl = process.env.RINSR_API_BASE;
    const cookieToken = (await cookies()).get('rinsr_token')?.value;
    const token = cookieToken || undefined;

    if (!baseUrl) {
      const errorResponse: OrderResponse = {
        success: false,
        message: 'Server is not configured with RINSR_API_BASE',
        error: 'Missing server environment variable'
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    if (!token) {
      const errorResponse: OrderResponse = {
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
    const upstreamUrl = new URL(`${normalizedBase}/orders`);
    if (page) upstreamUrl.searchParams.set('page', page);
    if (limit) upstreamUrl.searchParams.set('limit', limit);
    if (search) upstreamUrl.searchParams.set('search', search);
    if (status) upstreamUrl.searchParams.set('status', status);

    // Fetch upstream API
    const upstreamRes = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    const data = await upstreamRes.json().catch(() => ({}));

    try {
      interface UpstreamOrder {
        createdAt?: string;
        [key: string]: any;
      }

      const rawItems = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.orders)
            ? data.orders
            : Array.isArray(data?.results)
              ? data.results
              : Array.isArray(data?.items)
                ? data.items
                : [];

      const latestItems = (rawItems as UpstreamOrder[])
        .filter((item) => !!item.createdAt)
        .sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
        )
        .slice(0, 2);
    } catch (err) {}

    if (!upstreamRes.ok) {
      const errorResponse: OrderResponse = {
        success: false,
        message: 'Upstream orders fetch failed',
        error:
          data?.message ||
          upstreamRes.statusText ||
          `HTTP ${upstreamRes.status}`
      };
      return NextResponse.json(errorResponse, {
        status: upstreamRes.status
      });
    }

    // Normalize the array
    const rawItems: any[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.orders)
          ? data.orders
          : Array.isArray(data?.results)
            ? data.results
            : Array.isArray(data?.items)
              ? data.items
              : [];

    // ✅ Normalize orders for UI
    const normalized = rawItems.map((item) => {
      const id =
        item._id ?? item.id ?? item.order_id ?? String(item.uuid ?? '');

      // ✅ Plan Name
      const plan_name =
        item.subscription_snapshot?.plan_name ??
        item.plan?.name ??
        item.plan_name ??
        '—';

      // ✅ Plan ID or name
      const plan_id_name =
        typeof item.plan_id === 'object'
          ? (item.plan_id?.name ?? '—')
          : (item.plan_id ?? '—');

      // ✅ User name or fallback
      const name =
        item.user_id?.name ??
        item.user_name ??
        item.customer_name ??
        (typeof item.user_id === 'string' ? item.user_id : 'N/A');

      // ✅ Address
      const address_line = item.pickup_address?.address_line ?? '—';

      // ✅ Pickup Slot
      const pickup_time_slot = item.pickup_time_slot
        ? `${item.pickup_time_slot.start ?? ''}-${item.pickup_time_slot.end ?? ''}`
        : '—';

      // ✅ Service Name
      const service_name = item.service_id?.name ?? '—';

      return {
        id,
        plan_name,
        name,
        plan_id_name,
        address_line,
        pickup_time_slot,
        service_name
      };
    });

    // ✅ Build Response
    const response: OrderResponse = {
      success: true,
      message: 'Orders fetched successfully',
      data: normalized,
      total: data?.total ?? data?.totalCount ?? normalized.length,
      page: Number(data?.page ?? page),
      limit: Number(data?.limit ?? limit)
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorResponse: OrderResponse = {
      success: false,
      message: 'Failed to fetch orders',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * POST /api/orders
 * Create a new order
 */
// export async function POST(request: NextRequest) {
//   console.log('🟢 POST /api/orders invoked');

//   try {
//     const baseUrl = process.env.RINSR_API_BASE;
//     const cookieToken = (await cookies()).get('rinsr_token')?.value;
//     const token = cookieToken || undefined;

//     console.log('➡️ Base URL:', baseUrl);
//     console.log('➡️ Token present:', !!token);

//     if (!baseUrl) {
//       return NextResponse.json(
//         { success: false, message: 'Missing RINSR_API_BASE' },
//         { status: 500 }
//       );
//     }

//     if (!token) {
//       return NextResponse.json(
//         { success: false, message: 'Unauthorized - Missing token' },
//         { status: 401 }
//       );
//     }

//     const body = await request.json();

//     // ✅ Decode the token to extract user_id
//     let userId: string | null = null;
//     try {
//       const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
//       console.log('🧩 Decoded token payload:', decoded);

//       // Adjust based on your token structure
//       userId =
//         decoded?.user?._id ||
//         decoded?.user_id ||
//         decoded?._id ||
//         decoded?.id ||
//         null;

//       console.log('🧩 Extracted userId:', userId);
//     } catch (err) {
//       console.warn('⚠️ Failed to decode token:', err);
//     }

//     // ✅ Ensure plan_id is always a string
//     const normalizedPlanId =
//       typeof body.plan_id === 'object' ? body.plan_id?._id : body.plan_id;

//     // ✅ Build clean payload for upstream
//     const normalizedBody = {
//       ...body,
//       plan_id: normalizedPlanId,
//       user_id: userId,
//     };

//     console.log('📦 Final payload sent upstream:', JSON.stringify(normalizedBody, null, 2));

//     // ✅ POST to backend
//     const upstreamRes = await fetch(`${baseUrl}/orders`, {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${token}`,
//         'Content-Type': 'application/json',
//         Accept: 'application/json',
//       },
//       body: JSON.stringify(normalizedBody),
//     });

//     const rawText = await upstreamRes.text();
//     let data: any;
//     try {
//       data = JSON.parse(rawText);
//     } catch {
//       data = { raw: rawText };
//     }

//     console.log('➡️ Received response:', JSON.stringify(data, null, 2));

//     if (!upstreamRes.ok) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: 'Upstream order creation failed',
//           rawUpstreamResponse: rawText,
//           status: upstreamRes.status,
//         },
//         { status: upstreamRes.status }
//       );
//     }

//     return NextResponse.json(
//       {
//         success: true,
//         message: 'Order created successfully',
//         data: data?.data ?? data,
//       },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error('🔥 API /api/orders POST crashed with error:', error);
//     return NextResponse.json(
//       {
//         success: false,
//         message: 'Failed to create order',
//         error: error instanceof Error ? error.stack || error.message : 'Unknown error',
//       },
//       { status: 500 }
//     );
//   }
// }
