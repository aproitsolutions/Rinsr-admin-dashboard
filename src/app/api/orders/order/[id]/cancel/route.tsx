import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // ✅ Must await before accessing
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

    // Ensure correct API path
    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl}/api`;

    // Forward PATCH request to backend
    const upstreamRes = await fetch(
      `${normalizedBase}/orders/${orderId}/cancel`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      }
    );

    const data = await upstreamRes.json().catch(() => ({}));
    console.log('➡️ Upstream response:', upstreamRes.status, data);

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Upstream cancel failed'
        },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order canceled successfully',
      data
    });
  } catch (err) {
    console.error('🔥 Cancel order error:', err);
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(err) },
      { status: 500 }
    );
  }
}
