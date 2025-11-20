import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// GET /api/users/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const cookieStore = await cookies();
    const token = cookieStore.get('rinsr_token')?.value;

    if (!baseUrl) {
      return NextResponse.json(
        { success: false, message: 'Missing RINSR_API_BASE' },
        { status: 500 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Missing token' },
        { status: 401 }
      );
    }

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    const finalUrl = `${normalizedBase}/users/${id}`;
    console.log(' Fetching user from:', finalUrl);

    const upstream = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      console.error(' Upstream error:', data);
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to fetch user' },
        { status: upstream.status }
      );
    }

    return NextResponse.json(
      { success: true, message: 'User fetched successfully', data },
      { status: 200 }
    );
  } catch (error) {
    console.error(' Proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Proxy error', error: String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const cookieStore = await cookies();
    const token = cookieStore.get('rinsr_token')?.value;
    const body = await request.json();

    if (!baseUrl) {
      return NextResponse.json(
        { success: false, message: 'Missing RINSR_API_BASE' },
        { status: 500 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Missing token' },
        { status: 401 }
      );
    }

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    const finalUrl = `${normalizedBase}/users/${id}`;
    console.log(' Updating user at:', finalUrl);

    const upstream = await fetch(finalUrl, {
      method: 'PATCH',
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
        { success: false, message: data.message || 'Failed to update user' },
        { status: upstream.status }
      );
    }

    return NextResponse.json(
      { success: true, message: 'User updated successfully', data },
      { status: 200 }
    );
  } catch (error) {
    console.error(' Proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Proxy error', error: String(error) },
      { status: 500 }
    );
  }
}
