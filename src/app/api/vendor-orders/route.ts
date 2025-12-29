import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
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
        { success: false, message: 'Unauthorized - Missing token' },
        { status: 401 }
      );
    }

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    // Build upstream URL
    const upstreamUrl = new URL(`${normalizedBase}/vendor-orders`);

    // Append all search parameters from the incoming request
    req.nextUrl.searchParams.forEach((value, key) => {
      upstreamUrl.searchParams.append(key, value);
    });

    console.log('🔗 Proxying Vendor Orders to:', upstreamUrl.toString());

    const upstreamRes = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });

    const rawText = await upstreamRes.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error('❌ Failed to parse JSON from upstream:', rawText);
      data = { raw: rawText };
      // If it's empty string, it might be valid if status is 204
      if (!rawText.trim()) {
        data = []; // default to empty array/object
      }
    }

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || `Fetch failed: ${upstreamRes.status}`,
          error: data
        },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('🔥 GET /api/vendor-orders failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
        { success: false, message: 'Unauthorized - Missing token' },
        { status: 401 }
      );
    }

    const body = await req.json();

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    console.log(
      '📦 Forwarding bulk assign to:',
      `${normalizedBase}/vendor-orders`
    );
    console.log('📦 Payload:', JSON.stringify(body, null, 2));

    const upstreamRes = await fetch(`${normalizedBase}/vendor-orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(body)
    });

    const rawText = await upstreamRes.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }

    if (!upstreamRes.ok) {
      console.error(
        '❌ Upstream Error Status:',
        upstreamRes.status,
        upstreamRes.statusText
      );
      console.error('❌ Upstream Error Body:', JSON.stringify(data, null, 2));

      return NextResponse.json(
        {
          success: false,
          message:
            data?.message ||
            `Bulk assign failed: ${upstreamRes.status} ${upstreamRes.statusText}`,
          error: data
        },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('🔥 POST /api/vendor-orders failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: String(error)
      },
      { status: 500 }
    );
  }
}
