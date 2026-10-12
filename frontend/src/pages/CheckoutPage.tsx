import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Price from '../components/Price';
import { useAuth } from '../context/AuthContext';
import type { Cart } from '../types';

type CheckoutResponse = {
  client_secret: string;
  payment_intent_id: string;
  session_id: string;
  checkout_url: string;
  order_id: number;
  order_number: string;
  amount: number;
  currency: string;
};

export default function CheckoutPage() {
  const { token, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    enabled: !!token,
    queryFn: async () => api.get<Cart>('/cart', token ?? undefined),
  });

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Preparing your checkout...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon-circle">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Add some stylish items before heading to checkout.</p>
        <Link className="primary-btn" to="/">Shop Collection</Link>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      const checkout = await api.post<CheckoutResponse>('/checkout', {}, token);
      if (checkout.checkout_url) {
        window.location.href = checkout.checkout_url;
      } else {
        throw new Error('Unable to generate Stripe checkout session.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete checkout');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Secure Checkout</h1>
        <p>Review your order items and proceed to Stripe payment</p>
      </div>

      <div className="checkout-grid">
        <div className="checkout-review-card">
          <h2>Order Items ({cart.item_count})</h2>
          <div className="checkout-items-list">
            {cart.items.map((item) => (
              <div key={item.id} className="checkout-item-row">
                <div className="checkout-item-details">
                  <h4>{item.product_name || `Product #${item.product_id}`}</h4>
                  <span className="checkout-item-qty">Qty: {item.quantity}</span>
                </div>
                <div className="checkout-item-price">
                  <strong>
                    <Price amount={item.line_total ?? ((item.unit_price ?? 0) * item.quantity)} currency={cart.currency.toUpperCase()} />
                  </strong>
                </div>
              </div>
            ))}
          </div>

          <div className="checkout-customer-box">
            <h3>Customer Details</h3>
            <p><strong>Name:</strong> {user?.full_name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
          </div>
        </div>

        <form className="checkout-summary-card" onSubmit={handleSubmit}>
          <h2>Payment Summary</h2>

          <div className="summary-line">
            <span>Subtotal</span>
            <strong><Price amount={cart.subtotal} currency={cart.currency.toUpperCase()} /></strong>
          </div>

          <div className="summary-line">
            <span>Delivery</span>
            <span className="free-badge">FREE</span>
          </div>

          <div className="summary-divider"></div>

          <div className="summary-total-line">
            <span>Total to pay</span>
            <span className="total-amount">
              <Price amount={cart.subtotal} currency={cart.currency.toUpperCase()} />
            </span>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <button
            type="submit"
            className="primary-btn checkout-pay-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-inline"></span>
                Redirecting to Stripe...
              </>
            ) : (
              'Pay with Stripe'
            )}
          </button>

          <div className="stripe-trust-badges">
            <div className="trust-item">
              <span>🔒 256-Bit SSL Encryption</span>
            </div>
            <div className="trust-item">
              <span>💳 Powered by Stripe Checkout</span>
            </div>
            <div className="trust-item">
              <span>⚡ Instant Order Confirmation</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
