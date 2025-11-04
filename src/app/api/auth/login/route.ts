import { NextRequest, NextResponse } from 'next/server';

function extractToken(payload: any): string | undefined {
  return (
    payload?.token ||
    payload?.access_token ||
    payload?.accessToken ||
    payload?.data?.token ||
    payload?.data?.access_token ||
    payload?.data?.accessToken
  );
}

export async function POST(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_RINSR_API_BASE;
    if (!baseUrl) {
      return NextResponse.json(
        { success: false, message: 'RINSR_API_BASE not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    const upstream = await fetch(`${normalizedBase}/admins/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, message: data?.message || upstream.statusText },
        { status: upstream.status }
      );
    }

    const token = extractToken(data);
    const res = NextResponse.json({ success: true, data });

    if (token) {
      res.cookies.set('rinsr_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7
      });
    }

    return res;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Login failed',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
