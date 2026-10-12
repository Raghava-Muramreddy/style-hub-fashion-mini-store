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

  if (isLoading) return <p>Loading orders...</p>;
  if (!data || data.length === 0) return <div className="empty-state"><h1>No orders yet</h1><Link className="primary-btn" to="/">Continue shopping</Link></div>;

  return (
    <div>
      <h1>Order history</h1>
      <div className="orders-list">
        {data.map((order) => (
          <Link key={order.id} to={`/orders/${order.id}`} className="order-row">
            <div>
              <h3>{order.order_number}</h3>
              <span className={`status-pill ${order.status}`}>{order.status.replace('_', ' ')}</span>
            </div>
            <div>
              <strong><Price amount={order.total_amount} currency={order.currency.toUpperCase()} /></strong>
              <p>{new Date(order.created_at ?? Date.now()).toLocaleDateString()}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
