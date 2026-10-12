import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import Price from '../components/Price';
import { useAuth } from '../context/AuthContext';
import type { Product } from '../types';

export default function ProductDetailPage() {
  const { productId } = useParams();
  const { token } = useAuth();
  const [quantity, setQuantity] = useState(1);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { data: product, isLoading, error: loadError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.get<Product>(`/products/${productId}`),
  });

  const addToCart = async () => {
    if (!token) return;
    setMessage('');
    setError('');
    try {
      await api.post('/cart/items', { product_id: Number(productId), quantity }, token);
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      setMessage('Added to cart');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add to cart');
    }
  };

  if (isLoading) return <p>Loading product...</p>;
  if (loadError || !product) return <p className="error-text">Product not found.</p>;

  return (
    <div>
      <nav className="crumbs"><Link to="/">Shop</Link> / {product.category} / {product.name}</nav>
      <div className="detail-grid">
      <img className="detail-image" src={product.image_url} alt={product.name} />
      <div>
        <span className="eyebrow">{product.category}</span>
        <h1>{product.name}</h1>
        <div className="price-line"><Price amount={product.price} currency={product.currency.toUpperCase()} /></div>
        <p>{product.description}</p>
        <div className="counter-row">
          <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>-</button>
          <span>{quantity}</span>
          <button onClick={() => setQuantity((q) => Math.min(product.stock_quantity || 1, q + 1))}>+</button>
        </div>
        <button className="primary-btn" onClick={addToCart} disabled={!token || product.stock_quantity < 1}>Add to cart</button>
        {!token && <p className="muted"><Link to="/login">Sign in</Link> to add items to your cart.</p>}
        {message && <p className="muted">{message} — <Link to="/cart">view cart</Link></p>}
        {error && <p className="error-text">{error}</p>}
        <p className="muted">{product.stock_quantity} units available</p>
      </div>
      </div>
    </div>
  );
}
