import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { OrderResponse } from '@/constants/data';

/**
 * GET /api/orders/[orderId]
 * Get a single order by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ Must be Promise
) {
  // ✅ FIX: Await params before accessing it
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = params.id;
  console.log(`🟢 PATCH /api/orders/order/${orderId}/cancel`);

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

    // Ensure base URL includes '/api'
    const normalizedBase = baseUrl?.endsWith('/api')
      ? baseUrl
      : `${baseUrl}/api`;

    // Send the cancel request to the upstream API
    const upstreamRes = await fetch(
      `${normalizedBase}/orders/${orderId}/cancel`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      }
    );

    let data: any;
    try {
      if (
        upstreamRes.headers.get('content-type')?.includes('application/json')
      ) {
        data = await upstreamRes.json(); // Parse JSON response
      } else {
        const rawText = await upstreamRes.text(); // Get raw response text
        data = { raw: rawText }; // Store raw text for debugging
      }
    } catch (err) {
      console.error('Error parsing upstream response:', err);
      data = { raw: 'Unable to parse response' };
    }

    console.log('📤 Upstream response:', JSON.stringify(data, null, 2));

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Upstream cancel failed',
          error: data.raw || 'Unknown error'
        },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order canceled successfully',
      data: data?.order ?? data?.data ?? data
    });
  } catch (err) {
    console.error('🔥 PATCH /api/orders/order/[id]/cancel failed:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Server error while canceling order',
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
