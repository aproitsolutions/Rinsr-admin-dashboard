import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// GET /api/hubs/[id]
export async function GET(req: NextRequest, context: any) {
  const hubId = context?.params?.id;
  console.log(`🟢 GET /api/hubs/${hubId}`);

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
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    const upstreamRes = await fetch(`${normalizedBase}/hubs/${hubId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    const rawText = await upstreamRes.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }

    console.log('➡️ Upstream GET hub response:', JSON.stringify(data, null, 2));

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Hub not found',
          error: rawText
        },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      hub: data?.hub ?? data
    });
  } catch (err) {
    console.error('🔥 GET /hubs/[id] failed:', err);
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(err) },
      { status: 500 }
    );
  }
}

// PUT /api/hubs/[id]
export async function PUT(req: NextRequest, context: any) {
  const hubId = context?.params?.id;
  console.log(`🟡 PUT /api/hubs/${hubId}`);

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
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log('📦 Update hub payload:', JSON.stringify(body, null, 2));

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    const upstreamRes = await fetch(`${normalizedBase}/hubs/${hubId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(body)
    });

    const rawText = await upstreamRes.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }

    console.log('📤 Upstream PUT hub response:', JSON.stringify(data, null, 2));

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Hub update failed',
          error: rawText
        },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Hub updated successfully',
      hub: data?.hub ?? data
    });
  } catch (err) {
    console.error('🔥 PUT /hubs/[id] failed:', err);
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(err) },
      { status: 500 }
    );
  }
}

// DELETE /api/hubs/[id]
export async function DELETE(req: NextRequest, context: any) {
  const hubId = context?.params?.id;
  console.log(`🔴 DELETE /api/hubs/${hubId}`);

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
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    const upstreamRes = await fetch(`${normalizedBase}/hubs/${hubId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    const rawText = await upstreamRes.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }

    console.log(
      '🗑️ Upstream DELETE hub response:',
      JSON.stringify(data, null, 2)
    );

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Hub delete failed',
          error: rawText
        },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data?.message || 'Hub deleted successfully'
    });
  } catch (err) {
    console.error('🔥 DELETE /hubs/[id] failed:', err);
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(err) },
      { status: 500 }
    );
  }
}
