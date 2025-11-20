import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/orders/bulk/assign-vendor
 * Bulk assign vendor to multiple orders
 */
export async function POST(request: NextRequest) {
  console.log(` POST /api/orders/bulk/assign-vendor`);

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
    const { vendor_id, order_ids } = body;

    if (!vendor_id) {
      return NextResponse.json(
        { success: false, message: 'vendor_id is required' },
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
      ` Bulk assigning vendor ${vendor_id} to ${order_ids.length} orders`
    );

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    // Use the bulk assign-vendor endpoint (POST)
    const upstreamRes = await fetch(
      `${normalizedBase}/orders/bulk/assign-vendor`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ vendor_id, order_ids })
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
      'Upstream bulk assign-vendor response:',
      JSON.stringify(data, null, 2)
    );

    if (!upstreamRes.ok) {
      // If bulk endpoint doesn't exist (404), fallback to individual assign-vendor endpoints
      if (upstreamRes.status === 404) {
        console.log(
          ` Bulk endpoint not found, falling back to individual assign-vendor endpoints (POST)`
        );

        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];

        // Use individual assign-vendor endpoint for each order
        const promises = order_ids.map(async (orderId: string) => {
          try {
            console.log(
              `📤 Assigning vendor ${vendor_id} to order ${orderId} via POST /assign-vendor`
            );

            const assignRes = await fetch(
              `${normalizedBase}/orders/${orderId}/assign-vendor`,
              {
                method: 'PATCH',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                  Accept: 'application/json'
                },
                body: JSON.stringify({ vendor_id })
              }
            );

            const assignText = await assignRes.text();
            let assignData: any;
            try {
              assignData = JSON.parse(assignText);
            } catch {
              assignData = { raw: assignText };
            }

            if (assignRes.ok && assignData.success) {
              successCount++;
              return { success: true, orderId };
            } else {
              failCount++;
              const errorMsg =
                assignData?.message || `POST returned ${assignRes.status}`;
              errors.push(`Order ${orderId}: ${errorMsg}`);
              return { success: false, orderId, error: errorMsg };
            }
          } catch (error) {
            failCount++;
            errors.push(`Order ${orderId}: ${String(error)}`);
            return { success: false, orderId, error: String(error) };
          }
        });

        await Promise.all(promises);

        if (successCount > 0) {
          return NextResponse.json({
            success: true,
            message: `Vendor assigned to ${successCount} of ${order_ids.length} order(s) successfully`,
            data: { successCount, failCount, total: order_ids.length }
          });
        } else {
          return NextResponse.json(
            {
              success: false,
              message: `Failed to assign vendor to all orders`,
              error: errors.join('; ')
            },
            { status: 400 }
          );
        }
      }

      // If bulk endpoint exists but returned error
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Failed to bulk assign vendor',
          error: rawText
        },
        { status: upstreamRes.status }
      );
    }

    // Success - bulk endpoint worked
    return NextResponse.json({
      success: true,
      message:
        data?.message ||
        `Vendor assigned to ${order_ids.length} order(s) successfully`,
      data: data?.orders ?? data?.data ?? data
    });
  } catch (err) {
    console.error(' POST /bulk/assign-vendor error:', err);
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(err) },
      { status: 500 }
    );
  }
}
