const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// GET /api/groups/:groupId/expenses - Get all expenses for a group
router.get('/group/:groupId', authMiddleware, async (req, res) => {
  const groupId = req.params.groupId;
  const userId = req.user.id;

  try {
    // Check membership
    const membershipCheck = await db.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );
    if (membershipCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const expensesQuery = `
      SELECT e.*, u.name as paid_by_name, u.email as paid_by_email
      FROM expenses e
      JOIN users u ON e.paid_by = u.id
      WHERE e.group_id = $1
      ORDER BY e.created_at DESC
    `;
    const result = await db.query(expensesQuery, [groupId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch expenses error:', err);
    res.status(500).json({ error: 'Internal server error fetching expenses' });
  }
});

// POST /api/groups/:groupId/expenses - Create a new expense
router.post('/group/:groupId', authMiddleware, async (req, res) => {
  const groupId = req.params.groupId;
  const { description, amount, paidBy, splitType, splits } = req.body;
  const userId = req.user.id;

  if (!description || !amount || parseFloat(amount) <= 0 || !paidBy || !splitType || !splits || !Array.isArray(splits) || splits.length === 0) {
    return res.status(400).json({ error: 'Invalid expense inputs' });
  }

  const totalAmount = parseFloat(amount);
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verify membership of creator and members in splits
    const membershipCheck = await client.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );
    if (membershipCheck.rows.length === 0) {
      throw new Error('Unauthorized');
    }

    // 2. Validate and calculate splits
    const calculatedSplits = [];
    let splitsSum = 0;

    if (splitType === 'equal') {
      const count = splits.length;
      const baseAmount = Math.floor((totalAmount / count) * 100) / 100;
      let remainderCents = Math.round((totalAmount - (baseAmount * count)) * 100);

      splits.forEach((split, index) => {
        let splitAmt = baseAmount;
        // Distribute remainder cents
        if (remainderCents > 0) {
          splitAmt += 0.01;
          remainderCents--;
        }
        calculatedSplits.push({
          userId: split.userId,
          amount: parseFloat(splitAmt.toFixed(2)),
          percentage: null,
          share: null
        });
      });
    } else if (splitType === 'unequal') {
      // Splits should contain user_id and amount
      splits.forEach(split => {
        const amt = parseFloat(split.amount || 0);
        splitsSum += amt;
        calculatedSplits.push({
          userId: split.userId,
          amount: amt,
          percentage: null,
          share: null
        });
      });

      // Verify that sums add up to total
      if (Math.abs(splitsSum - totalAmount) > 0.01) {
        throw new Error(`The sum of split amounts (${splitsSum}) must equal the total amount (${totalAmount})`);
      }
    } else if (splitType === 'percentage') {
      // Splits should contain user_id and percentage
      let pctSum = 0;
      splits.forEach(split => {
        const pct = parseFloat(split.percentage || 0);
        pctSum += pct;
        const amt = Math.round((totalAmount * (pct / 100)) * 100) / 100;
        calculatedSplits.push({
          userId: split.userId,
          amount: amt,
          percentage: pct,
          share: null
        });
      });

      if (Math.abs(pctSum - 100) > 0.01) {
        throw new Error(`The sum of percentages (${pctSum}%) must equal 100%`);
      }

      // Handle remainder rounding difference
      const calculatedSum = calculatedSplits.reduce((sum, s) => sum + s.amount, 0);
      const diff = Math.round((totalAmount - calculatedSum) * 100) / 100;
      if (Math.abs(diff) > 0.001) {
        calculatedSplits[0].amount = parseFloat((calculatedSplits[0].amount + diff).toFixed(2));
      }
    } else if (splitType === 'shares') {
      // Splits should contain user_id and share
      let totalShares = 0;
      splits.forEach(split => {
        const sh = parseInt(split.share || 0, 10);
        totalShares += sh;
      });

      if (totalShares <= 0) {
        throw new Error('Total shares must be greater than 0');
      }

      splits.forEach(split => {
        const sh = parseInt(split.share || 0, 10);
        const amt = Math.floor((totalAmount * (sh / totalShares)) * 100) / 100;
        calculatedSplits.push({
          userId: split.userId,
          amount: amt,
          percentage: null,
          share: sh
        });
      });

      // Handle remainder rounding difference
      const calculatedSum = calculatedSplits.reduce((sum, s) => sum + s.amount, 0);
      let remainderCents = Math.round((totalAmount - calculatedSum) * 100);

      let idx = 0;
      while (remainderCents > 0) {
        calculatedSplits[idx % calculatedSplits.length].amount += 0.01;
        remainderCents--;
        idx++;
      }

      calculatedSplits.forEach(s => {
        s.amount = parseFloat(s.amount.toFixed(2));
      });
    } else {
      throw new Error('Invalid split type');
    }

    // 3. Insert into expenses table
    const insertExpenseQuery = `
      INSERT INTO expenses (group_id, description, amount, paid_by, split_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const expenseResult = await client.query(insertExpenseQuery, [
      groupId,
      description.trim(),
      totalAmount,
      paidBy,
      splitType
    ]);
    const expense = expenseResult.rows[0];

    // 4. Insert splits into expense_splits table
    const insertSplitQuery = `
      INSERT INTO expense_splits (expense_id, user_id, amount, percentage, share)
      VALUES ($1, $2, $3, $4, $5)
    `;
    for (const split of calculatedSplits) {
      await client.query(insertSplitQuery, [
        expense.id,
        split.userId,
        split.amount,
        split.percentage,
        split.share
      ]);
    }

    await client.query('COMMIT');
    res.status(201).json(expense);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create expense error:', err.message);
    res.status(400).json({ error: err.message || 'Internal server error creating expense' });
  } finally {
    client.release();
  }
});

// GET /api/expenses/:id - Get detailed expense split and info
router.get('/:id', authMiddleware, async (req, res) => {
  const expenseId = req.params.id;
  const userId = req.user.id;

  try {
    // Fetch expense
    const expenseResult = await db.query(
      `SELECT e.*, u.name as paid_by_name, u.email as paid_by_email 
       FROM expenses e 
       JOIN users u ON e.paid_by = u.id 
       WHERE e.id = $1`,
      [expenseId]
    );

    if (expenseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    const expense = expenseResult.rows[0];

    // Verify user is in the group of the expense
    const membershipCheck = await db.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [expense.group_id, userId]
    );
    if (membershipCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch splits
    const splitsQuery = `
      SELECT es.*, u.name as user_name, u.email as user_email
      FROM expense_splits es
      JOIN users u ON es.user_id = u.id
      WHERE es.expense_id = $1
    `;
    const splitsResult = await db.query(splitsQuery, [expenseId]);
    expense.splits = splitsResult.rows;

    // Fetch chat messages
    const chatQuery = `
      SELECT cm.*, u.name as user_name
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.expense_id = $1
      ORDER BY cm.created_at ASC
    `;
    const chatResult = await db.query(chatQuery, [expenseId]);
    expense.chatMessages = chatResult.rows;

    res.json(expense);
  } catch (err) {
    console.error('Fetch expense details error:', err);
    res.status(500).json({ error: 'Internal server error fetching expense details' });
  }
});

// DELETE /api/expenses/:id - Delete an expense
router.delete('/:id', authMiddleware, async (req, res) => {
  const expenseId = req.params.id;
  const userId = req.user.id;

  try {
    // Get expense to check group_id
    const expenseResult = await db.query('SELECT group_id FROM expenses WHERE id = $1', [expenseId]);
    if (expenseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    const expense = expenseResult.rows[0];

    // Verify membership
    const membershipCheck = await db.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [expense.group_id, userId]
    );
    if (membershipCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete (cascading will remove splits and chats)
    await db.query('DELETE FROM expenses WHERE id = $1', [expenseId]);

    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    console.error('Delete expense error:', err);
    res.status(500).json({ error: 'Internal server error deleting expense' });
  }
});

module.exports = router;
