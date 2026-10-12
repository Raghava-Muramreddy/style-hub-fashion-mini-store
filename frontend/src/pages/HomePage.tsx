import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import ProductCard from '../components/ProductCard';
import type { Product } from '../types';

const PAGE_SIZE = 8;
const CATEGORIES = ['Women', 'Men', 'Accessories'];

export default function HomePage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', { page, debounced, category }],
    queryFn: async () => {
      const query = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
      if (debounced) query.set('q', debounced);
      if (category) query.set('category', category);
      return api.get<Product[]>(`/products?${query.toString()}`);
    },
    placeholderData: (previous) => previous,
  });

  const products = data ?? [];

  return (
    <div>
      <section className="hero-card">
        <span className="eyebrow">New season collection</span>
        <h1>Effortless style, every day.</h1>
        <p>Minimal, premium wardrobe staples designed to move with you.</p>
        <a className="primary-btn" href="#shop">Shop the collection</a>
      </section>

      <section className="perks">
        <div className="perk"><strong>Free shipping</strong><span>On all orders over ₹2,999</span></div>
        <div className="perk"><strong>Easy returns</strong><span>30 days, no questions asked</span></div>
        <div className="perk"><strong>Secure checkout</strong><span>Payments protected by Stripe</span></div>
      </section>

      <div className="section-head" id="shop">
        <h2>Shop all</h2>
        <div className="toolbar">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" aria-label="Search products" />
        </div>
      </div>

      <div className="chips" role="group" aria-label="Filter category">
        {['', ...CATEGORIES].map((item) => (
          <button key={item || 'all'} className={`chip ${category === item ? 'active' : ''}`} onClick={() => { setCategory(item); setPage(1); }}>
            {item || 'All'}
          </button>
        ))}
      </div>

      {error && <p className="error-text">Unable to load products.</p>}

      <section className="product-grid">
        {isLoading && Array.from({ length: PAGE_SIZE }, (_, i) => <div key={i} className="skeleton" />)}
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>

      {!isLoading && products.length === 0 && !error && (
        <div className="empty-state"><h2>No products found</h2><p>Try a different search or category.</p></div>
      )}

      {(page > 1 || products.length === PAGE_SIZE) && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
          <span>Page {page}</span>
          <button disabled={products.length < PAGE_SIZE} onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
