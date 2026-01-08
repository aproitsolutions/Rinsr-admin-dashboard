import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const token = (await cookies()).get('rinsr_token')?.value;

    if (!baseUrl || !token) {
      return NextResponse.json(
        { success: false, message: 'Missing base URL or token' },
        { status: 401 }
      );
    }

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    const res = await fetch(`${normalizedBase}/services/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to fetch service',
          error: data?.message
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Service fetched',
      service: data.service
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'Internal error', error: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const token = (await cookies()).get('rinsr_token')?.value;
    const body = await req.json();

    if (!baseUrl || !token) {
      return NextResponse.json(
        { success: false, message: 'Missing base URL or token' },
        { status: 401 }
      );
    }

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    const res = await fetch(`${normalizedBase}/services/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to update service',
          error: data?.message
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Service updated successfully',
      service: data.service
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'Internal error', error: err.message },
      { status: 500 }
    );
  }
}
