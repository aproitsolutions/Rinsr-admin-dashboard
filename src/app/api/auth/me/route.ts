import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
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

    // console.log(
    //   '📡 Fetching current admin from:',
    //   `${normalizedBase}/admins/me`
    // );

    const upstreamRes = await fetch(`${normalizedBase}/admins/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    const textData = await upstreamRes.text();
    let data;
    try {
      data = JSON.parse(textData);
    } catch (e) {
      console.error('❌ Me JSON parse failed:', e);
      console.error('📄 Raw Me Response:', textData);
      data = {};
    }

    if (!upstreamRes.ok) {
      console.error('❌ Upstream Me Error:', textData);
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Failed to fetch admin',
          error: data,
          raw: textData
        },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json({ success: true, admin: data?.admin || data });
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
