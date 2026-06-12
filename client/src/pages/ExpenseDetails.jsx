import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { socket } from '../services/socket';
import GlassCard from '../components/Common/GlassCard';
import { ArrowLeft, MessageSquare, Send, DollarSign, User } from 'lucide-react';

const ExpenseDetails = () => {
  const { id: expenseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [expense, setExpense] = useState(null);
  const [splits, setSplits] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const chatEndRef = useRef(null);

  const loadExpenseDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/expenses/${expenseId}`);
      setExpense(res.data);
      setSplits(res.data.splits);
      setChatMessages(res.data.chatMessages);
    } catch (err) {
      console.error('Failed to load expense details:', err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenseDetails();

    // SOCKET.IO REAL-TIME INTEGRATION
    // Join room
    socket.emit('join_expense', expenseId);

    // Listen for new messages
    socket.on('receive_message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    // Cleanup on unmount
    return () => {
      socket.emit('leave_expense', expenseId);
      socket.off('receive_message');
    };
  }, [expenseId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socket.emit('send_message', {
      expenseId: parseInt(expenseId),
      userId: user.id,
      message: newMessage
    });

    setNewMessage('');
  };

  if (loading || !expense) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>Loading expense details...</p>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Back button */}
      <div>
        <Link to={`/group/${expense.group_id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '16px', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Group
        </Link>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: '1.4' }}>
          <span style={{ backgroundColor: 'var(--primary)', padding: '2px 10px', border: '2px solid #000', borderRadius: 'var(--radius-sm)', display: 'inline-block', transform: 'rotate(-1.5deg)' }}>{expense.description}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Total amount is <strong style={{ color: 'var(--text-primary)' }}>${parseFloat(expense.amount).toFixed(2)}</strong>. Paid by <strong>{expense.paid_by_name}</strong>.
        </p>
      </div>

      {/* Grid: Left - Split breakdown, Right - Chat */}
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: '24px' }}>
        
        {/* Left Column: Splits Breakdown */}
        <GlassCard style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Split Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {splits.map(s => (
              <div 
                key={s.id} 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '12px',
                  borderBottom: '1px solid hsl(var(--border-muted))'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    padding: '6px',
                    borderRadius: '50%',
                    display: 'inline-flex'
                  }}>
                    <User size={16} style={{ color: 'hsl(var(--text-secondary))' }} />
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', display: 'block' }}>
                      {s.user_name} {s.user_id === user.id && '(You)'}
                    </span>
                    {expense.split_type === 'percentage' && (
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                        {parseFloat(s.percentage)}% split share
                      </span>
                    )}
                    {expense.split_type === 'shares' && (
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                        {s.share} {s.share === 1 ? 'share' : 'shares'}
                      </span>
                    )}
                  </div>
                </div>

                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'hsl(var(--text-primary))' }}>
                  ${parseFloat(s.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Right Column: Chat Box */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column', height: '520px', padding: 0, overflow: 'hidden' }}>
          {/* Chat header */}
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid hsl(var(--border-muted))',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.01)'
          }}>
            <MessageSquare size={18} style={{ color: 'hsl(var(--primary))' }} />
            <h3 style={{ fontSize: '1.15rem' }}>Expense Chat</h3>
          </div>

          {/* Messages list */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {chatMessages.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                <p style={{ fontSize: '0.9rem' }}>No messages yet. Ask a question or post updates about this bill!</p>
              </div>
            ) : (
              chatMessages.map(msg => {
                const isMe = msg.user_id === user.id;
                return (
                  <div 
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid hsl(var(--border-muted))',
                      animation: 'fadeInUp 0.15s ease forwards'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {msg.user_name} {isMe && '(You)'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginLeft: '8px' }}>
                        {new Date(msg.created_at).toLocaleDateString()} at {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{
                      color: 'hsl(var(--text-primary))',
                      fontSize: '0.95rem',
                      lineHeight: '1.5',
                      wordBreak: 'break-word',
                      paddingLeft: '2px'
                    }}>
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Message form */}
          <form 
            onSubmit={handleSendMessage}
            style={{
              padding: '16px 24px',
              borderTop: '1px solid hsl(var(--border-muted))',
              display: 'flex',
              gap: '12px',
              backgroundColor: 'hsl(var(--bg-card))'
            }}
          >
            <input
              type="text"
              className="form-control"
              placeholder="Ask a question or leave a comment..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{ flex: 1, padding: '10px 16px' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '10px 14px' }}>
              <Send size={16} />
            </button>
          </form>

        </GlassCard>

      </div>

    </div>
  );
};

export default ExpenseDetails;
