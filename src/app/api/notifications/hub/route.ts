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

    const upstreamUrl = `${normalizedBase}/notifications/hub`;

    console.log('🔗 Proxying Notifications to:', upstreamUrl);

    const upstreamRes = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    const textData = await upstreamRes.text();
    let data;

    try {
      data = JSON.parse(textData);
    } catch (e) {
      console.error('❌ Failed to parse upstream JSON:', e);
      console.error('📄 Raw Response:', textData);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid JSON response from upstream',
          rawResponse: textData
        },
        { status: 502 } // Bad Gateway
      );
    }

    if (!upstreamRes.ok) {
      console.error(
        `❌ Upstream Error (${upstreamRes.status}):`,
        JSON.stringify(data, null, 2)
      );
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
    console.error('🔥 GET /api/notifications/hub failed:', error);
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
