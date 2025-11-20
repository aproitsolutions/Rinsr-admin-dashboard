import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/orders/bulk/assign-hub
 * Bulk assign hub to multiple orders
 */
export async function POST(request: NextRequest) {
  console.log(` POST /api/orders/bulk/assign-hub`);

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
    const { hub_id, order_ids } = body;

    if (!hub_id) {
      return NextResponse.json(
        { success: false, message: 'hub_id is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(order_ids) || order_ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'order_ids array is required' },
        { status: 400 }
      );
    }

    console.log(
      ` Bulk assigning hub ${hub_id} to ${order_ids.length} order(s):`,
      order_ids.join(', ')
    );

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    const upstreamRes = await fetch(
      `${normalizedBase}/orders/bulk/assign-hub`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ hub_id, order_ids })
      }
    );

    const rawText = await upstreamRes.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }

    console.log(
      ' Upstream bulk assign-hub response:',
      JSON.stringify(data, null, 2)
    );

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Failed to bulk assign hub',
          error: rawText
        },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        data?.message ||
        `Hub assigned to ${order_ids.length} order(s) successfully`,
      data: data?.orders ?? data?.data ?? data
    });
  } catch (err) {
    console.error(' POST /bulk/assign-hub error:', err);
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(err) },
      { status: 500 }
    );
  }
}
