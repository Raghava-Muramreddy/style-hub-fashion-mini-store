import { Link } from 'react-router-dom';
import Price from './Price';
import type { Product } from '../types';

export default function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock_quantity < 1;
  const low = !soldOut && product.stock_quantity <= 5;

  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-image-wrap" aria-label={product.name}>
        <img src={product.image_url} alt={product.name} loading="lazy" />
        {soldOut && <span className="tag out">Sold out</span>}
        {low && <span className="tag low">Only {product.stock_quantity} left</span>}
      </Link>
      <div className="product-body">
        <div className="meta-row">{product.category}</div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="product-footer">
          <Price amount={product.price} currency={product.currency.toUpperCase()} />
          <Link className="primary-btn compact" to={`/products/${product.id}`}>View</Link>
        </div>
      </div>
    </article>
  );
}
