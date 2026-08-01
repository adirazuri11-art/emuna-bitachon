import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(url, key);
}

// POST: Validate coupon code
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { coupon_code, email } = await request.json();

    if (!coupon_code || !email) {
      return NextResponse.json(
        { valid: false, error: 'Coupon code and email required' },
        { status: 400 }
      );
    }

    // Find coupon in database
    const { data: coupon, error: queryError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', coupon_code)
      .single();

    if (queryError || !coupon) {
      return NextResponse.json(
        { valid: false, error: 'קופון לא קיים' },
        { status: 404 }
      );
    }

    // Check if coupon is already used
    if (coupon.is_used) {
      return NextResponse.json(
        { valid: false, error: 'קופון זה כבר שימש ואינו עוד בתוקף' },
        { status: 400 }
      );
    }

    // Check if coupon belongs to email
    if (coupon.email !== email) {
      return NextResponse.json(
        { valid: false, error: 'קופון זה לא תואם לכתובת המייל שלך' },
        { status: 403 }
      );
    }

    // Check expiration
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'קופון פג תוקף' },
        { status: 400 }
      );
    }

    // Coupon is valid!
    return NextResponse.json({
      valid: true,
      discount_percentage: coupon.discount_percentage,
      discount_type: coupon.discount_type,
      coupon_id: coupon.id,
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
