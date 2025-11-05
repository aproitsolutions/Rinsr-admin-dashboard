import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// ✅ GET single admin
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // 👈 note: Promise
) {
  const { id } = await context.params; // 👈 must await
  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const token = (await cookies()).get('rinsr_token')?.value;

    if (!baseUrl || !token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized or missing config' },
        { status: 401 }
      );
    }

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    console.log('🔍 Fetching admin from:', `${normalizedBase}/admins/${id}`);
    console.log('🔍 Using token?', !!token);

    const upstream = await fetch(`${normalizedBase}/admins/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || `Failed to fetch admin: ${upstream.status}`
        },
        { status: upstream.status }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(error) },
      { status: 500 }
    );
  }
}

// ✅ PUT update admin
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // 👈 note: Promise
) {
  const { id } = await context.params; // 👈 must await
  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const token = (await cookies()).get('rinsr_token')?.value;
    const body = await request.json();

    if (!baseUrl || !token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized or missing config' },
        { status: 401 }
      );
    }

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    const upstream = await fetch(`${normalizedBase}/admins/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, message: data?.message || 'Failed to update admin' },
        { status: upstream.status }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(error) },
      { status: 500 }
    );
  }
}
