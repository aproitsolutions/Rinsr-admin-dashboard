import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

interface PlanResponse {
  success: boolean;
  message?: string;
  plan?: any;
  error?: any;
}

/**
 * GET /api/plans/[id]
 * Fetch a single plan by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const planId = params.id;
  console.log(` GET /api/plans/${planId}`);

  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const cookieToken = (await cookies()).get('rinsr_token')?.value;
    const token = cookieToken || undefined;

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

    const upstreamRes = await fetch(`${normalizedBase}/plans/${planId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    const rawText = await upstreamRes.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }

    console.log(' Upstream GET plan response:', JSON.stringify(data, null, 2));

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Plan not found',
          error: rawText
        },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json({ success: true, plan: data?.plan ?? data });
  } catch (err) {
    console.error(' GET /plans/[id] failed:', err);
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(err) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/plans/[id]
 * Update an existing plan
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const planId = params.id;
  console.log(` PUT /api/plans/${planId}`);

  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const cookieToken = (await cookies()).get('rinsr_token')?.value;
    const token = cookieToken || undefined;

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

    const body = await request.json();
    console.log(' Update plan payload:', JSON.stringify(body, null, 2));

    const normalizedBase = baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/api`;

    const upstreamRes = await fetch(`${normalizedBase}/plans/${planId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(body)
    });

    const rawText = await upstreamRes.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }

    console.log(
      '📤 Upstream PUT plan response:',
      JSON.stringify(data, null, 2)
    );

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Plan update failed',
          error: rawText
        },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Plan updated successfully',
      plan: data?.plan ?? data
    });
  } catch (err) {
    console.error(' PUT /plans/[id] failed:', err);
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(err) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/plans/[id]
 * Delete a plan
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const planId = params.id;
  console.log(` DELETE /api/plans/${planId}`);

  try {
    const baseUrl = process.env.RINSR_API_BASE;
    const cookieToken = (await cookies()).get('rinsr_token')?.value;
    const token = cookieToken || undefined;

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

    const upstreamRes = await fetch(`${normalizedBase}/plans/${planId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    const rawText = await upstreamRes.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }

    console.log(' Upstream DELETE response:', JSON.stringify(data, null, 2));

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Plan delete failed',
          error: rawText
        },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data?.message || 'Plan deleted successfully'
    });
  } catch (err) {
    console.error(' DELETE /plans/[id] failed:', err);
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(err) },
      { status: 500 }
    );
  }
}
