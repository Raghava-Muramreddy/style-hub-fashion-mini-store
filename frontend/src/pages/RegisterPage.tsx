import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(fullName.trim(), email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setBusy(false);
    }
  };

  return (
    <div className="form-panel">
      <h1>Create account</h1>
      <p className="form-sub">Join StyleHub to start shopping.</p>
      <form onSubmit={handleSubmit} className="stack-form">
        <label>
          Full name
          <input autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} required />
        </label>
        <label>
          Email
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} maxLength={72} required />
          <span className="muted">At least 8 characters</span>
        </label>
        {error && <p className="error-text" role="alert">{error}</p>}
        <button type="submit" className="primary-btn" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</button>
      </form>
      <p className="muted form-foot">Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}
