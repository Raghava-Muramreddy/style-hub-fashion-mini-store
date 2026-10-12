import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Price from '../components/Price';
import { useAuth } from '../context/AuthContext';
import type { Cart, Order } from '../types';

export default function AccountPage() {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    enabled: !!token,
    queryFn: async () => api.get<Order[]>('/orders', token ?? undefined),
  });

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    enabled: !!token,
    queryFn: async () => api.get<Cart>('/cart', token ?? undefined),
  });

  const totalSpent = orders
    ?.filter((o) => o.payment_status === 'succeeded' || o.status === 'paid')
    .reduce((sum, o) => sum + o.total_amount, 0) ?? 0;

  const userInitials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="account-container">
      {/* Account Overview Header */}
      <div className="account-header-card">
        <div className="account-user-info">
          <div className="account-avatar">{userInitials}</div>
          <div className="account-title-group">
            <h1>{user?.full_name}</h1>
            <p className="account-email">{user?.email}</p>
            <span className="badge-customer">Verified Customer</span>
          </div>
        </div>

        <div className="account-stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Orders</span>
            <strong className="stat-value">{orders?.length ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Spent</span>
            <strong className="stat-value">
              <Price amount={totalSpent} currency="INR" />
            </strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Cart Items</span>
            <strong className="stat-value">{cart?.item_count ?? 0}</strong>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="account-tabs">
        <button
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          My Orders ({orders?.length ?? 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile Details
        </button>
      </div>

      {/* Orders Tab Content */}
      {activeTab === 'orders' && (
        <div className="account-orders-section">
          <div className="section-header-row">
            <h2>Order History & Details</h2>
            <p>Review items, quantities, pricing, and fulfillment status for all your purchases.</p>
          </div>

          {ordersLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your orders...</p>
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="empty-state">
              <div className="icon-circle">📦</div>
              <h3>No orders yet</h3>
              <p>When you complete a checkout, your order and item details will appear here.</p>
              <Link className="primary-btn" to="/">Start Shopping</Link>
            </div>
          ) : (
            <div className="orders-cards-list">
              {orders.map((order) => {
                const currency = 'INR';
                const isPaid = order.payment_status === 'succeeded' || order.status === 'paid';
                return (
                  <div key={order.id} className="order-detail-card">
                    {/* Order Header */}
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

                    {/* Order Items List */}
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

                    {/* Order Footer */}
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
                          <span>Total Paid:</span>
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
          )}
        </div>
      )}

      {/* Profile Tab Content */}
      {activeTab === 'profile' && (
        <div className="account-profile-card">
          <h2>Personal Profile</h2>
          <div className="profile-grid">
            <div className="profile-field">
              <label>Full Name</label>
              <p>{user?.full_name}</p>
            </div>
            <div className="profile-field">
              <label>Email Address</label>
              <p>{user?.email}</p>
            </div>
            <div className="profile-field">
              <label>Account ID</label>
              <p>#{user?.id}</p>
            </div>
            <div className="profile-field">
              <label>Account Status</label>
              <span className="status-pill succeeded">Active</span>
            </div>
          </div>
          <div className="profile-actions">
            <button className="secondary-btn" onClick={logout}>Sign Out</button>
          </div>
        </div>
      )}
    </div>
  );
}
