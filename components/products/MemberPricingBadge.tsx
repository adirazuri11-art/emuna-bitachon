'use client';

import { isMemberOnlyProduct, getMemberDiscount, MEMBER_PRICING_COPY } from '@/lib/member-pricing';
import { Gift, TrendingDown } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface MemberPricingBadgeProps {
  productId: string;
  regularPrice: number;
  size?: 'sm' | 'md' | 'lg';
}

export function MemberPricingBadge({
  productId,
  regularPrice,
  size = 'md',
}: MemberPricingBadgeProps) {
  const isMember = isMemberOnlyProduct(productId);

  if (!isMember) return null;

  const discountPct = getMemberDiscount();
  const memberPrice = Math.round(regularPrice * (1 - discountPct / 100));
  const savingsAmount = regularPrice - memberPrice;

  return (
    <div className="flex flex-col gap-3">
      {/* Regular vs Member Price Comparison */}
      <div className="rounded-lg border border-gold/20 bg-gradient-to-r from-gold/5 to-transparent p-4">
        <div className="mb-2 flex items-center gap-2">
          <Gift className="h-4 w-4 text-gold" />
          <span className="text-xs font-bold uppercase tracking-wider text-gold">
            {MEMBER_PRICING_COPY.badge}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Regular Price */}
          <div>
            <p className="text-xs text-navy/60 mb-1">
              {MEMBER_PRICING_COPY.regularPriceLabel}
            </p>
            <p className="text-lg font-bold text-navy/50 line-through">
              {formatPrice(regularPrice)}
            </p>
          </div>

          {/* Member Price */}
          <div>
            <p className="text-xs text-gold font-bold mb-1">
              {MEMBER_PRICING_COPY.memberPriceLabel}
            </p>
            <p className="text-lg font-bold text-green-600">
              {formatPrice(memberPrice)}
            </p>
          </div>
        </div>

        {/* Savings Badge */}
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
          <TrendingDown className="h-4 w-4 text-green-600" />
          <p className="text-sm font-semibold text-green-700">
            חיסכון של {formatPrice(savingsAmount)} ({discountPct}%)
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="text-xs text-navy/60 mb-2">
          {MEMBER_PRICING_COPY.ctaButtonText}
        </p>
        <button className="w-full rounded-lg border border-gold bg-navy px-4 py-2 font-semibold text-gold transition-colors hover:bg-navy/90">
          הצטרפות למועדון
        </button>
      </div>
    </div>
  );
}
