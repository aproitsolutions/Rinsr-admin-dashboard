import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const token = (await cookies()).get('rinsr_token')?.value;

    if (!baseUrl)
      return NextResponse.json(
        { success: false, message: 'Missing RINSR_API_BASE' },
        { status: 500 }
      );

    if (!token)
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Missing token' },
        { status: 401 }
      );

    const normalizedBase = baseUrl.replace(/\/+$/, '');
    const finalUrl = `${normalizedBase}/analytics/revenue/monthly`;

    console.log('📡 Fetching revenue analytics from:', finalUrl);

    const upstream = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      console.error('Upstream error:', data);
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Failed to fetch revenue analytics'
        },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Proxy /api/analytics/revenue/monthly error:', error);
    return NextResponse.json(
      { success: false, message: 'Proxy error', error: String(error) },
      { status: 500 }
    );
  }
}
