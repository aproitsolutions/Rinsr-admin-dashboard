// src/app/api/webusers/route.ts
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  try {
    const baseUrl = process.env.RINSR_API_BASE;
    if (!baseUrl) {
      return NextResponse.json(
        { success: false, message: 'RINSR_API_BASE not configured' },
        { status: 500 }
      );
    }

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    // read cookie (await for compatibility with Next version types)
    const cookieStore = await cookies();
    const token = cookieStore.get('rinsr_token')?.value;

    const upstreamRes = await fetch(`${normalizedBase}/webusers`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      cache: 'no-store'
    });

    const text = await upstreamRes.text();
    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    // propagate upstream status
    return NextResponse.json(data, { status: upstreamRes.status });
  } catch (err: any) {
    console.error('Error in /api/webusers', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch web users',
        error: err.message
      },
      { status: 500 }
    );
  }
}
