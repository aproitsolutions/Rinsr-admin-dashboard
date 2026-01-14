import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { OrderResponse } from '@/constants/data';

// This is a placeholder - replace with your actual database/API logic
// For example: Database queries, external API calls, etc.

/**
 * GET /api/orders/cancelled
 * Get all cancelled orders with optional query parameters for filtering and pagination
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const user_status = searchParams.get('user_status') || '';
    const vendor_id = searchParams.get('vendor_id') || '';
    const service_id = searchParams.get('service_id') || '';
    const hub_id = searchParams.get('hub_id') || '';

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
    const upstreamUrl = new URL(`${normalizedBase}/orders/cancelled`);
    if (page) upstreamUrl.searchParams.set('page', page);
    if (limit) upstreamUrl.searchParams.set('limit', limit);
    if (search) upstreamUrl.searchParams.set('search', search);
    if (status) upstreamUrl.searchParams.set('status', status);
    if (user_status) upstreamUrl.searchParams.set('user_status', user_status);
    if (vendor_id) upstreamUrl.searchParams.set('vendor_id', vendor_id);
    if (service_id) upstreamUrl.searchParams.set('service_id', service_id);
    if (hub_id) upstreamUrl.searchParams.set('hub_id', hub_id);
    // Fetch upstream API
    console.log('🔗 Fetching Upstream Orders URL:', upstreamUrl.toString());
    const upstreamRes = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    const data = await upstreamRes.json().catch(() => ({}));

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
    // Normalize the array
    let rawItems: any[] = [];
    if (Array.isArray(data)) {
      rawItems = data;
    } else if (Array.isArray(data?.data)) {
      rawItems = data.data;
    } else if (Array.isArray(data?.orders)) {
      rawItems = data.orders;
    } else if (Array.isArray(data?.cancelled_orders)) {
      rawItems = data.cancelled_orders;
    } else if (Array.isArray(data?.cancelledOrders)) {
      rawItems = data.cancelledOrders;
    } else if (Array.isArray(data?.results)) {
      rawItems = data.results;
    } else if (Array.isArray(data?.items)) {
      rawItems = data.items;
    } else {
      // Fallback: search for any array in the object
      const potentialKey = Object.keys(data || {}).find((key) =>
        Array.isArray(data[key])
      );
      if (potentialKey) {
        rawItems = data[potentialKey];
      }
    }

    // ✅ Normalize orders for UI
    const normalized = rawItems.map((item) => {
      const id =
        item._id ?? item.id ?? item.order_id ?? String(item.uuid ?? '');
      const plan_name =
        item.subscription_snapshot?.plan_name ??
        item.plan?.name ??
        item.plan_name ??
        '—';

      const plan_id_name =
        typeof item.plan_id === 'object'
          ? (item.plan_id?.name ?? '—')
          : (item.plan_id ?? '—');

      const name =
        item.username ??
        item.user_id?.name ??
        item.user_name ??
        item.customer_name ??
        (typeof item.user_id === 'string' ? item.user_id : 'N/A');

      const address_line = item.pickup_address?.address_line ?? '—';

      const pickup_time_slot = item.pickup_time_slot
        ? `${item.pickup_time_slot.start ?? ''}-${item.pickup_time_slot.end ?? ''}`
        : '—';

      const service_name = item.service_id?.name ?? '—';

      const vendor_id = item.vendor_id || item.vendor || null;

      const hub_id = item.hub_id || item.hub || null;

      const status = item.status || null;

      return {
        id,
        plan_name,
        name,
        plan_id_name,
        address_line,
        pickup_time_slot,
        service_name,
        vendor_id,
        hub_id,
        status,
        delivery_date: item.delivery_date || null,
        user_status: item.user_status || null,
        vendor_status: item.vendor_status || null,
        service_id: item.service_id?._id ?? item.service_id ?? null,
        used_weight_kg: item.used_weight_kg ?? null,
        total_weight_kg: item.total_weight_kg ?? null,
        emergency: item.emergency || false
      };
    });

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
