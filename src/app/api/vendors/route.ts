import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
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
    const finalUrl = `${normalizedBase}/vendors`;

    console.log(' Fetching vendors from:', finalUrl);

    const upstream = await fetch(finalUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      console.error(' Upstream error:', data);
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to fetch vendors' },
        { status: upstream.status }
      );
    }

    // console.log('Vendors fetched successfully', data);

    const vendors =
      data.vendors ||
      data.data?.vendors ||
      (Array.isArray(data) ? data : []) ||
      [];

    return NextResponse.json({
      success: true,
      message: 'Vendors fetched successfully',
      vendors // <-- Send the array here
    });
  } catch (error) {
    console.error('Proxy /api/vendors error:', error);
    return NextResponse.json(
      { success: false, message: 'Proxy error', error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const normalizedBase = baseUrl.replace(/\/+$/, '');
    const finalUrl = `${normalizedBase}/vendors`;

    console.log('📡 Forwarding vendor creation request to:', finalUrl);

    const upstream = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      console.error('Upstream error (create vendor):', data);
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to create vendor' },
        { status: upstream.status }
      );
    }

    console.log(' Vendor created successfully');
    return NextResponse.json(
      { success: true, message: 'Vendor created successfully', data },
      { status: 200 }
    );
  } catch (error) {
    console.error(' Proxy /api/vendors POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Proxy error', error: String(error) },
      { status: 500 }
    );
  }
}
