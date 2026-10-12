import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

type PaymentStatus = { order_id: number; payment_status: string; status: string };

export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const paymentIntentId = params.get('pi');
  const orderId = params.get('orderId');
  const [result, setResult] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState('');

  // The backend verifies the payment with Stripe; poll briefly while it is still processing.
  useEffect(() => {
    if (!token || !paymentIntentId) return;
    let cancelled = false;
    let attempts = 0;

    const check = async () => {
      try {
        const data = await api.get<PaymentStatus>(`/payments/${paymentIntentId}/status`, token);
        if (cancelled) return;
        setResult(data);
        if (data.payment_status === 'pending' && ++attempts < 10) {
          setTimeout(check, 1500);
        } else {
          queryClient.invalidateQueries({ queryKey: ['cart'] });
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not verify payment');
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [token, paymentIntentId, queryClient]);

  let title = 'Verifying payment...';
  let message = 'Please wait while we confirm your payment.';
  if (!paymentIntentId) {
    title = 'Payment issue';
    message = 'No payment to verify.';
  } else if (error) {
    title = 'Payment issue';
    message = error;
  } else if (result?.payment_status === 'succeeded') {
    title = 'Payment successful';
    message = 'Thank you! Your order has been paid.';
  } else if (result?.payment_status === 'failed' || result?.payment_status === 'cancelled') {
    title = 'Payment failed';
    message = 'Your payment was not completed. Your cart is unchanged, so you can try again.';
  } else if (result) {
    title = 'Processing';
    message = 'Your payment is still processing. Check your orders shortly.';
  }

  return (
    <div className="empty-state">
      <h1>{title}</h1>
      <p>{message}</p>
      {orderId && <p>Order #{orderId}</p>}
      {result && result.payment_status !== 'succeeded' && result.payment_status !== 'pending' && (
        <Link className="secondary-btn" to="/cart">Back to cart</Link>
      )}
      <Link className="primary-btn" to="/orders">View orders</Link>
    </div>
  );
}
