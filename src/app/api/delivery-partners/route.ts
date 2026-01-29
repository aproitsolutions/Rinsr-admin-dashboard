import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

//   Fetch all delivery partners
export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const cookieToken = (await cookies()).get('rinsr_token')?.value;
    const token = cookieToken || undefined;

    if (!baseUrl) {
      return NextResponse.json(
        { success: false, message: 'Missing RINSR_API_BASE' },
        { status: 500 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    const searchParams = request.nextUrl.searchParams;
    const queryParams = searchParams.toString();

    console.log(
      '📡 Fetching delivery partners from:',
      `${normalizedBase}/delivery-partners?${queryParams}`
    );

    const upstreamRes = await fetch(
      `${normalizedBase}/delivery-partners?${queryParams}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        },
        cache: 'no-store'
      }
    );

    const data = await upstreamRes.json().catch(() => ({}));

    if (!upstreamRes.ok) {
      console.error(' Upstream error:', data);
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Failed to fetch delivery partners',
          error: data
        },
        { status: upstreamRes.status }
      );
    }

    // Normalize data
    let partners = [];
    if (Array.isArray(data)) {
      partners = data;
    } else if (Array.isArray(data.data)) {
      partners = data.data;
    } else if (Array.isArray(data.deliveryPartners)) {
      partners = data.deliveryPartners;
    }

    return NextResponse.json(
      {
        success: true,
        data: partners,
        total_partners: data.total_partners || partners.length,
        page: data.page || 1,
        limit: data.limit || 10
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

//   Create a new delivery partner
export async function POST(request: NextRequest) {
  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const token = (await cookies()).get('rinsr_token')?.value;
    const body = await request.json();

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

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;
    const finalUrl = `${normalizedBase}/delivery-partners`;

    console.log('📡 Creating new delivery partner at:', finalUrl);

    const upstream = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      console.error(' Upstream error:', data);
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Failed to create delivery partner'
        },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(' Proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Proxy error', error: String(error) },
      { status: 500 }
    );
  }
}
