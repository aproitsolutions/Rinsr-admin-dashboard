import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface PermissionsResponse {
  success: boolean;
  message: string;
  allowedPages?: string[];
  role?: string;
  error?: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    const { role } = await params;

    const baseUrl = process.env.RINSR_API_BASE;
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('rinsr_token')?.value;
    const token = cookieToken || undefined;

    if (!baseUrl) {
      return NextResponse.json(
        {
          success: false,
          message: 'Server missing RINSR_API_BASE',
          error: 'Missing environment variable'
        },
        { status: 500 }
      );
    }

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          error: 'No token provided'
        },
        { status: 401 }
      );
    }

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    const upstreamRes = await fetch(
      `${normalizedBase}/role-permissions/${role}`,
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
      const errorRes: PermissionsResponse = {
        success: false,
        message: 'Upstream fetch failed',
        error: data?.message || upstreamRes.statusText
      };
      return NextResponse.json(errorRes, { status: upstreamRes.status });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Permissions fetched successfully',
        role,
        allowedPages: data.allowedPages || []
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch permissions',
        error: err.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    const { role } = await params;

    const baseUrl = process.env.RINSR_API_BASE;
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('rinsr_token')?.value;
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

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    const upstreamRes = await fetch(
      `${normalizedBase}/role-permissions/${role}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    const rawText = await upstreamRes.text();
    let data: any;

    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }

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
      message: 'Permissions updated successfully',
      role,
      allowedPages: data.allowedPages
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update permissions',
        error: err.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
