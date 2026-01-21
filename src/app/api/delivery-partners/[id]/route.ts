import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// ✅ Get, Update, Delete a delivery partner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const token = (await cookies()).get('rinsr_token')?.value;
    const { id } = await params;

    if (!baseUrl)
      return NextResponse.json(
        { success: false, message: 'Missing RINSR_API_BASE' },
        { status: 500 }
      );

    if (!token)
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;
    const finalUrl = `${normalizedBase}/delivery-partners/${id}`;

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
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Failed to fetch delivery partner'
        },
        { status: upstream.status }
      );
    }

    // Normalize data
    let partner = data;
    if (data.data) {
      partner = data.data;
    } else if (data.deliveryPartner) {
      partner = data.deliveryPartner;
    } else if (data.partner) {
      partner = data.partner;
    }

    return NextResponse.json(
      {
        success: true,
        data: partner
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: String(error)
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const token = (await cookies()).get('rinsr_token')?.value;
    const { id } = await params;
    const body = await request.json();

    if (!baseUrl)
      return NextResponse.json(
        { success: false, message: 'Missing RINSR_API_BASE' },
        { status: 500 }
      );

    if (!token)
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;
    const finalUrl = `${normalizedBase}/delivery-partners/${id}`;

    const upstream = await fetch(finalUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Failed to update delivery partner'
        },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: String(error)
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const token = (await cookies()).get('rinsr_token')?.value;
    const { id } = await params;
    const body = await request.json();

    if (!baseUrl)
      return NextResponse.json(
        { success: false, message: 'Missing RINSR_API_BASE' },
        { status: 500 }
      );

    if (!token)
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;
    const finalUrl = `${normalizedBase}/delivery-partners/${id}/payment-status`;

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
      console.error('Failed to update delivery partner:', {
        status: upstream.status,
        statusText: upstream.statusText,
        body: data,
        url: finalUrl,
        sentBody: body
      });
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Failed to update delivery partner'
        },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: String(error)
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const token = (await cookies()).get('rinsr_token')?.value;
    const { id } = await params;

    if (!baseUrl)
      return NextResponse.json(
        { success: false, message: 'Missing RINSR_API_BASE' },
        { status: 500 }
      );

    if (!token)
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;
    const finalUrl = `${normalizedBase}/delivery-partners/${id}`;

    const upstream = await fetch(finalUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Failed to delete delivery partner'
        },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: String(error)
      },
      { status: 500 }
    );
  }
}
