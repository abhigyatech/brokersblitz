import { NextRequest, NextResponse } from 'next/server';
import { getPropertyById, updateProperty, deleteProperty } from '../../../../lib/db/properties-store';
import { getSessionUser } from '../../../../lib/auth/user-store';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const property = getPropertyById(id);
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, property });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    const sessionToken = req.cookies.get('bb_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const user = getSessionUser(sessionToken);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Session expired' }, { status: 401 });
    }

    const { id } = await params;
    const property = getPropertyById(id);
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    if (user.role !== 'admin' && property.broker.id !== user.id && property.broker.name !== user.fullName) {
      return NextResponse.json({ success: false, error: 'Unauthorized to modify this listing' }, { status: 403 });
    }

    const updates = await req.json();
    const updated = updateProperty(id, updates);

    return NextResponse.json({
      success: true,
      message: 'Listing updated successfully',
      property: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Props) {
  try {
    const sessionToken = req.cookies.get('bb_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const user = getSessionUser(sessionToken);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Session expired' }, { status: 401 });
    }

    const { id } = await params;
    const property = getPropertyById(id);
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    if (user.role !== 'admin' && property.broker.id !== user.id && property.broker.name !== user.fullName) {
      return NextResponse.json({ success: false, error: 'Unauthorized to delete this listing' }, { status: 403 });
    }

    deleteProperty(id);

    return NextResponse.json({
      success: true,
      message: 'Property listing deleted',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

