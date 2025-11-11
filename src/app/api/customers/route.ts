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

    // ✅ Ensure no duplicate slashes
    const normalizedBase = baseUrl.replace(/\/+$/, '');
    // ✅ Correct backend path (plural "reports")
    const finalUrl = `${normalizedBase}/reports/customers`;

    console.log('📡 Fetching subscriptions report from:', finalUrl);

    const upstream = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    // Try to parse even if it’s an error response
    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      console.error(' Upstream error:', data);
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Failed to fetch subscriptions report'
        },
        { status: upstream.status }
      );
    }

    // console.log(' Subscriptions report fetched successfully', data);
    return NextResponse.json(
      {
        success: true,
        message: 'Subscriptions report fetched successfully',
        data
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(' Proxy /api/subscriptions-report error:', error);
    return NextResponse.json(
      { success: false, message: 'Proxy error', error: String(error) },
      { status: 500 }
    );
  }
}
