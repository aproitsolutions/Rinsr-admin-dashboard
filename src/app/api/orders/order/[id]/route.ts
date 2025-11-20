import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { OrderResponse } from '@/constants/data';

/**
 * GET /api/orders/order/[id]
 * Get a single order by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = params.id;
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

    console.log(' Upstream GET response:', JSON.stringify(data, null, 2));

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

    const order = data?.order ?? data?.data ?? data;
    console.log(
      ` Order ${orderId} vendor_id:`,
      order?.vendor_id || order?.vendor || 'not found'
    );

    return NextResponse.json({
      success: true,
      order,
      data: order
    });
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
  { params }: { params: { id: string } }
) {
  const orderId = params.id;

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

    console.log(
      ` PUT /api/orders/order/${orderId} payload:`,
      JSON.stringify(body, null, 2)
    );

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
    console.log(
      ` PUT response vendor_id:`,
      updatedOrder?.vendor_id || updatedOrder?.vendor || 'not found'
    );

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
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

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
