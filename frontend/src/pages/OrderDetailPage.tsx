import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import Price from '../components/Price';
import { useAuth } from '../context/AuthContext';
import type { Order } from '../types';

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const { token, user } = useAuth();

  const { data: order, error, isLoading } = useQuery({
    queryKey: ['order', orderId],
    enabled: !!token && !!orderId,
    queryFn: async () => api.get<Order>(`/orders/${orderId}`, token ?? undefined),
  });

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="empty-state">
        <div className="icon-circle error-icon">!</div>
        <h2>Order Not Found</h2>
        <p>The requested order could not be located or you may not have access to view it.</p>
        <Link className="primary-btn" to="/account">Back to My Account</Link>
      </div>
    );
  }

  const currency = 'INR';
  const isPaid = order.payment_status === 'succeeded' || order.status === 'paid';

  return (
    <div className="order-detail-page-container">
      <div className="order-detail-top-nav">
        <Link to="/account" className="back-link">← Back to My Account</Link>
        <Link to="/orders" className="back-link">All Orders</Link>
      </div>

      <div className="order-detail-main-card">
        <div className="order-detail-header-row">
          <div>
            <h1>Order #{order.order_number}</h1>
            <p className="order-detail-date">
              Placed on {new Date(order.created_at ?? Date.now()).toLocaleString()}
            </p>
          </div>
          <div className="order-detail-badges">
            <span className={`status-pill ${order.payment_status}`}>
              {isPaid ? 'Payment: Paid' : `Payment: ${order.payment_status}`}
            </span>
            <span className={`status-pill ${order.status}`}>
              {order.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="order-detail-info-boxes">
          <div className="detail-box">
            <h4>Customer Information</h4>
            <p><strong>Name:</strong> {user?.full_name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
          </div>
          <div className="detail-box">
            <h4>Payment Information</h4>
            <p><strong>Method:</strong> Stripe Payment</p>
            <p><strong>Status:</strong> {order.payment_status.toUpperCase()}</p>
            {order.paid_at && (
              <p><strong>Paid at:</strong> {new Date(order.paid_at).toLocaleString()}</p>
            )}
          </div>
        </div>

        <div className="order-detail-items-section">
          <h3>Purchased Items ({order.items.length})</h3>
          <div className="order-card-items-table">
            <div className="items-table-header">
              <span>Item Description</span>
              <span>Quantity</span>
              <span>Unit Price</span>
              <span>Total</span>
            </div>
            {order.items.map((item) => (
              <div key={item.id} className="items-table-row">
                <span className="item-name">
                  <strong>{item.product_name_snapshot}</strong>
                </span>
                <span className="item-qty">Qty: {item.quantity}</span>
                <span className="item-price">
                  <Price amount={item.unit_price} currency={currency} />
                </span>
                <span className="item-total">
                  <Price amount={item.line_total} currency={currency} />
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pricing-breakdown detail-pricing">
          <div className="breakdown-row">
            <span>Subtotal</span>
            <span><Price amount={order.subtotal} currency={currency} /></span>
          </div>
          <div className="breakdown-row">
            <span>Standard Delivery</span>
            <span className="free-badge">FREE</span>
          </div>
          <div className="breakdown-row total-row">
            <span>Total Amount Paid</span>
            <strong className="total-value"><Price amount={order.total_amount} currency={currency} /></strong>
          </div>
        </div>

        <div className="order-detail-footer-actions">
          <button className="secondary-btn" onClick={() => window.print()}>
            🖨️ Print Receipt
          </button>
          <Link to="/" className="primary-btn">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
