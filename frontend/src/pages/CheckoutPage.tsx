import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { api } from '../api/client';
import Price from '../components/Price';
import { useAuth } from '../context/AuthContext';
import type { Cart } from '../types';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

type CheckoutResponse = {
  client_secret: string;
  payment_intent_id: string;
  checkout_url: string;
  order_id: number;
  order_number: string;
  amount: number;
  currency: string;
};

function CheckoutForm() {
  const { token, user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    enabled: !!token,
    queryFn: async () => api.get<Cart>('/cart', token ?? undefined),
  });

  if (isLoading) return <p>Loading...</p>;
  if (!cart || cart.items.length === 0) {
    return <div className="empty-state"><h2>Your cart is empty</h2><Link className="primary-btn" to="/">Shop now</Link></div>;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if ( !token) return;
   /* const card = elements.getElement(CardElement);
    if (!card) {
      setError('Card element is not ready');
      return;
    }
    setIsSubmitting(true);
    setError('');*/

    let checkout: CheckoutResponse | null = null;
    try {
      checkout = await api.post<CheckoutResponse>('/checkout', {}, token);
       window.location.href = checkout.checkout_url;
      // const result = await stripe.confirmCardPayment(checkout.client_secret, {
      //   payment_method: { card, billing_details: { name: user?.full_name, email: user?.email } },
      // });
      // if (result.error) {
      //   throw new Error(result.error.message || 'Payment failed');
      // }
      // navigate(`/payment?orderId=${checkout.order_id}&pi=${checkout.payment_intent_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete checkout');
      setIsSubmitting(false);
    }
  };

  return (
    <form className="stack-form" onSubmit={handleSubmit}>
      <h1>Checkout</h1>
      <div className="checkout-box">
        <p>Order total</p>
        <strong><Price amount={cart.subtotal} currency={cart.currency.toUpperCase()} /></strong>
      </div>
    {/*  <label>
        Card details (test card 4242 4242 4242 4242)
        <div className="card-box"><CardElement options={{ hidePostalCode: true }} /></div>
      </label> */}
      {error && <p className="error-text">{error}</p>}
      <button className="primary-btn" type="submit" disabled={isSubmitting || !stripe}>
        {isSubmitting ? 'Processing...' : 'Pay now'}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
