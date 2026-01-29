import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

//   Fetch all complaints
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

    // Extract query params
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    // const search = searchParams.get('search'); // Uncomment if search is supported

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    // Construct upstream URL with params
    const upstreamUrl = new URL(`${normalizedBase}/complaints`);
    if (page) upstreamUrl.searchParams.set('page', page);
    if (limit) upstreamUrl.searchParams.set('limit', limit);
    // if (search) upstreamUrl.searchParams.set('search', search);

    // console.log('📡 Fetching complaints from:', upstreamUrl.toString());

    const upstreamRes = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });
    // console.log('Complaints data fetched successfully', upstreamRes);
    const data = await upstreamRes.json().catch(() => ({}));

    if (!upstreamRes.ok) {
      console.error(' Upstream error:', data);
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Failed to fetch complaints',
          error: data
        },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
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
