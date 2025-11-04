import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { OrderResponse } from '@/constants/data';

/**
 * GET /api/orders/[orderId]
 * Get a single order by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await context.params;
  console.log(`🟢 GET /api/orders/order/${orderId}`);

  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const token = (await cookies()).get('rinsr_token')?.value;

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

    const upstreamRes = await fetch(`${baseUrl}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    console.log('🧩 RINSR_API_BASE:', baseUrl);
    console.log('🧩 Order ID received:', orderId);
    console.log('🧩 Token exists:', !!token);

    const rawText = await upstreamRes.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }

    console.log('➡️ Upstream GET response:', JSON.stringify(data, null, 2));

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Order not found',
          error: rawText
        },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data?.order ?? data?.data ?? data
    });
  } catch (err) {
    console.error('🔥 GET error:', err);
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
  { params }: { params: { id: string } }
) {
  const orderId = params.id;
  console.log(`🟢 PUT /api/orders/order/${orderId}`);

  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const token = (await cookies()).get('rinsr_token')?.value;

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
    console.log('📦 Incoming update payload:', JSON.stringify(body, null, 2));

    const upstreamRes = await fetch(`${baseUrl}/orders/${orderId}`, {
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

    console.log('📤 Upstream response:', JSON.stringify(data, null, 2));

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Upstream update failed',
          error: rawText
        },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      data: data?.order ?? data?.data ?? data
    });
  } catch (err) {
    console.error('🔥 PUT /api/orders/order/[id] failed:', err);
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
 * DELETE /api/orders/[orderId]
 * Delete an order
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
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

    const normalizedBase = baseUrl?.endsWith('/api')
      ? baseUrl
      : `${baseUrl?.replace(/\/+$/, '')}/api`;
    const upstreamRes = await fetch(`${normalizedBase}/orders/${orderId}/`, {
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
