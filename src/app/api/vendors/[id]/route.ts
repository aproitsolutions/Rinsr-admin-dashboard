import { NextRequest, NextResponse } from 'next/server';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://rinsrapi.aproitsolutions.in/api';

/* ============================================================
   GET VENDOR DETAILS
============================================================ */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const finalUrl = `${BASE_URL.replace(/\/+$/, '')}/vendors/${id}`;

  console.log('📡 Fetching vendor details from:', finalUrl);

  try {
    const res = await fetch(finalUrl, { method: 'GET', cache: 'no-store' });
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('❌ Non-JSON response:', text.slice(0, 200));
      return NextResponse.json(
        {
          success: false,
          message: 'Backend returned non-JSON response',
          raw: text.slice(0, 200)
        },
        { status: 502 }
      );
    }

    if (!res.ok) {
      console.error('❌ Vendor fetch failed:', data);
      return NextResponse.json(
        { success: false, message: 'Vendor fetch failed', data },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      vendor: data.vendor || data
    });
  } catch (err) {
    console.error('❌ Vendor fetch error:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch vendor' },
      { status: 500 }
    );
  }
}

/* ============================================================
   UPDATE VENDOR (PUT)
============================================================ */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const finalUrl = `${BASE_URL.replace(/\/+$/, '')}/vendors/${id}`;

  console.log('✏️ Updating vendor at:', finalUrl);

  try {
    const body = await req.json();

    const res = await fetch(finalUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      console.error(' Non-JSON response:', text.slice(0, 200));
      return NextResponse.json(
        {
          success: false,
          message: 'Backend returned non-JSON response',
          raw: text.slice(0, 200)
        },
        { status: 502 }
      );
    }

    if (!res.ok) {
      console.error(' Update failed:', data);
      return NextResponse.json(
        { success: false, message: 'Vendor update failed', data },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor updated successfully',
      vendor: data.vendor || data
    });
  } catch (err) {
    console.error(' Vendor update error:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to update vendor' },
      { status: 500 }
    );
  }
}

/* ============================================================
   UPDATE VENDOR PAYMENT STATUS (PATCH)
============================================================ */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const finalUrl = `${BASE_URL.replace(/\/+$/, '')}/vendors/${id}/payment-status`;

  console.log('💰 Updating vendor payment status at:', finalUrl);

  try {
    const body = await req.json();

    const res = await fetch(finalUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      console.error('❌ Non-JSON response:', text.slice(0, 200));
      return NextResponse.json(
        {
          success: false,
          message: 'Backend returned non-JSON response',
          raw: text.slice(0, 200)
        },
        { status: 502 }
      );
    }

    if (!res.ok) {
      console.error('❌ Update failed:', data);
      return NextResponse.json(
        { success: false, message: 'Vendor payment update failed', data },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor payment status updated successfully',
      vendor: data.vendor || data
    });
  } catch (err) {
    console.error('❌ Vendor payment update error:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to update vendor payment status' },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE VENDOR
============================================================ */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const finalUrl = `${BASE_URL.replace(/\/+$/, '')}/vendors/${id}`;

  console.log(' Deleting vendor at:', finalUrl);

  try {
    const res = await fetch(finalUrl, { method: 'DELETE' });

    const text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      console.error(' Non-JSON response:', text.slice(0, 200));
      return NextResponse.json(
        {
          success: false,
          message: 'Backend returned non-JSON response',
          raw: text.slice(0, 200)
        },
        { status: 502 }
      );
    }

    if (!res.ok) {
      console.error(' Delete failed:', data);
      return NextResponse.json(
        { success: false, message: 'Vendor delete failed', data },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor deleted successfully'
    });
  } catch (err) {
    console.error('Vendor delete error:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to delete vendor' },
      { status: 500 }
    );
  }
}
