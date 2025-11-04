import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface ServicesResponse {
  success: boolean;
  message: string;
  services?: any[];
  error?: string;
  count?: number;
}

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const cookieToken = (await cookies()).get('rinsr_token')?.value;
    const token = cookieToken || undefined;

    if (!baseUrl) {
      const errorResponse: ServicesResponse = {
        success: false,
        message: 'Server is not configured with RINSR_API_BASE',
        error: 'Missing server environment variable'
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    if (!token) {
      const errorResponse: ServicesResponse = {
        success: false,
        message: 'Unauthorized',
        error: 'Missing bearer token'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const normalizedBase = baseUrl?.endsWith('/api')
      ? baseUrl
      : `${baseUrl?.replace(/\/+$/, '')}/api`;

    const upstreamRes = await fetch(`${normalizedBase}/services`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });
    const data = await upstreamRes.json().catch(() => ({}));
    if (!upstreamRes.ok) {
      const errorResponse: ServicesResponse = {
        success: false,
        message: 'Upstream services fetch failed',
        error:
          data?.message ||
          upstreamRes.statusText ||
          `HTTP ${upstreamRes.status}`
      };
      return NextResponse.json(errorResponse, { status: upstreamRes.status });
    }

    const response: ServicesResponse = {
      success: true,
      message: 'Services fetched successfully',
      services: data?.services ?? data,
      count:
        data?.count ??
        (Array.isArray(data?.services) ? data.services.length : 0)
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorResponse: ServicesResponse = {
      success: false,
      message: 'Failed to fetch services',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
