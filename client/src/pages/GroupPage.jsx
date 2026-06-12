import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import GlassCard from '../components/Common/GlassCard';
import { ArrowLeft, UserPlus, DollarSign, Calendar, Plus, MessageSquare, Trash2, ArrowRight } from 'lucide-react';

const GroupPage = () => {
  const { id: groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [simplifiedDebts, setSimplifiedDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Forms State
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(user.id);
  const [splitType, setSplitType] = useState('equal');
  const [expenseError, setExpenseError] = useState('');

  // Splits configuration
  // Maps user ID to split value (amount, percentage, share, or checked for equal)
  const [splitInputs, setSplitInputs] = useState({});

  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settlePayer, setSettlePayer] = useState('');
  const [settlePayee, setSettlePayee] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [settleError, setSettleError] = useState('');

  const loadAllGroupData = async () => {
    try {
      setLoading(true);
      // 1. Group info
      const groupRes = await api.get(`/groups/${groupId}`);
      setGroup(groupRes.data);
      setPaidBy(user.id);

      // Initialize split inputs with default values
      const initialSplits = {};
      groupRes.data.members.forEach(m => {
        initialSplits[m.id] = {
          checked: true, // for equal splits
          amount: '',    // for unequal splits
          percentage: '', // for percentage splits
          share: '1'      // for shares splits
        };
      });
      setSplitInputs(initialSplits);

      // 2. Expenses list
      const expensesRes = await api.get(`/expenses/group/${groupId}`);
      setExpenses(expensesRes.data);

      // 3. Balances & simplified debts
      const balancesRes = await api.get(`/groups/${groupId}/balances`);
      setBalances(balancesRes.data.balances);
      setSimplifiedDebts(balancesRes.data.simplifiedDebts);

    } catch (err) {
      console.error('Error loading group data:', err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllGroupData();
  }, [groupId]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');

    try {
      const res = await api.post(`/groups/${groupId}/members`, { email: inviteEmail });
      setInviteSuccess(res.data.message);
      setInviteEmail('');
      loadAllGroupData();
    } catch (err) {
      setInviteError(err.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (targetUserId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.delete(`/groups/${groupId}/members/${targetUserId}`);
      loadAllGroupData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleSplitInputChange = (userId, field, value) => {
    setSplitInputs(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value
      }
    }));
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setExpenseError('');

    const parsedAmount = parseFloat(amount);
    if (!description) return setExpenseError('Please enter an expense description');
    if (isNaN(parsedAmount) || parsedAmount <= 0) return setExpenseError('Please enter a valid positive amount');

    // Build splits payload based on splitType
    const splitsPayload = [];
    const members = group.members;

    if (splitType === 'equal') {
      const checkedMembers = members.filter(m => splitInputs[m.id]?.checked);
      if (checkedMembers.length === 0) {
        return setExpenseError('Please select at least one person to split with');
      }
      checkedMembers.forEach(m => {
        splitsPayload.push({ userId: m.id });
      });
    } else if (splitType === 'unequal') {
      let sum = 0;
      for (const m of members) {
        const val = parseFloat(splitInputs[m.id]?.amount || 0);
        sum += val;
        splitsPayload.push({ userId: m.id, amount: val });
      }
      if (Math.abs(sum - parsedAmount) > 0.01) {
        return setExpenseError(`Sum of split amounts ($${sum.toFixed(2)}) must equal the total expense amount ($${parsedAmount.toFixed(2)})`);
      }
    } else if (splitType === 'percentage') {
      let sum = 0;
      for (const m of members) {
        const val = parseFloat(splitInputs[m.id]?.percentage || 0);
        sum += val;
        splitsPayload.push({ userId: m.id, percentage: val });
      }
      if (Math.abs(sum - 100) > 0.01) {
        return setExpenseError(`Sum of percentages (${sum}%) must equal 100%`);
      }
    } else if (splitType === 'shares') {
      let sum = 0;
      for (const m of members) {
        const val = parseInt(splitInputs[m.id]?.share || 0, 10);
        sum += val;
        splitsPayload.push({ userId: m.id, share: val });
      }
      if (sum <= 0) {
        return setExpenseError('Sum of shares must be greater than 0');
      }
    }

    try {
      await api.post(`/expenses/group/${groupId}`, {
        description,
        amount: parsedAmount,
        paidBy: parseInt(paidBy),
        splitType,
        splits: splitsPayload
      });

      // Reset Form and close modal
      setDescription('');
      setAmount('');
      setSplitType('equal');
      setShowExpenseModal(false);
      loadAllGroupData();
    } catch (err) {
      setExpenseError(err.response?.data?.error || 'Failed to add expense');
    }
  };

  const handleDeleteExpense = async (e, expenseId) => {
    e.stopPropagation(); // Prevent navigation to details page
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      await api.delete(`/expenses/${expenseId}`);
      loadAllGroupData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete expense');
    }
  };

  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    setSettleError('');

    const amt = parseFloat(settleAmount);
    if (!settlePayer || !settlePayee) return setSettleError('Payer and Payee are required');
    if (settlePayer === settlePayee) return setSettleError('Payer and Payee must be different users');
    if (isNaN(amt) || amt <= 0) return setSettleError('Amount must be greater than 0');

    try {
      await api.post(`/groups/${groupId}/settlements`, {
        payerId: parseInt(settlePayer),
        payeeId: parseInt(settlePayee),
        amount: amt
      });
      setSettleAmount('');
      setShowSettleModal(false);
      loadAllGroupData();
    } catch (err) {
      setSettleError(err.response?.data?.error || 'Failed to record settlement');
    }
  };

  const triggerSettleShortcut = (debt) => {
    setSettlePayer(debt.fromUser.id);
    setSettlePayee(debt.toUser.id);
    setSettleAmount(debt.amount);
    setShowSettleModal(true);
  };

  if (loading || !group) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>Loading group info...</p>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Back & Group Header */}
      <div>
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '16px', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: '1.4' }}>
              <span style={{ backgroundColor: 'var(--primary)', padding: '2px 10px', border: '2px solid #000', borderRadius: 'var(--radius-sm)', display: 'inline-block', transform: 'rotate(-1.5deg)' }}>{group.name}</span>
            </h1>
            <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '4px' }}>{group.description || 'No description'}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-secondary" onClick={() => setShowMemberModal(true)}>
              <UserPlus size={16} /> Add Member
            </button>
            <button className="btn-primary" onClick={() => setShowExpenseModal(true)}>
              <Plus size={16} /> Add Expense
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '24px' }}>
        
        {/* Left Column: Expenses List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontSize: '1.4rem' }}>Expenses</h3>

          {expenses.length === 0 ? (
            <GlassCard style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ color: 'hsl(var(--text-secondary))', marginBottom: '16px' }}>No expenses recorded in this group yet.</p>
              <button className="btn-primary" onClick={() => setShowExpenseModal(true)}>
                Add First Expense
              </button>
            </GlassCard>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {expenses.map(exp => (
                <div 
                  key={exp.id}
                  onClick={() => navigate(`/expense/${exp.id}`)}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px',
                    cursor: 'pointer',
                    animation: 'fadeInUp 0.3s ease forwards'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Calendar size={20} style={{ color: 'hsl(var(--primary))' }} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', color: 'hsl(var(--text-primary))', marginBottom: '4px' }}>
                        {exp.description}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                        Paid by <strong>{exp.paid_by_name}</strong> on {new Date(exp.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'hsl(var(--text-primary))', display: 'block' }}>
                        ${parseFloat(exp.amount).toFixed(2)}
                      </span>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'hsl(var(--text-muted))', letterSpacing: '0.05em' }}>
                        Split {exp.split_type}
                      </span>
                    </div>

                    <button 
                      className="btn-secondary" 
                      style={{ padding: '8px', borderRadius: '50%' }}
                      onClick={(e) => handleDeleteExpense(e, exp.id)}
                    >
                      <Trash2 size={16} style={{ color: 'hsl(var(--danger-hover))' }} />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Balances, simplified debts, member management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Member balances summary */}
          <GlassCard>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Group Balances</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {balances.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border-muted))', paddingBottom: '12px' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', display: 'block' }}>
                      {b.name} {b.id === user.id && '(You)'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>{b.email}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {b.netBalance > 0.01 ? (
                      <span style={{ color: 'hsl(var(--success))', fontWeight: 600, fontSize: '0.95rem' }}>
                        Owed +${b.netBalance.toFixed(2)}
                      </span>
                    ) : b.netBalance < -0.01 ? (
                      <span style={{ color: 'hsl(var(--danger))', fontWeight: 600, fontSize: '0.95rem' }}>
                        Owes ${Math.abs(b.netBalance).toFixed(2)}
                      </span>
                    ) : (
                      <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>
                        Settled
                      </span>
                    )}

                    {/* Member deletion check */}
                    {group.created_by !== b.id && b.id !== user.id && (
                      <button 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-block', marginLeft: '8px', padding: '2px' }}
                        onClick={() => handleRemoveMember(b.id)}
                      >
                        <Trash2 size={12} style={{ color: 'hsl(var(--text-muted))' }} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Simplified debts / Payment routes */}
          <GlassCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Simplified Debts</h3>
              <button 
                className="btn-secondary" 
                style={{ fontSize: '0.75rem', padding: '6px 12px' }} 
                onClick={() => {
                  setSettlePayer('');
                  setSettlePayee('');
                  setSettleAmount('');
                  setShowSettleModal(true);
                }}
              >
                Record Cash Payment
              </button>
            </div>
            
            {simplifiedDebts.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', textAlign: 'center', padding: '16px 0' }}>
                Everyone is fully settled up! 🎉
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {simplifiedDebts.map((debt, index) => (
                  <div 
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px dashed hsl(var(--border-muted))'
                    }}
                  >
                    <div style={{ fontSize: '0.9rem' }}>
                      <strong>{debt.fromUser.name}</strong> owes <strong>{debt.toUser.name}</strong>
                      <span style={{ display: 'inline-block', backgroundColor: 'var(--primary)', color: '#000000', border: '1.5px solid #000', padding: '1px 6px', borderRadius: '4px', fontWeight: 800, fontSize: '0.95rem', marginTop: '4px' }}>
                        ${debt.amount.toFixed(2)}
                      </span>
                    </div>

                    <button 
                      className="btn-primary" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => triggerSettleShortcut(debt)}
                    >
                      Settle Up
                    </button>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

        </div>
      </div>

      {/* Invite Member Modal */}
      {showMemberModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
        }}>
          <GlassCard style={{ maxWidth: '400px', width: '100%', border: '2px solid #000', boxShadow: '8px 8px 0px #000' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>Invite Member</h3>
            
            {inviteError && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid hsl(var(--danger))', color: 'hsl(var(--danger-hover))', padding: '10px', borderRadius: 'var(--radius-sm)', marginBottom: '12px', fontSize: '0.85rem' }}>
                {inviteError}
              </div>
            )}
            {inviteSuccess && (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid hsl(var(--success))', color: 'hsl(var(--success-hover))', padding: '10px', borderRadius: 'var(--radius-sm)', marginBottom: '12px', fontSize: '0.85rem' }}>
                {inviteSuccess}
              </div>
            )}

            <form onSubmit={handleAddMember}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="friend@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowMemberModal(false); setInviteError(''); setInviteSuccess(''); }}>
                  Close
                </button>
                <button type="submit" className="btn-primary">
                  Invite Member
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
        }}>
          <GlassCard style={{ maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '2px solid #000', boxShadow: '8px 8px 0px #000' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>Add New Expense</h3>

            {expenseError && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid hsl(var(--danger))', color: 'hsl(var(--danger-hover))', padding: '10px', borderRadius: 'var(--radius-sm)', marginBottom: '12px', fontSize: '0.85rem' }}>
                {expenseError}
              </div>
            )}

            <form onSubmit={handleAddExpense}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Electricity Bill, Dinner"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Paid By</label>
                  <select 
                    className="form-control" 
                    value={paidBy} 
                    onChange={(e) => setPaidBy(e.target.value)}
                  >
                    {group.members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Split Method</label>
                  <select 
                    className="form-control" 
                    value={splitType} 
                    onChange={(e) => setSplitType(e.target.value)}
                  >
                    <option value="equal">Equally</option>
                    <option value="unequal">Unequally (exact values)</option>
                    <option value="percentage">By Percentage</option>
                    <option value="shares">By Shares</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Splits Configuration Area */}
              <div style={{
                marginTop: '20px',
                borderTop: '1px solid hsl(var(--border-muted))',
                paddingTop: '16px',
                marginBottom: '24px'
              }}>
                <h4 style={{ fontSize: '0.95rem', textTransform: 'uppercase', color: 'hsl(var(--text-secondary))', marginBottom: '12px' }}>
                  Split Breakdown
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {group.members.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                      <span style={{ fontSize: '0.9rem' }}>{m.name}</span>

                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {splitType === 'equal' && (
                          <input
                            type="checkbox"
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            checked={splitInputs[m.id]?.checked || false}
                            onChange={(e) => handleSplitInputChange(m.id, 'checked', e.target.checked)}
                          />
                        )}

                        {splitType === 'unequal' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>$</span>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control"
                              style={{ width: '100px', padding: '6px 10px' }}
                              placeholder="0.00"
                              value={splitInputs[m.id]?.amount || ''}
                              onChange={(e) => handleSplitInputChange(m.id, 'amount', e.target.value)}
                            />
                          </div>
                        )}

                        {splitType === 'percentage' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="number"
                              step="0.1"
                              className="form-control"
                              style={{ width: '90px', padding: '6px 10px' }}
                              placeholder="0"
                              value={splitInputs[m.id]?.percentage || ''}
                              onChange={(e) => handleSplitInputChange(m.id, 'percentage', e.target.value)}
                            />
                            <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>%</span>
                          </div>
                        )}

                        {splitType === 'shares' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="number"
                              step="1"
                              className="form-control"
                              style={{ width: '90px', padding: '6px 10px' }}
                              placeholder="1"
                              value={splitInputs[m.id]?.share || '1'}
                              onChange={(e) => handleSplitInputChange(m.id, 'share', e.target.value)}
                            />
                            <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>shares</span>
                          </div>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowExpenseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Expense
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Settle Up Cash Modal */}
      {showSettleModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
        }}>
          <GlassCard style={{ maxWidth: '440px', width: '100%', border: '2px solid #000', boxShadow: '8px 8px 0px #000' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>Record cash payment</h3>

            {settleError && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid hsl(var(--danger))', color: 'hsl(var(--danger-hover))', padding: '10px', borderRadius: 'var(--radius-sm)', marginBottom: '12px', fontSize: '0.85rem' }}>
                {settleError}
              </div>
            )}

            <form onSubmit={handleSettleSubmit}>
              <div className="form-group">
                <label className="form-label">Who paid?</label>
                <select 
                  className="form-control"
                  value={settlePayer}
                  onChange={(e) => setSettlePayer(e.target.value)}
                  required
                >
                  <option value="">Select Payer</option>
                  {group.members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Who received?</label>
                <select 
                  className="form-control"
                  value={settlePayee}
                  onChange={(e) => setSettlePayee(e.target.value)}
                  required
                >
                  <option value="">Select Payee</option>
                  {group.members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  placeholder="0.00"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowSettleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Record Payment
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

    </div>
  );
};

export default GroupPage;
