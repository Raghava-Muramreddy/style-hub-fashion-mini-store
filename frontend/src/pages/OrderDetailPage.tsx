import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import Price from '../components/Price';
import { useAuth } from '../context/AuthContext';
import type { Order } from '../types';

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const { token } = useAuth();

  const { data: order, error } = useQuery({
    queryKey: ['order', orderId],
    enabled: !!token && !!orderId,
    queryFn: async () => api.get<Order>(`/orders/${orderId}`, token ?? undefined),
  });

  if (error) return <p className="error-text">Order not found.</p>;
  if (!order) return <p>Loading order...</p>;

  return (
    <div>
      <h1>{order.order_number}</h1>
      <p>Status: <span className={`status-pill ${order.status}`}>{order.status.replace('_', ' ')}</span> &nbsp; Payment: <span className={`status-pill ${order.payment_status}`}>{order.payment_status}</span></p>
      <div className="order-items">
        {order.items.map((item) => (
          <div key={item.id} className="cart-row">
            <span>{item.product_name_snapshot}</span>
            <span>Qty {item.quantity}</span>
            <strong><Price amount={item.line_total} currency={order.currency.toUpperCase()} /></strong>
          </div>
        ))}
      </div>
      <div className="checkout-summary">
        <span>Total</span>
        <strong><Price amount={order.total_amount} currency={order.currency.toUpperCase()} /></strong>
      </div>
    </div>
  );
}
