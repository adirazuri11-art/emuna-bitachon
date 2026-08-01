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

// POST: Redeem coupon (mark as used)
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { coupon_code, order_id } = await request.json();

    if (!coupon_code || !order_id) {
      return NextResponse.json(
        { success: false, error: 'Coupon code and order ID required' },
        { status: 400 }
      );
    }

    // Find and update coupon
    const { data: coupon, error: updateError } = await supabase
      .from('coupons')
      .update({
        is_used: true,
        used_at: new Date(),
        used_in_order_id: order_id,
      })
      .eq('code', coupon_code)
      .select()
      .single();

    if (updateError || !coupon) {
      return NextResponse.json(
        { success: false, error: 'Failed to redeem coupon' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'קופון שומש בהצלחה ✅',
      coupon_code: coupon.code,
      used_at: coupon.used_at,
    });
  } catch (error) {
    console.error('Error redeeming coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
