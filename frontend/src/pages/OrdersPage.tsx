import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Price from '../components/Price';
import { useAuth } from '../context/AuthContext';
import type { Order } from '../types';

export default function OrdersPage() {
  const { token } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    enabled: !!token,
    queryFn: async () => api.get<Order[]>('/orders', token ?? undefined),
  });

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon-circle">📦</div>
        <h1>No orders yet</h1>
        <p>When you complete a checkout, your order details will be displayed here.</p>
        <Link className="primary-btn" to="/">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="orders-page-shell">
      <div className="orders-page-header">
        <div>
          <h1>My Orders & Details</h1>
          <p>Review items, quantities, pricing, and tracking status for your purchases.</p>
        </div>
        <Link to="/account" className="secondary-btn">
          Go to My Account
        </Link>
      </div>

      <div className="orders-cards-list">
        {data.map((order) => {
          const currency = 'INR';
          const isPaid = order.payment_status === 'succeeded' || order.status === 'paid';
          return (
            <div key={order.id} className="order-detail-card">
              <div className="order-card-header">
                <div className="order-meta-info">
                  <span className="order-id-label">{order.order_number}</span>
                  <span className="order-date-text">
                    Placed on {new Date(order.created_at ?? Date.now()).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <div className="order-badges-group">
                  <span className={`status-pill ${order.payment_status}`}>
                    {isPaid ? 'Payment: Paid' : `Payment: ${order.payment_status}`}
                  </span>
                  <span className={`status-pill ${order.status}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="order-card-items-table">
                <div className="items-table-header">
                  <span>Item</span>
                  <span>Quantity</span>
                  <span>Unit Price</span>
                  <span>Line Total</span>
                </div>

                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => (
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
                  ))
                ) : (
                  <div className="items-table-row">
                    <span className="item-name muted-text">Order details processing</span>
                    <span>-</span>
                    <span>-</span>
                    <span>-</span>
                  </div>
                )}
              </div>

              <div className="order-card-footer">
                <div className="order-footer-details">
                  {order.paid_at && (
                    <span className="paid-timestamp">
                      ✓ Paid at {new Date(order.paid_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <div className="order-card-total-action">
                  <div className="total-display">
                    <span>Total:</span>
                    <strong><Price amount={order.total_amount} currency={currency} /></strong>
                  </div>
                  <Link to={`/orders/${order.id}`} className="secondary-btn small-btn">
                    View Receipt
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
