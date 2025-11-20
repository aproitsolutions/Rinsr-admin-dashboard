import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// ✅ Fetch all users
export async function GET(request: NextRequest) {
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

    console.log('📡 Fetching all users from:', `${normalizedBase}/users`);

    const upstreamRes = await fetch(`${normalizedBase}/users`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    const data = await upstreamRes.json().catch(() => ({}));

    if (!upstreamRes.ok) {
      console.error(' Upstream error:', data);
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Failed to fetch users',
          error: data
        },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Users fetched successfully',
        users: data?.users || data,
        count:
          data?.count ?? (Array.isArray(data?.users) ? data.users.length : 0)
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ✅ Create a new user
export async function POST(request: NextRequest) {
  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const token = (await cookies()).get('rinsr_token')?.value;
    const body = await request.json();

    if (!baseUrl)
      return NextResponse.json(
        { success: false, message: 'Missing RINSR_API_BASE' },
        { status: 500 }
      );

    if (!token)
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Missing token' },
        { status: 401 }
      );

    const normalizedBase = baseUrl.replace(/\/+$/, '');
    const finalUrl = `${normalizedBase}/users`;

    console.log('📡 Creating new user at:', finalUrl);

    const upstream = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      console.error(' Upstream error:', data);
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to create user' },
        { status: upstream.status }
      );
    }

    return NextResponse.json(
      { success: true, message: 'User created successfully', data },
      { status: 201 }
    );
  } catch (error) {
    console.error(' Proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Proxy error', error: String(error) },
      { status: 500 }
    );
  }
}
