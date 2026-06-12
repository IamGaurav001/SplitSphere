import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/Common/GlassCard';
import { UserPlus } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return setError('Please fill in all fields');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    setError('');
    setLoading(true);

    try {
      await register(name, email, password);
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
          <h2 style={{ fontSize: '2.2rem', marginBottom: '12px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
            Get <span style={{ backgroundColor: 'var(--primary)', padding: '2px 10px', border: '2px solid #000', borderRadius: 'var(--radius-sm)', display: 'inline-block', transform: 'rotate(2deg)' }}>Started</span>
          </h2>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.95rem' }}>
            Join SplitSphere to start splitting expenses with friends.
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
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Gaurav Dubey"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
              placeholder="Min. 6 characters"
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
            {loading ? 'Creating account...' : (
              <>
                <UserPlus size={18} /> Register
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'hsl(var(--primary))', textDecoration: 'none', fontWeight: '600' }}>
            Sign In
          </Link>
        </p>
      </GlassCard>
    </div>
  );
};

export default Register;
