import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="empty-state">
      <h1>Page not found</h1>
      <Link className="primary-btn" to="/">Go home</Link>
    </div>
  );
}
