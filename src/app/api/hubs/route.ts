import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface HubsResponse {
  success: boolean;
  message: string;
  hubs?: any[];
  error?: string;
  count?: number;
}

// GET /api/hubs  -> list hubs
export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const cookieToken = (await cookies()).get('rinsr_token')?.value;
    const token = cookieToken || undefined;

    if (!baseUrl) {
      const errorResponse: HubsResponse = {
        success: false,
        message: 'Server is not configured with RINSR_API_BASE',
        error: 'Missing server environment variable'
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    if (!token) {
      const errorResponse: HubsResponse = {
        success: false,
        message: 'Unauthorized',
        error: 'Missing bearer token'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const normalizedBase = baseUrl?.endsWith('/api')
      ? baseUrl
      : `${baseUrl?.replace(/\/+$/, '')}/api`;

    const upstreamRes = await fetch(`${normalizedBase}/hubs`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    const data = await upstreamRes.json().catch(() => ({}));

    if (!upstreamRes.ok) {
      const errorResponse: HubsResponse = {
        success: false,
        message: 'Upstream hubs fetch failed',
        error:
          data?.message ||
          upstreamRes.statusText ||
          `HTTP ${upstreamRes.status}`
      };
      return NextResponse.json(errorResponse, { status: upstreamRes.status });
    }

    const hubsArray =
      data?.hubs ?? data?.data?.hubs ?? (Array.isArray(data) ? data : []);

    const response: HubsResponse = {
      success: true,
      message: 'Hubs fetched successfully',
      hubs: hubsArray,
      count: Array.isArray(hubsArray) ? hubsArray.length : 0
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorResponse: HubsResponse = {
      success: false,
      message: 'Failed to fetch hubs',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST /api/hubs -> create hub
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    console.log('📦 Hub Create Payload:', JSON.stringify(body, null, 2));

    const normalizedBase = baseUrl?.endsWith('/api')
      ? baseUrl
      : `${baseUrl?.replace(/\/+$/, '')}/api`;

    const upstreamRes = await fetch(`${normalizedBase}/hubs`, {
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

    console.log(
      '📤 Upstream Hub Create Response:',
      JSON.stringify(data, null, 2)
    );

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Upstream error',
          error: rawText
        },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Hub created successfully',
      data
    });
  } catch (err) {
    console.error('🔥 POST /api/hubs failed:', err);
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(err) },
      { status: 500 }
    );
  }
}
