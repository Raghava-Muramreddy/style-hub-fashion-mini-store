import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import Price from '../components/Price';
import { useAuth } from '../context/AuthContext';
import type { Order } from '../types';

type PaymentStatusResponse = {
  order_id: number;
  order_number?: string;
  payment_status: string;
  status: string;
  total_amount?: number;
  currency?: string;
};

export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  const sessionId = params.get('session_id') || params.get('pi') || params.get('payment_intent');
  const orderId = params.get('orderId');
  const isCancelled = params.get('cancelled') === '1';

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResponse | null>(null);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isCancelled) {
      setIsLoading(false);
      return;
    }

    if (!token) return;

    const lookupId = sessionId || orderId;
    if (!lookupId) {
      setIsLoading(false);
      setError('No session or order reference found to verify payment.');
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const verifyPayment = async () => {
      try {
        const data = await api.get<PaymentStatusResponse>(`/payments/${lookupId}/status`, token);
        if (cancelled) return;

        setPaymentStatus(data);

        if (data.payment_status === 'succeeded' || data.status === 'paid') {
          setIsLoading(false);
          // Invalidate cached cart and orders so they are freshly fetched
          queryClient.invalidateQueries({ queryKey: ['cart'] });
          queryClient.invalidateQueries({ queryKey: ['orders'] });

          // Fetch complete order details to show on confirmation screen
          const targetOrderId = data.order_id || orderId;
          if (targetOrderId) {
            try {
              const fullOrder = await api.get<Order>(`/orders/${targetOrderId}`, token);
              if (!cancelled) {
                setOrderDetails(fullOrder);
              }
            } catch {
              // Non-blocking: will fallback to paymentStatus
            }
          }
        } else if (data.payment_status === 'pending' && ++attempts < 10) {
          setTimeout(verifyPayment, 1500);
        } else {
          setIsLoading(false);
          queryClient.invalidateQueries({ queryKey: ['cart'] });
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
      } catch (err) {
        if (!cancelled) {
          setIsLoading(false);
          setError(err instanceof Error ? err.message : 'Could not verify payment');
        }
      }
    };

    verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [token, sessionId, orderId, isCancelled, queryClient]);

  // Cancelled State
  if (isCancelled) {
    return (
      <div className="confirmation-shell">
        <div className="status-hero cancelled-hero">
          <div className="status-icon-circle cancel-icon">✕</div>
          <h1>Payment Cancelled</h1>
          <p>Your payment session was cancelled. No charges were made to your account.</p>
          <div className="status-actions">
            <Link className="primary-btn" to="/cart">Return to Cart</Link>
            <Link className="secondary-btn" to="/">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  // Verifying State
  if (isLoading) {
    return (
      <div className="confirmation-shell">
        <div className="status-hero verifying-hero">
          <div className="spinner-large"></div>
          <h1>Verifying Payment...</h1>
          <p>Please wait while we confirm your payment with Stripe.</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !paymentStatus) {
    return (
      <div className="confirmation-shell">
        <div className="status-hero error-hero">
          <div className="status-icon-circle error-icon">!</div>
          <h1>Payment Verification Issue</h1>
          <p>{error || 'We could not locate the details of this payment.'}</p>
          <div className="status-actions">
            <Link className="primary-btn" to="/orders">View Orders</Link>
            <Link className="secondary-btn" to="/cart">Back to Cart</Link>
          </div>
        </div>
      </div>
    );
  }

  // Failed State
  if (paymentStatus.payment_status === 'failed' || paymentStatus.payment_status === 'cancelled') {
    return (
      <div className="confirmation-shell">
        <div className="status-hero failed-hero">
          <div className="status-icon-circle cancel-icon">✕</div>
          <h1>Payment Not Completed</h1>
          <p>Your payment could not be processed. Your cart items are preserved so you can try again.</p>
          {paymentStatus.order_id && <p className="order-tag">Reference: Order #{paymentStatus.order_id}</p>}
          <div className="status-actions">
            <Link className="primary-btn" to="/checkout">Try Checkout Again</Link>
            <Link className="secondary-btn" to="/cart">Return to Cart</Link>
          </div>
        </div>
      </div>
    );
  }

  // Still Processing State
  if (paymentStatus.payment_status === 'pending') {
    return (
      <div className="confirmation-shell">
        <div className="status-hero verifying-hero">
          <div className="spinner-large"></div>
          <h1>Payment Processing</h1>
          <p>Your payment is currently being processed by Stripe. Please check your orders in a moment.</p>
          <div className="status-actions">
            <Link className="primary-btn" to="/orders">View My Orders</Link>
            <Link className="secondary-btn" to="/account">My Account</Link>
          </div>
        </div>
      </div>
    );
  }

  // Succeeded State -> Beautiful Order Confirmation Screen
  const displayOrderNumber = orderDetails?.order_number || paymentStatus.order_number || `SH-${paymentStatus.order_id}`;
  const totalAmount = orderDetails?.total_amount ?? paymentStatus.total_amount ?? 0;
  const currency = 'INR';
  const createdDate = orderDetails?.created_at ? new Date(orderDetails.created_at).toLocaleString() : new Date().toLocaleString();

  return (
    <div className="order-confirmation-container">
      {/* Success Hero Header */}
      <div className="confirmation-header-banner">
        <div className="success-badge-circle">✓</div>
        <h1>Order Confirmed!</h1>
        <p className="subtitle">
          Thank you for your purchase{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}! Your order has been placed successfully and payment is confirmed.
        </p>
      </div>

      {/* Confirmation Meta Bar */}
      <div className="confirmation-meta-card">
        <div className="meta-col">
          <span className="meta-label">Order Number</span>
          <strong className="meta-value order-highlight">{displayOrderNumber}</strong>
        </div>
        <div className="meta-col">
          <span className="meta-label">Date & Time</span>
          <span className="meta-value">{createdDate}</span>
        </div>
        <div className="meta-col">
          <span className="meta-label">Payment Status</span>
          <span className="status-pill succeeded">Paid</span>
        </div>
        <div className="meta-col">
          <span className="meta-label">Payment Method</span>
          <span className="meta-value">Stripe Secure Checkout</span>
        </div>
      </div>

      {/* Main Order Details Grid */}
      <div className="confirmation-content-grid">
        {/* Left Column: Ordered Items List */}
        <div className="confirmation-card items-summary-card">
          <div className="card-header-row">
            <h2>Order Summary</h2>
            <span className="items-count-badge">
              {orderDetails?.items?.length ? `${orderDetails.items.length} item(s)` : 'Confirmed Items'}
            </span>
          </div>

          {orderDetails?.items && orderDetails.items.length > 0 ? (
            <div className="confirmation-items-list">
              {orderDetails.items.map((item) => (
                <div key={item.id} className="confirmation-item-row">
                  <div className="item-info">
                    <h4>{item.product_name_snapshot}</h4>
                    <span className="item-meta">
                      Qty: {item.quantity} × <Price amount={item.unit_price} currency={currency} />
                    </span>
                  </div>
                  <div className="item-line-total">
                    <strong><Price amount={item.line_total} currency={currency} /></strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-text">Items from your order are being prepared.</p>
          )}

          {/* Pricing Calculation Breakdown */}
          <div className="pricing-breakdown">
            <div className="breakdown-row">
              <span>Subtotal</span>
              <span><Price amount={orderDetails?.subtotal ?? totalAmount} currency={currency} /></span>
            </div>
            <div className="breakdown-row">
              <span>Standard Shipping</span>
              <span className="free-badge">FREE</span>
            </div>
            <div className="breakdown-row total-row">
              <span>Total Paid</span>
              <strong className="total-value"><Price amount={totalAmount} currency={currency} /></strong>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Info & Next Steps */}
        <div className="confirmation-card delivery-info-card">
          <h2>Delivery & Account Info</h2>

          <div className="info-block">
            <h3>Customer Contact</h3>
            <p className="info-text">{user?.full_name}</p>
            <p className="info-text">{user?.email}</p>
          </div>

          <div className="info-block">
            <h3>Shipping Status</h3>
            <p className="info-text">Standard Delivery (3-5 business days)</p>
            <span className="status-pill pending">Processing</span>
          </div>

          <div className="info-block helpful-note">
            <p>💡 A confirmation receipt has been generated. You can always track this order in your <strong>My Account</strong> dashboard.</p>
          </div>

          {/* Actions */}
          <div className="confirmation-action-buttons">
            <Link className="primary-btn full-btn" to="/account">
              View in My Account
            </Link>
            <Link className="secondary-btn full-btn" to={`/orders/${orderDetails?.id || paymentStatus.order_id}`}>
              Full Order Details
            </Link>
            <Link className="outline-btn full-btn" to="/">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
