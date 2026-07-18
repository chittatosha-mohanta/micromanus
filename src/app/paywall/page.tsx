'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CreditCard, Tag, Loader2, CheckCircle2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PaywallContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);

  // If payment was successful, redirect to dashboard
  if (success === 'true') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
          <p className="text-muted-foreground mb-6">5 credits have been added to your account.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  const handleCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await fetch('/api/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCouponError(data.error);
      } else {
        setCouponSuccess(true);
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    } catch {
      setCouponError('Something went wrong. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleStripePayment = async () => {
    setStripeLoading(true);

    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Payment error:', error);
      setStripeLoading(false);
    }
  };

  if (couponSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Coupon Redeemed!</h2>
          <p className="text-muted-foreground">5 credits added. Redirecting to dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        className="w-full max-w-lg relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Get Research Credits</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose your preferred method to get started
          </p>
        </div>

        <div className="space-y-6">
          {/* ── Coupon Method ───────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Tag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Coupon Code</h3>
                <p className="text-xs text-muted-foreground">Have a code? Redeem it here</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCoupon()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                id="coupon-input"
              />
              <button
                onClick={handleCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                id="redeem-coupon-btn"
              >
                {couponLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Redeem'
                )}
              </button>
            </div>
            {couponError && (
              <p className="text-xs text-destructive mt-2">{couponError}</p>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* ── Stripe Payment ──────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Credit Card Payment</h3>
                <p className="text-xs text-muted-foreground">$5.00 USD for 5 credits</p>
              </div>
            </div>
            <button
              onClick={handleStripePayment}
              disabled={stripeLoading}
              className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
              id="stripe-pay-btn"
            >
              {stripeLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecting to Stripe...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay $5.00 with Stripe
                </>
              )}
            </button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Secure payment powered by Stripe. Test cards accepted.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function PaywallPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <PaywallContent />
    </Suspense>
  );
}
