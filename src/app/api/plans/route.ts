import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface PlansResponse {
  success: boolean;
  message: string;
  plans?: any[];
  error?: string;
  count?: number;
}

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const cookieToken = (await cookies()).get('rinsr_token')?.value;
    const token = cookieToken || undefined;

    // Handle missing base URL
    if (!baseUrl) {
      const errorResponse: PlansResponse = {
        success: false,
        message: 'Server is not configured with RINSR_API_BASE',
        error: 'Missing server environment variable'
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Handle missing token
    if (!token) {
      const errorResponse: PlansResponse = {
        success: false,
        message: 'Unauthorized',
        error: 'Missing bearer token'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Normalize API base (make sure it ends with /api)
    const normalizedBase = baseUrl?.endsWith('/api')
      ? baseUrl
      : `${baseUrl?.replace(/\/+$/, '')}/api`;

    // Fetch from upstream Rinsr API
    const upstreamRes = await fetch(`${normalizedBase}/plans`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    const data = await upstreamRes.json().catch(() => ({}));

    // Handle upstream failure
    if (!upstreamRes.ok) {
      const errorResponse: PlansResponse = {
        success: false,
        message: 'Upstream plans fetch failed',
        error:
          data?.message ||
          upstreamRes.statusText ||
          `HTTP ${upstreamRes.status}`
      };
      return NextResponse.json(errorResponse, { status: upstreamRes.status });
    }

    // Return normalized response
    const response: PlansResponse = {
      success: true,
      message: 'Plans fetched successfully',
      plans: data?.plans ?? data,
      count: data?.count ?? (Array.isArray(data?.plans) ? data.plans.length : 0)
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorResponse: PlansResponse = {
      success: false,
      message: 'Failed to fetch plans',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    console.log(' Plan Create Payload:', JSON.stringify(body, null, 2));

    const upstreamRes = await fetch(`${baseUrl}/plans`, {
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
      ' Upstream Plan Create Response:',
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
      message: 'Plan created successfully',
      data
    });
  } catch (err) {
    console.error(' POST /api/plans failed:', err);
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(err) },
      { status: 500 }
    );
  }
}
