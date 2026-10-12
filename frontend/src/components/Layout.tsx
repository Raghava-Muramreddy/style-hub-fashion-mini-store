import { Outlet, Link, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Cart } from '../types';

export default function Layout() {
  const { token, user, logout } = useAuth();

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    enabled: !!token,
    queryFn: () => api.get<Cart>('/cart', token ?? undefined),
  });

  return (
    <>
      <div className="announce">Free shipping on orders over ₹2,999 · Stripe test mode</div>
      <header className="site-header">
        <div className="container nav-shell">
          <Link to="/" className="brand">Style<span>Hub</span></Link>
          <nav className="main-nav" aria-label="Main navigation">
            <NavLink to="/" end>Shop</NavLink>
            {token && <NavLink to="/orders">Orders</NavLink>}
            {token && <NavLink to="/account">My Account</NavLink>}
            {token && (
              <NavLink to="/cart" className="cart-link">
                Cart {!!cart?.item_count && <span className="badge">{cart.item_count}</span>}
              </NavLink>
            )}
          </nav>
          <div className="nav-actions">
            {token ? (
              <>
                {user && (
                  <Link to="/account" className="welcome user-pill" title="Go to My Account">
                    👤 Hi, {user.full_name.split(' ')[0]}
                  </Link>
                )}
                <button className="secondary-btn" onClick={logout}>Logout</button>
              </>
            ) : (
              <>
                <Link className="secondary-btn" to="/login">Login</Link>
                <Link className="primary-btn" to="/register">Register</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-shell">
          <span>© {new Date().getFullYear()} StyleHub. All rights reserved.</span>
          <span>Secure payments by Stripe</span>
        </div>
      </footer>
    </>
  );
}
