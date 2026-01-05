import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { OrderResponse } from '@/constants/data';

/**
 * GET /api/orders/order/[id]
 * Get a single order by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  console.log(` GET /api/orders/order/${orderId}`);

  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const cookieStore = await cookies();
    const token = cookieStore.get('rinsr_token')?.value;

    if (!baseUrl) {
      return NextResponse.json(
        { success: false, message: 'Missing RINSR_API_BASE' },
        { status: 500 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Missing token' },
        { status: 401 }
      );
    }

    // normalize base to /api if needed
    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    const upstreamRes = await fetch(`${normalizedBase}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    const rawText = await upstreamRes.text();

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }

    // Handle soft-failures (200 OK but success: false in body)
    if (
      !upstreamRes.ok ||
      (data && typeof data.success === 'boolean' && !data.success)
    ) {
      console.log(
        '[DEBUG] Direct fetch failed. Attempting Fallback via List API...'
      );

      // Fallback: Fetch list and find the order
      // This helps if the single-fetch endpoint is stricter than the list endpoint for Hub Users.
      try {
        const listUrl = `${normalizedBase}/orders?limit=500`; // Fetch recent 500 orders
        const listRes = await fetch(listUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
          },
          cache: 'no-store'
        });

        const listData = await listRes.json();
        const rawItems = Array.isArray(listData)
          ? listData
          : Array.isArray(listData?.data)
            ? listData.data
            : Array.isArray(listData?.orders)
              ? listData.orders
              : [];

        const foundItem = rawItems.find(
          (item: any) =>
            String(item._id) === String(orderId) ||
            String(item.id) === String(orderId)
        );

        if (foundItem) {
          console.log('✅ Found order in Fallback List API!');
          console.log('[DEBUG] Fallback Item Keys:', Object.keys(foundItem));
          console.log(
            '[DEBUG] Fallback Item Weight:',
            foundItem.used_weight_kg
          );
          // Normalize/Fix image if needed
          if (foundItem?.image && !foundItem.image.startsWith('http')) {
            const rootUrl = normalizedBase.replace(/\/api$/, '');
            const imagePath = foundItem.image.startsWith('/')
              ? foundItem.image
              : `/${foundItem.image}`;
            foundItem.image = `${rootUrl}${imagePath}`;
          }

          console.log(
            '[DEBUG] Fallback Item Full:',
            JSON.stringify(foundItem, null, 2)
          );

          return NextResponse.json({
            success: true,
            order: foundItem,
            data: foundItem
          });
        }
      } catch (fallbackErr) {
        console.warn('Fallback fetch also failed:', fallbackErr);
      }

      console.log('[DEBUG] Fallback failed. Returning original error.');
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Order not found (Upstream)',
          error: data
        },
        { status: upstreamRes.ok ? 404 : upstreamRes.status }
      );
    }

    const order = data?.order ?? data?.data ?? data;
    // console.log(
    //   ` Order ${orderId} vendor_id:`,
    //   order?.vendor_id || order?.vendor || 'not found'
    // );

    // ✅ Fix image URL
    if (order?.image && !order.image.startsWith('http')) {
      const rootUrl = normalizedBase.replace(/\/api$/, '');
      // Ensure no double slashes if image starts with /
      const imagePath = order.image.startsWith('/')
        ? order.image
        : `/${order.image}`;
      order.image = `${rootUrl}${imagePath}`;
    }

    const responsePayload = {
      success: true,
      order,
      data: order
    };
    console.log(
      'Final API Response Body:',
      JSON.stringify(responsePayload, null, 2)
    );

    return NextResponse.json(responsePayload);
  } catch (err) {
    console.error(' GET error:', err);
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(err) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/orders/order/[id]
 * Update an existing order
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;

  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const cookieStore = await cookies();
    const token = cookieStore.get('rinsr_token')?.value;

    if (!baseUrl) {
      return NextResponse.json(
        { success: false, message: 'Missing RINSR_API_BASE' },
        { status: 500 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Missing token' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // console.log(
    //   ` PUT /api/orders/order/${orderId} payload:`,
    //   JSON.stringify(body, null, 2)
    // );

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    const upstreamRes = await fetch(`${normalizedBase}/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(body)
    });

    const rawText = await upstreamRes.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }

    if (!upstreamRes.ok) {
      console.error(
        `❌ Upstream PUT failed: ${upstreamRes.status} ${upstreamRes.statusText}`
      );

      // Fallback: Try PATCH if PUT fails (RBAC might allow PATCH but not PUT)
      if (upstreamRes.status === 404 || upstreamRes.status === 403) {
        console.log('🔄 Attempting fallback to PATCH...');
        try {
          const patchRes = await fetch(`${normalizedBase}/orders/${orderId}`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify(body)
          });

          if (patchRes.ok) {
            const patchData = await patchRes.json();
            console.log('✅ Fallback PATCH succeeded!');
            return NextResponse.json({
              success: true,
              message: 'Order updated successfully (via PATCH)',
              order: patchData?.order ?? patchData?.data ?? patchData,
              data: patchData
            });
          } else {
            console.warn(`⚠️ Fallback PATCH also failed: ${patchRes.status}`);
          }
        } catch (patchErr) {
          console.error('⚠️ Fallback PATCH error:', patchErr);
        }
      }

      console.error('Response Body:', JSON.stringify(data, null, 2));
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Upstream update failed',
          error: rawText
        },
        { status: upstreamRes.status }
      );
    }

    const updatedOrder = data?.order ?? data?.data ?? data;
    // console.log(
    //   ` PUT response vendor_id:`,
    //   updatedOrder?.vendor_id || updatedOrder?.vendor || 'not found'
    // );

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder,
      data: updatedOrder
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: 'Server error while updating order',
        error: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orders/order/[id]
 * Delete an order
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    const baseUrl = process.env.RINSR_API_BASE;
    const cookieStore = await cookies();
    const token = cookieStore.get('rinsr_token')?.value;

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

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    const upstreamRes = await fetch(`${normalizedBase}/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    const data = await upstreamRes.json().catch(() => ({}));

    if (!upstreamRes.ok) {
      const errorResponse: OrderResponse = {
        success: false,
        message: 'Upstream order deletion failed',
        error:
          data?.message ||
          upstreamRes.statusText ||
          `HTTP ${upstreamRes.status}`
      };
      return NextResponse.json(errorResponse, { status: upstreamRes.status });
    }

    const response: OrderResponse = {
      success: true,
      message: 'Order deleted successfully'
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorResponse: OrderResponse = {
      success: false,
      message: 'Failed to delete order',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
