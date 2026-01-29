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

    //   Normalize the backend base URL to prevent double `/api/api`
    const normalizedBase = baseUrl.replace(/\/+$/, '');
    const finalUrl = `${normalizedBase}/reports`;

    console.log('📡 Fetching reports from:', finalUrl);

    //   Forward the request with the Authorization header
    const upstream = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    // Try parsing JSON even for error responses
    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      console.error(' Upstream error:', data);
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to fetch reports' },
        { status: upstream.status }
      );
    }

    console.log(' Reports data fetched successfully');
    return NextResponse.json(
      { success: true, message: 'Reports fetched successfully', data },
      { status: 200 }
    );
  } catch (error) {
    console.error(' Proxy /api/reports error:', error);
    return NextResponse.json(
      { success: false, message: 'Proxy error', error: String(error) },
      { status: 500 }
    );
  }
}
