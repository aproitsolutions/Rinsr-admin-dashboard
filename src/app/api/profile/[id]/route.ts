import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function PUT(
  req: NextRequest,
  context: { params: Record<string, string | undefined> }
) {
  // await the params proxy before reading .id
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { success: false, message: 'Missing id param' },
      { status: 400 }
    );
  }

  try {
    const baseUrl = process.env.RINSR_API_BASE;
    if (!baseUrl) {
      return NextResponse.json(
        { success: false, message: 'Missing base URL' },
        { status: 500 }
      );
    }

    const cookieToken = (await cookies()).get('rinsr_token')?.value;
    const token = cookieToken || undefined;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: missing token' },
        { status: 401 }
      );
    }

    const body = await req.json();

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl.replace(/\/+$/, '')
      : baseUrl.replace(/\/+$/, '') + '/api';

    const upstream = await fetch(`${normalizedBase}/admins/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const text = await upstream.text();

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: upstream.status });
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Upstream returned non-JSON',
          upstreamStatus: upstream.status,
          upstreamText: text
        },
        { status: 502 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update admin',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
