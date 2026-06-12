import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/Common/GlassCard';
import { ArrowRight, DollarSign, MessageSquare, Zap, Check } from 'lucide-react';

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navbar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 48px',
        borderBottom: '2px solid #000000',
        backgroundColor: 'transparent',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            fontSize: '1.5rem', 
            fontWeight: 900, 
            backgroundColor: 'var(--primary)', 
            padding: '2px 10px', 
            border: '2px solid #000000', 
            borderRadius: 'var(--radius-sm)',
            transform: 'rotate(-1.5deg)'
          }}>
            SplitSphere
          </span>
        </div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="#features" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>Features</a>
          <a href="#how-it-works" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>How it Works</a>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {user ? (
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard <ArrowRight size={16} />
            </button>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => navigate('/login')}>
                Sign In
              </button>
              <button className="btn-primary" onClick={() => navigate('/register')}>
                Start Free
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '64px', padding: '60px 48px' }}>
        
        <section style={{ 
          display: 'grid', 
          gridTemplateColumns: '1.2fr 1fr', 
          gap: '48px', 
          alignItems: 'center' 
        }}>
          
          {/* Left Column: Heading and info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: '2.5px solid #000',
              padding: '4px 12px',
              borderRadius: '20px',
              width: 'fit-content',
              backgroundColor: '#ffffff',
              boxShadow: '2px 2px 0px #000'
            }}>
              💸 AI-Collaborated Bills Manager
            </span>

            <h1 style={{ fontSize: '3.6rem', fontWeight: 900, lineHeight: '1.1', color: '#000000' }}>
              Split Bills, <br />
              <span style={{ 
                backgroundColor: 'var(--primary)', 
                padding: '2px 12px', 
                border: '3px solid #000000', 
                borderRadius: 'var(--radius-sm)',
                display: 'inline-block',
                transform: 'rotate(-2deg)',
                marginTop: '8px'
              }}>
                without friction
              </span>
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6', maxWidth: '500px' }}>
              Create groups, share expenses, chat in real-time, and let our simplified path algorithm minimize your peer-to-peer transaction overhead.
            </p>

            <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
              <button className="btn-primary" style={{ padding: '14px 28px', fontSize: '1.05rem' }} onClick={() => navigate('/register')}>
                Get Started &rarr;
              </button>
              <a href="#how-it-works" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '1.05rem', textDecoration: 'none' }}>
                See How
              </a>
            </div>
          </div>

          {/* Right Column: Visual Mockup Cards */}
          <div style={{ position: 'relative', height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Main Mock Card */}
            <GlassCard style={{ 
              width: '340px', 
              border: '2.5px solid #000000', 
              boxShadow: '8px 8px 0px #000000',
              zIndex: 2,
              position: 'relative'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Group: Room 402
              </span>
              <h3 style={{ fontSize: '1.5rem', margin: '8px 0 16px 0', color: '#000000' }}>
                Dinner Bill
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '2px solid #000', paddingTop: '16px' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Total cost is <strong>$90.00</strong>
                </p>
                <div style={{ 
                  backgroundColor: 'var(--primary)', 
                  border: '2px solid #000', 
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  fontWeight: 700,
                  fontSize: '0.95rem'
                }}>
                  Gaurav owes Rohit $30.00
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  * Equal split between 3 members
                </div>
              </div>
            </GlassCard>

            {/* Streak Badge Overlay */}
            <div style={{
              position: 'absolute',
              top: 'calc(50% + 20px)',
              left: 'calc(50% + 90px)',
              backgroundColor: 'var(--primary)',
              border: '2.5px solid #000',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 18px',
              boxShadow: '4px 4px 0px #000',
              zIndex: 3,
              transform: 'rotate(5deg)'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block' }}>Streak</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 900 }}>7 🔥</span>
            </div>

            {/* Background Sheet Offset */}
            <div style={{
              position: 'absolute',
              width: '340px',
              height: '240px',
              border: '2.5px solid #000',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              transform: 'rotate(-4deg)',
              zIndex: 1,
              top: 'calc(50% - 100px)',
              left: 'calc(50% - 185px)',
              boxShadow: '4px 4px 0px rgba(0,0,0,0.1)'
            }}></div>
          </div>

        </section>

        {/* Features Grid */}
        <section id="features" style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '40px' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900 }}>Standard Features</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>SplitSphere delivers everything you need to share expenses.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            
            <GlassCard>
              <Zap size={24} style={{ color: 'var(--primary-hover)', marginBottom: '16px' }} />
              <h4 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>4 Splitting Strategies</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Split equally, unequally by absolute amounts, by percentages (totaling 100%), or by custom share ratios.
              </p>
            </GlassCard>

            <GlassCard>
              <MessageSquare size={24} style={{ color: 'var(--primary-hover)', marginBottom: '16px' }} />
              <h4 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Real-Time Conversation</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Discuss bills, ask questions, and leave notes directly inside specific expenses with instant Socket.io updates.
              </p>
            </GlassCard>

            <GlassCard>
              <DollarSign size={24} style={{ color: 'var(--primary-hover)', marginBottom: '16px' }} />
              <h4 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Simplified Settlements</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Our flow simplification algorithm matches debtors and creditors, reducing multiple transactions down to the absolute minimum.
              </p>
            </GlassCard>

          </div>
        </section>

        {/* How it Works / Stats */}
        <section id="how-it-works" style={{ 
          borderTop: '2px solid #000', 
          paddingTop: '60px',
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '24px',
          textAlign: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--success)' }}>4</h2>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '4px' }}>Split Methods</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>Split equally, unequally, by % or by shares</p>
          </div>
          <div>
            <h2 style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--primary-hover)' }}>1-Click</h2>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '4px' }}>Instant Settlements</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>Record cash payments directly in groups</p>
          </div>
          <div>
            <h2 style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--danger)' }}>Live</h2>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '4px' }}>Bill Discussions</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>Real-time chat feed on every expense</p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer style={{
        padding: '32px 48px',
        borderTop: '2px solid #000000',
        backgroundColor: 'transparent',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-muted)'
      }}>
        &copy; 2026 SplitSphere.LA
      </footer>

    </div>
  );
};

export default Landing;
