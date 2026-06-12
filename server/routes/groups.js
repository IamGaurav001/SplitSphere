const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// GET /api/groups - Get all groups the current user belongs to
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const groupsQuery = `
      SELECT g.*, 
        (SELECT COUNT(*)::int FROM group_members WHERE group_id = g.id) as member_count
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = $1
      ORDER BY g.created_at DESC
    `;
    const result = await db.query(groupsQuery, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch groups error:', err);
    res.status(500).json({ error: 'Internal server error fetching groups' });
  }
});

// POST /api/groups - Create a new group
router.post('/', authMiddleware, async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Create group
    const insertGroupQuery = `
      INSERT INTO groups (name, description, created_by)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const groupResult = await client.query(insertGroupQuery, [name.trim(), description || '', userId]);
    const group = groupResult.rows[0];

    // Add creator as member
    const insertMemberQuery = `
      INSERT INTO group_members (group_id, user_id)
      VALUES ($1, $2)
    `;
    await client.query(insertMemberQuery, [group.id, userId]);

    await client.query('COMMIT');
    res.status(201).json(group);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create group error:', err);
    res.status(500).json({ error: 'Internal server error creating group' });
  } finally {
    client.release();
  }
});

// GET /api/groups/:id - Get details of a single group
router.get('/:id', authMiddleware, async (req, res) => {
  const groupId = req.params.id;
  const userId = req.user.id;

  try {
    // Check if the user is a member of the group
    const membershipCheck = await db.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (membershipCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You do not have access to this group' });
    }

    // Get group info
    const groupResult = await db.query('SELECT * FROM groups WHERE id = $1', [groupId]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    const group = groupResult.rows[0];

    // Get members list
    const membersQuery = `
      SELECT u.id, u.name, u.email 
      FROM users u
      JOIN group_members gm ON u.id = gm.user_id
      WHERE gm.group_id = $1
      ORDER BY u.name ASC
    `;
    const membersResult = await db.query(membersQuery, [groupId]);
    group.members = membersResult.rows;

    res.json(group);
  } catch (err) {
    console.error('Fetch group details error:', err);
    res.status(500).json({ error: 'Internal server error fetching group details' });
  }
});

// POST /api/groups/:id/members - Invite/add a member to a group by email
router.post('/:id/members', authMiddleware, async (req, res) => {
  const groupId = req.params.id;
  const { email } = req.body;
  const requesterId = req.user.id;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  try {
    // Verify requester is a member of the group
    const membershipCheck = await db.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, requesterId]
    );
    if (membershipCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not authorized to add members to this group' });
    }

    // Lookup user by email
    const userResult = await db.query('SELECT id, name, email FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No user registered with this email address' });
    }
    const targetUser = userResult.rows[0];

    // Check if user is already a member
    const existingMemberCheck = await db.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, targetUser.id]
    );
    if (existingMemberCheck.rows.length > 0) {
      return res.status(400).json({ error: 'User is already a member of this group' });
    }

    // Add to group
    await db.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [groupId, targetUser.id]
    );

    res.status(201).json({
      message: 'Member added successfully',
      user: targetUser
    });
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ error: 'Internal server error adding group member' });
  }
});

// DELETE /api/groups/:id/members/:userId - Remove a member from a group
router.delete('/:id/members/:targetUserId', authMiddleware, async (req, res) => {
  const groupId = req.params.id;
  const targetUserId = req.params.targetUserId;
  const requesterId = req.user.id;

  try {
    // Check requester is in the group
    const membershipCheck = await db.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, requesterId]
    );
    if (membershipCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not authorized to modify this group' });
    }

    // Check if target member exists in the group
    const targetCheck = await db.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, targetUserId]
    );
    if (targetCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User is not a member of this group' });
    }

    // Optional safety check: Don't allow leaving/deleting if group creator (or let them, up to them)
    const groupResult = await db.query('SELECT created_by FROM groups WHERE id = $1', [groupId]);
    if (groupResult.rows[0].created_by == targetUserId) {
      return res.status(400).json({ error: 'Cannot remove the group creator' });
    }

    // Remove member
    await db.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, targetUserId]);

    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: 'Internal server error removing group member' });
  }
});

// GET /api/groups/:id/balances - Calculate balances and simplified debts
router.get('/:id/balances', authMiddleware, async (req, res) => {
  const groupId = req.params.id;
  const userId = req.user.id;

  try {
    // Verify membership
    const membershipCheck = await db.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );
    if (membershipCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 1. Fetch group members
    const membersResult = await db.query(
      `SELECT u.id, u.name, u.email 
       FROM users u 
       JOIN group_members gm ON u.id = gm.user_id 
       WHERE gm.group_id = $1`,
      [groupId]
    );
    const members = membersResult.rows;

    // Initialize balance structure
    const balanceMap = {};
    members.forEach(member => {
      balanceMap[member.id] = {
        id: member.id,
        name: member.name,
        email: member.email,
        netBalance: 0.00
      };
    });

    // 2. Fetch all expenses in group
    const expensesResult = await db.query(
      'SELECT id, amount, paid_by FROM expenses WHERE group_id = $1',
      [groupId]
    );
    const expenses = expensesResult.rows;

    // 3. Fetch all splits in group
    const splitsResult = await db.query(
      `SELECT es.user_id, es.amount 
       FROM expense_splits es 
       JOIN expenses e ON es.expense_id = e.id 
       WHERE e.group_id = $1`,
      [groupId]
    );
    const splits = splitsResult.rows;

    // 4. Fetch all settlements in group
    const settlementsResult = await db.query(
      'SELECT payer_id, payee_id, amount FROM settlements WHERE group_id = $1',
      [groupId]
    );
    const settlements = settlementsResult.rows;

    // Sum paid amounts (positive for the payer)
    expenses.forEach(exp => {
      const payerId = exp.paid_by;
      if (balanceMap[payerId]) {
        balanceMap[payerId].netBalance += parseFloat(exp.amount);
      }
    });

    // Subtract splits owed (negative for the participants)
    splits.forEach(split => {
      const debtorId = split.user_id;
      if (balanceMap[debtorId]) {
        balanceMap[debtorId].netBalance -= parseFloat(split.amount);
      }
    });

    // Adjust for settlements already recorded
    // Settlements: payer paid payee. So payer gets a positive credit (repayment made),
    // and payee gets a negative debit (repayment received).
    settlements.forEach(sett => {
      const payerId = sett.payer_id;
      const payeeId = sett.payee_id;
      const amt = parseFloat(sett.amount);

      if (balanceMap[payerId]) {
        balanceMap[payerId].netBalance += amt;
      }
      if (balanceMap[payeeId]) {
        balanceMap[payeeId].netBalance -= amt;
      }
    });

    // Prepare lists of debtors and creditors for simplification algorithm
    const debtors = [];
    const creditors = [];
    const individualBalances = [];

    Object.values(balanceMap).forEach(userBal => {
      // Round to 2 decimal places to avoid floating point quirks
      userBal.netBalance = Math.round(userBal.netBalance * 100) / 100;
      individualBalances.push(userBal);

      if (userBal.netBalance < -0.01) {
        debtors.push({ id: userBal.id, name: userBal.name, balance: userBal.netBalance });
      } else if (userBal.netBalance > 0.01) {
        creditors.push({ id: userBal.id, name: userBal.name, balance: userBal.netBalance });
      }
    });

    // DEBT SIMPLIFICATION ALGORITHM
    // Sort debtors ascending (most negative first, e.g. -10, -5, -2)
    // Sort creditors descending (most positive first, e.g. 10, 5, 2)
    debtors.sort((a, b) => a.balance - b.balance);
    creditors.sort((a, b) => b.balance - a.balance);

    const simplifiedDebts = [];

    let i = 0; // debtor pointer
    let j = 0; // creditor pointer

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const debtAmount = Math.min(Math.abs(debtor.balance), creditor.balance);
      const roundedAmount = Math.round(debtAmount * 100) / 100;

      if (roundedAmount > 0.01) {
        simplifiedDebts.push({
          fromUser: { id: debtor.id, name: debtor.name },
          toUser: { id: creditor.id, name: creditor.name },
          amount: roundedAmount
        });
      }

      debtor.balance += roundedAmount;
      creditor.balance -= roundedAmount;

      if (Math.abs(debtor.balance) < 0.01) i++;
      if (creditor.balance < 0.01) j++;
    }

    res.json({
      balances: individualBalances,
      simplifiedDebts
    });

  } catch (err) {
    console.error('Calculate balances error:', err);
    res.status(500).json({ error: 'Internal server error calculating balances' });
  }
});

// POST /api/groups/:id/settlements - Record a payment/settlement
router.post('/:id/settlements', authMiddleware, async (req, res) => {
  const groupId = req.params.id;
  const { payerId, payeeId, amount } = req.body;
  const requesterId = req.user.id;

  if (!payerId || !payeeId || !amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Payer ID, payee ID, and positive amount are required' });
  }

  try {
    // Check membership
    const membershipCheck = await db.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id IN ($2, $3, $4)',
      [groupId, requesterId, payerId, payeeId]
    );

    // Requires at least the requester to be in group, and both settlement parties to be in group.
    // Length of membership check should be at least 1 (the requester), but let's verify all are members:
    const membersCheck = await db.query(
      'SELECT user_id FROM group_members WHERE group_id = $1 AND user_id IN ($2, $3)',
      [groupId, payerId, payeeId]
    );
    if (membersCheck.rows.length < 2 && payerId !== payeeId) {
      return res.status(400).json({ error: 'Both payer and payee must be members of the group' });
    }

    // Insert settlement
    const insertSettlementQuery = `
      INSERT INTO settlements (group_id, payer_id, payee_id, amount)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await db.query(insertSettlementQuery, [
      groupId,
      payerId,
      payeeId,
      parseFloat(amount)
    ]);

    res.status(201).json({
      message: 'Settlement payment recorded successfully',
      settlement: result.rows[0]
    });
  } catch (err) {
    console.error('Record settlement error:', err);
    res.status(500).json({ error: 'Internal server error recording settlement' });
  }
});

module.exports = router;
