import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/Common/GlassCard';
import { LogIn } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please enter both email and password');
    }
    
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
    }}>
      <GlassCard className="auth-card" style={{ maxWidth: '440px', width: '100%', border: '2px solid #000', boxShadow: '6px 6px 0px #000' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '12px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
            Welcome to <span style={{ backgroundColor: 'var(--primary)', padding: '2px 10px', border: '2px solid #000', borderRadius: 'var(--radius-sm)', display: 'inline-block', transform: 'rotate(-2deg)' }}>SplitSphere</span>
          </h2>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.95rem' }}>
            Manage expenses, split bills, and chat in real-time.
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid hsl(var(--danger))',
            color: 'hsl(var(--danger-hover))',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. gaurav@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '14px', marginBottom: '20px' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
          New to SplitSphere?{' '}
          <Link to="/register" style={{ color: 'hsl(var(--primary))', textDecoration: 'none', fontWeight: '600' }}>
            Create an account
          </Link>
        </p>
      </GlassCard>
    </div>
  );
};

export default Login;
