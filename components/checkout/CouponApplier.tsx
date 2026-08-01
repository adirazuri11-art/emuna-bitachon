'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader } from 'lucide-react';

interface CouponApplierProps {
  email: string;
  onCouponApplied: (discountPercentage: number, couponCode: string) => void;
}

export function CouponApplier({ email, onCouponApplied }: CouponApplierProps) {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);

  async function handleValidateCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon_code: couponCode.toUpperCase(),
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.error || 'קופון לא תקף');
        setSuccess('');
        return;
      }

      // Coupon is valid
      setSuccess(`קופון אומת בהצלחה! ${data.discount_percentage}% הנחה ✅`);
      setError('');
      setAppliedCoupon({
        code: couponCode.toUpperCase(),
        discount: data.discount_percentage,
      });
      onCouponApplied(data.discount_percentage, couponCode.toUpperCase());
    } catch (err) {
      setError('שגיאה בתיקוף הקופון. נסו שוב.');
      console.error('Coupon validation error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (appliedCoupon) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">קופון מופעל ✅</p>
            <p className="text-sm text-green-700">
              {appliedCoupon.code} — {appliedCoupon.discount}% הנחה
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-navy mb-2">
        קוד קופון (אם יש)
      </label>
      <form onSubmit={handleValidateCoupon} className="flex gap-2">
        <input
          type="text"
          placeholder="EMUNA123456"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          className="flex-1 rounded-lg border border-navy/20 px-4 py-2 text-sm placeholder-navy/40 focus:border-gold focus:outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !couponCode.trim()}
          className="rounded-lg bg-gold px-6 py-2 font-semibold text-navy disabled:opacity-50 hover:bg-gold/90 transition-colors"
        >
          {loading ? <Loader className="h-4 w-4 animate-spin" /> : 'תיקוף'}
        </button>
      </form>

      {error && (
        <div className="mt-3 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-3 flex gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}
    </div>
  );
}
