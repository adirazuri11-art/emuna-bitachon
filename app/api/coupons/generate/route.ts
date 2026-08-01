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

// Generate unique coupon code
function generateCouponCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 8;
  let code = 'EMUNA';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST: Generate coupon for new club member
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { email, firstName, discountPercentage = 15 } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Add to club_members if not exists
    const { data: existingMember, error: checkError } = await supabase
      .from('club_members')
      .select('id')
      .eq('email', email)
      .single();

    if (!existingMember) {
      const { error: insertError } = await supabase
        .from('club_members')
        .insert({
          email,
          first_name: firstName,
          subscription_date: new Date(),
        });

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    // Generate unique coupon code
    let couponCode = generateCouponCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const { data: existing } = await supabase
        .from('coupons')
        .select('id')
        .eq('code', couponCode)
        .single();

      if (!existing) {
        isUnique = true;
      } else {
        couponCode = generateCouponCode();
        attempts++;
      }
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique coupon code' },
        { status: 500 }
      );
    }

    // Create coupon in database
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 60); // Valid for 60 days

    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .insert({
        code: couponCode,
        email,
        discount_percentage: discountPercentage,
        expires_at: expiryDate,
      })
      .select()
      .single();

    if (couponError) {
      return NextResponse.json({ error: couponError.message }, { status: 500 });
    }

    return NextResponse.json({
      coupon_code: couponCode,
      discount_percentage: discountPercentage,
      expires_at: expiryDate,
      message: 'קופון חדש נוצר בהצלחה! 🎁',
    });
  } catch (error) {
    console.error('Error generating coupon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
