import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// ✅ Fetch single complaint
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const upstreamUrl = `${normalizedBase}/complaints/${id}`;

    console.log('📡 Fetching single complaint from:', upstreamUrl);

    const upstreamRes = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    const data = await upstreamRes.json().catch(() => ({}));

    if (!upstreamRes.ok) {
      console.error(' Upstream error:', data);
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Failed to fetch complaint',
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

// ✅ Update complaint status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const baseUrl = process.env.RINSR_API_BASE;
    const token = (await cookies()).get('rinsr_token')?.value;

    if (!baseUrl || !token) {
      return NextResponse.json(
        { success: false, message: 'Configuration or Auth missing' },
        { status: 401 }
      );
    }

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    const upstreamUrl = `${normalizedBase}/complaints/${id}`;

    console.log('📡 Updating complaint status at:', upstreamUrl);

    const upstreamRes = await fetch(upstreamUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const data = await upstreamRes.json().catch(() => ({}));

    if (!upstreamRes.ok) {
      console.error(' Upstream error:', data);
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Failed to update complaint'
        },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
