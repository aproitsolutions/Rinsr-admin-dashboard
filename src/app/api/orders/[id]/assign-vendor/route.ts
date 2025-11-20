import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/orders/[id]/assign-vendor
 * Assign a vendor to an order
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await context.params;
  console.log(`🟢 POST /api/orders/${orderId}/assign-vendor`);

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
    const { vendor_id } = body;

    if (!vendor_id) {
      return NextResponse.json(
        { success: false, message: 'vendor_id is required' },
        { status: 400 }
      );
    }

    console.log(`📦 Assigning vendor ${vendor_id} to order ${orderId}`);

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    // Try the assign-vendor endpoint first
    let upstreamRes = await fetch(
      `${normalizedBase}/orders/${orderId}/assign-vendor`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ vendor_id })
      }
    );

    // If assign-vendor endpoint doesn't exist (404), fetch order first then update with vendor_id
    if (upstreamRes.status === 404) {
      console.log(
        `⚠️ assign-vendor endpoint not found, fetching order and updating with vendor_id`
      );

      // Fetch current order
      const getRes = await fetch(`${normalizedBase}/orders/${orderId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });

      if (!getRes.ok) {
        const getText = await getRes.text();
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to fetch order',
            error: getText
          },
          { status: getRes.status }
        );
      }

      const orderData = await getRes.json();
      const currentOrder = orderData.order || orderData.data || orderData;

      // Use PATCH method (works in Insomnia)
      const patchPayload = {
        vendor_id: vendor_id
      };

      console.log(`Updating order ${orderId} with vendor_id: ${vendor_id}`);
      console.log(
        ` Using PATCH method with:`,
        JSON.stringify(patchPayload, null, 2)
      );

      // Try PATCH first (since it works in Insomnia)
      upstreamRes = await fetch(`${normalizedBase}/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(patchPayload)
      });

      // If PATCH fails, try PUT with full order
      if (!upstreamRes.ok) {
        console.log(`PATCH failed, trying PUT with full order`);
        const updatePayload = {
          ...currentOrder,
          vendor_id: vendor_id
        };

        upstreamRes = await fetch(`${normalizedBase}/orders/${orderId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify(updatePayload)
        });
      }
    }

    const rawText = await upstreamRes.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }

    console.log(
      ' Upstream assign-vendor response:',
      JSON.stringify(data, null, 2)
    );

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Failed to assign vendor',
          error: rawText
        },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor assigned successfully',
      data: data?.order ?? data?.data ?? data
    });
  } catch (err) {
    console.error(' POST /assign-vendor error:', err);
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(err) },
      { status: 500 }
    );
  }
}
