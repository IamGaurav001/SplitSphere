import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import GlassCard from '../components/Common/GlassCard';
import { Plus, LogOut, Users, DollarSign, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [totalOwed, setTotalOwed] = useState(0);
  const [totalOwe, setTotalOwe] = useState(0);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/groups');
      const groupsList = res.data;
      setGroups(groupsList);

      // Fetch balances for each group to calculate overall summary
      let owedSum = 0;
      let oweSum = 0;

      const balancePromises = groupsList.map(g => api.get(`/groups/${g.id}/balances`));
      const balanceResults = await Promise.all(balancePromises);

      balanceResults.forEach(res => {
        const userBalObj = res.data.balances.find(b => b.id === user.id);
        if (userBalObj) {
          const bal = userBalObj.netBalance;
          if (bal > 0) {
            owedSum += bal;
          } else if (bal < 0) {
            oweSum += Math.abs(bal);
          }
        }
      });

      setTotalOwed(owedSum);
      setTotalOwe(oweSum);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName) return setError('Group name is required');
    setError('');

    try {
      const res = await api.post('/groups', {
        name: groupName,
        description: groupDesc
      });
      setGroupName('');
      setGroupDesc('');
      setShowCreateModal(false);
      // Refresh groups list
      fetchDashboardData();
      navigate(`/group/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
    }
  };

  const netTotal = totalOwed - totalOwe;

  return (
    <div className="main-content" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header section */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: '1.4' }}>
            Hello, <span style={{ backgroundColor: 'var(--primary)', padding: '2px 10px', border: '2px solid #000', borderRadius: 'var(--radius-sm)', display: 'inline-block' }}>{user.name}</span>
          </h1>
          <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '4px' }}>Welcome back to your financial control center.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={logout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      {/* Overview Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        
        {/* Net Balance */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Net Balance</span>
              <DollarSign size={20} style={{ color: netTotal >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }} />
            </div>
            <h2 style={{ fontSize: '2.5rem', color: netTotal >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
              {netTotal >= 0 ? `+` : `-`}${Math.abs(netTotal).toFixed(2)}
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', marginTop: '16px' }}>
            {netTotal >= 0 ? 'You are net positive across all groups!' : 'You owe more than you are owed overall.'}
          </p>
        </GlassCard>

        {/* You are owed */}
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>You Are Owed</span>
            <TrendingUp size={20} style={{ color: 'hsl(var(--success))' }} />
          </div>
          <h2 style={{ fontSize: '2.5rem', color: 'hsl(var(--success))' }}>
            ${totalOwed.toFixed(2)}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', marginTop: '16px' }}>
            Money your friends owe you.
          </p>
        </GlassCard>

        {/* You owe */}
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>You Owe</span>
            <TrendingDown size={20} style={{ color: 'hsl(var(--danger))' }} />
          </div>
          <h2 style={{ fontSize: '2.5rem', color: 'hsl(var(--danger))' }}>
            ${totalOwe.toFixed(2)}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', marginTop: '16px' }}>
            Money you need to pay back.
          </p>
        </GlassCard>

      </section>

      {/* Groups List header */}
      <section style={{ marginTop: '0px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.4rem' }}>Your Expense Groups</h3>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> New Group
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'hsl(var(--text-secondary))' }}>
            Loading your groups...
          </div>
        ) : groups.length === 0 ? (
          <GlassCard style={{ padding: '24px', textAlign: 'center' }}>
            <Users size={40} style={{ color: 'hsl(var(--text-muted))', marginBottom: '16px' }} />
            <h4 style={{ marginBottom: '8px' }}>No Groups Yet</h4>
            <p style={{ color: 'hsl(var(--text-secondary))', marginBottom: '24px' }}>
              Create a group to start adding roommate bills, trip costs, or lunch splits.
            </p>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              Create Your First Group
            </button>
          </GlassCard>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {groups.map(group => (
              <GlassCard 
                key={group.id} 
                onClick={() => navigate(`/group/${group.id}`)}
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}
              >
                <div>
                  <h4 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'hsl(var(--text-primary))' }}>
                    {group.name}
                  </h4>
                  <p style={{ 
                    color: 'hsl(var(--text-secondary))', 
                    fontSize: '0.9rem', 
                    display: '-webkit-box', 
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    marginBottom: '16px'
                  }}>
                    {group.description || 'No description provided.'}
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid hsl(var(--border-muted))', paddingTop: '16px', marginTop: '16px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} /> {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                  </span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'underline' }}>
                    View Group <ArrowRight size={14} />
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </section>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <GlassCard style={{ maxWidth: '480px', width: '100%', border: '2px solid #000', boxShadow: '8px 8px 0px #000' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Create New Group</h3>
            
            {error && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid hsl(var(--danger))',
                color: 'hsl(var(--danger-hover))',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '16px',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label className="form-label">Group Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Room 402, Road Trip 2026"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-control"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="What is this group for?"
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Group
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
