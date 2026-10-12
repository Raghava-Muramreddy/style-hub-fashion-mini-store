import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Price from '../components/Price';
import { useAuth } from '../context/AuthContext';
import type { Cart } from '../types';

export default function CartPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    enabled: !!token,
    queryFn: async () => api.get<Cart>('/cart', token ?? undefined),
  });

  if (isLoading) return <p>Loading cart...</p>;
  if (!cart || cart.items.length === 0) return <div className="empty-state"><h2>Your cart is empty</h2><Link className="primary-btn" to="/">Shop now</Link></div>;

  const run = async (action: () => Promise<unknown>) => {
    setError('');
    try {
      await action();
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cart update failed');
    }
  };

  const updateQty = (itemId: number, qty: number) => run(() => api.patch(`/cart/items/${itemId}`, { quantity: qty }, token ?? undefined));
  const removeItem = (itemId: number) => run(() => api.del(`/cart/items/${itemId}`, token ?? undefined));
  const currency = cart.currency.toUpperCase();

  return (
    <div>
      <h1>Your cart</h1>
      {error && <p className="error-text">{error}</p>}
      <div className="cart-list">
        {cart.items.map((item) => (
          <div key={item.id} className="cart-row">
            <div>
              <h3>{item.product_name}</h3>
              <p><Price amount={item.unit_price ?? 0} currency={currency} /></p>
            </div>
            <div className="qty-controls">
              <button disabled={item.quantity <= 1} onClick={() => updateQty(item.id, item.quantity - 1)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
            </div>
            <strong><Price amount={item.line_total ?? 0} currency={currency} /></strong>
            <button className="secondary-btn" onClick={() => removeItem(item.id)}>Remove</button>
          </div>
        ))}
      </div>
      <div className="checkout-summary">
        <span>Subtotal</span>
        <strong><Price amount={cart.subtotal} currency={currency} /></strong>
        <Link className="primary-btn" to="/checkout">Proceed to checkout</Link>
      </div>
    </div>
  );
}
