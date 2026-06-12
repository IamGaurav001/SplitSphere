import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/Common/GlassCard';
import { ArrowRight } from 'lucide-react';

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Viewport-lock responsive styles */}
      <style>{`
        .landing-container {
          height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          background-color: var(--bg-base);
          overflow: hidden;
        }

        .landing-main {
          flex: 1;
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          gap: 64px;
          align-items: center;
          padding: 0 80px;
          min-height: 0;
        }

        /* Responsive scaling for smaller screen sizes */
        @media (max-width: 1024px) {
          .landing-container {
            height: auto;
            min-height: 100vh;
            overflow: auto;
          }
          .landing-main {
            display: flex;
            flex-direction: column;
            padding: 48px 24px;
            gap: 64px;
            justify-content: center;
          }
          .mockup-container {
            min-height: 400px;
            margin-bottom: 24px;
          }
        }
      `}</style>

      {/* Navbar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 80px',
        borderBottom: '2px solid #000000',
        backgroundColor: 'transparent',
        zIndex: 100,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            fontSize: '1.7rem', 
            fontWeight: 900, 
            backgroundColor: 'var(--primary)', 
            padding: '4px 12px', 
            border: '2px solid #000000', 
            borderRadius: 'var(--radius-sm)',
            transform: 'rotate(-1.5deg)',
            display: 'inline-block'
          }}>
            SplitSphere
          </span>
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

      {/* Main Hero Viewport Area */}
      <main className="landing-main">
        
        {/* Left Column: Heading and description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <span style={{
            fontSize: '0.95rem',
            fontWeight: 900,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            border: '2.5px solid #000',
            padding: '6px 16px',
            borderRadius: '20px',
            width: 'fit-content',
            backgroundColor: '#ffffff',
            boxShadow: '3px 3px 0px #000'
          }}>
            💸 AI-Collaborated Bills Manager
          </span>

          <h1 style={{ 
            fontSize: 'clamp(3.5rem, 4.8vw, 5.2rem)', 
            fontWeight: 900, 
            lineHeight: '1.05', 
            color: '#000000',
            margin: 0
          }}>
            Split Bills, <br />
            <span style={{ 
              backgroundColor: 'var(--primary)', 
              padding: '6px 20px', 
              border: '3px solid #000000', 
              borderRadius: 'var(--radius-sm)',
              display: 'inline-block',
              transform: 'rotate(-1.5deg)',
              marginTop: '16px',
              boxShadow: '6px 6px 0px #000000'
            }}>
              without friction
            </span>
          </h1>

          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: 'clamp(1.15rem, 1.4vw, 1.35rem)', 
            lineHeight: '1.6', 
            maxWidth: '580px',
            margin: '8px 0 0 0',
            fontWeight: 500
          }}>
            Create groups, share expenses, chat in real-time, and let our simplified path algorithm minimize your peer-to-peer transaction overhead.
          </p>

          <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
            <button 
              className="btn-primary" 
              style={{ padding: '18px 36px', fontSize: '1.25rem', boxShadow: '6px 6px 0px #000' }} 
              onClick={() => navigate('/register')}
            >
              Get Started &rarr;
            </button>
            <button 
              className="btn-secondary" 
              style={{ padding: '18px 36px', fontSize: '1.25rem', boxShadow: '6px 6px 0px #000' }} 
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Right Column: Visual Mockup Cards (Further Enlarged to fill space) */}
        <div className="mockup-container" style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Main Mock Card */}
          <GlassCard style={{ 
            width: '420px', 
            border: '3px solid #000000', 
            boxShadow: '12px 12px 0px #000000',
            zIndex: 2,
            position: 'relative',
            padding: '36px'
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Group: Room 402
            </span>
            <h3 style={{ fontSize: '2.1rem', margin: '8px 0 24px 0', color: '#000000', fontWeight: 900 }}>
              Dinner Bill
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '3px solid #000', paddingTop: '24px' }}>
              <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)' }}>
                Total cost is <strong style={{ fontSize: '1.3rem' }}>$90.00</strong>
              </p>
              <div style={{ 
                backgroundColor: 'var(--primary)', 
                border: '3px solid #000', 
                borderRadius: 'var(--radius-sm)',
                padding: '12px 20px',
                fontWeight: 900,
                fontSize: '1.15rem',
                boxShadow: '4px 4px 0px #000'
              }}>
                Gaurav owes Rohit $30.00
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 600 }}>
                * Equal split between 3 members
              </div>
            </div>
          </GlassCard>

          {/* Streak Badge Overlay */}
          <div style={{
            position: 'absolute',
            top: 'calc(50% + 50px)',
            left: 'calc(50% + 120px)',
            backgroundColor: 'var(--primary)',
            border: '3px solid #000',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 24px',
            boxShadow: '8px 8px 0px #000',
            zIndex: 3,
            transform: 'rotate(6deg)'
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', letterSpacing: '0.05em' }}>Streak</span>
            <span style={{ fontSize: '2.4rem', fontWeight: 900 }}>7 🔥</span>
          </div>

          {/* Background Sheet Offset */}
          <div style={{
            position: 'absolute',
            width: '420px',
            height: '290px',
            border: '3px solid #000',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            transform: 'rotate(-4.5deg)',
            zIndex: 1,
            top: 'calc(50% - 120px)',
            left: 'calc(50% - 230px)',
            boxShadow: '4px 4px 0px rgba(0,0,0,0.1)'
          }}></div>
        </div>

      </main>
    </div>
  );
};

export default Landing;
