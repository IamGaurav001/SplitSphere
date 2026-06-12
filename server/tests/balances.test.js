// Simplified Debt Calculation Test
// Run: node tests/balances.test.js

function calculateBalancesAndSimplify({ members, expenses, splits, settlements }) {
  const balanceMap = {};
  
  // Initialize
  members.forEach(member => {
    balanceMap[member.id] = {
      id: member.id,
      name: member.name,
      netBalance: 0.00
    };
  });

  // Add paid expenses
  expenses.forEach(exp => {
    const payerId = exp.paid_by;
    if (balanceMap[payerId]) {
      balanceMap[payerId].netBalance += exp.amount;
    }
  });

  // Subtract splits owed
  splits.forEach(split => {
    const debtorId = split.user_id;
    if (balanceMap[debtorId]) {
      balanceMap[debtorId].netBalance -= split.amount;
    }
  });

  // Adjust for settlements
  settlements.forEach(sett => {
    const payerId = sett.payer_id;
    const payeeId = sett.payee_id;
    const amt = sett.amount;

    if (balanceMap[payerId]) {
      balanceMap[payerId].netBalance += amt;
    }
    if (balanceMap[payeeId]) {
      balanceMap[payeeId].netBalance -= amt;
    }
  });

  // Round balances and split into debtors / creditors
  const debtors = [];
  const creditors = [];
  const individualBalances = [];

  Object.values(balanceMap).forEach(userBal => {
    userBal.netBalance = Math.round(userBal.netBalance * 100) / 100;
    individualBalances.push({ ...userBal });

    if (userBal.netBalance < -0.01) {
      debtors.push({ id: userBal.id, name: userBal.name, balance: userBal.netBalance });
    } else if (userBal.netBalance > 0.01) {
      creditors.push({ id: userBal.id, name: userBal.name, balance: userBal.netBalance });
    }
  });

  // Simplify debts
  debtors.sort((a, b) => a.balance - b.balance);
  creditors.sort((a, b) => b.balance - a.balance);

  const simplifiedDebts = [];
  let i = 0;
  let j = 0;

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

  return {
    balances: individualBalances,
    simplifiedDebts
  };
}

// RUN TEST
function runTests() {
  console.log('--- Running SplitSphere Balance and Simplification Logic Tests ---');

  const members = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' }
  ];

  // Alice pays $90 split equally 3 ways ($30 each)
  const expenses = [
    { id: 101, paid_by: 1, amount: 90.00 }
  ];
  const splits = [
    { expense_id: 101, user_id: 1, amount: 30.00 },
    { expense_id: 101, user_id: 2, amount: 30.00 },
    { expense_id: 101, user_id: 3, amount: 30.00 }
  ];

  // Bob pays $30 split equally between Bob and Charlie ($15 each)
  expenses.push({ id: 102, paid_by: 2, amount: 30.00 });
  splits.push(
    { expense_id: 102, user_id: 2, amount: 15.00 },
    { expense_id: 102, user_id: 3, amount: 15.00 }
  );

  const settlements = [];

  const result = calculateBalancesAndSimplify({ members, expenses, splits, settlements });

  console.log('Calculated Balances:', result.balances);
  console.log('Simplified Debts:', result.simplifiedDebts);

  // Assertions
  const aliceBal = result.balances.find(b => b.id === 1).netBalance;
  const bobBal = result.balances.find(b => b.id === 2).netBalance;
  const charlieBal = result.balances.find(b => b.id === 3).netBalance;

  let testPassed = true;

  if (aliceBal !== 60.00) {
    console.error('FAIL: Alice balance should be +60.00, got:', aliceBal);
    testPassed = false;
  }
  if (bobBal !== -15.00) {
    console.error('FAIL: Bob balance should be -15.00, got:', bobBal);
    testPassed = false;
  }
  if (charlieBal !== -45.00) {
    console.error('FAIL: Charlie balance should be -45.00, got:', charlieBal);
    testPassed = false;
  }

  // Check simplified transactions: Charlie owes Alice 45, Bob owes Alice 15
  if (result.simplifiedDebts.length !== 2) {
    console.error('FAIL: Expected exactly 2 simplified debt payments, got:', result.simplifiedDebts.length);
    testPassed = false;
  } else {
    const debt1 = result.simplifiedDebts.find(d => d.fromUser.id === 3);
    const debt2 = result.simplifiedDebts.find(d => d.fromUser.id === 2);

    if (!debt1 || debt1.toUser.id !== 1 || debt1.amount !== 45.00) {
      console.error('FAIL: Charlie should owe Alice $45.00, got:', debt1);
      testPassed = false;
    }
    if (!debt2 || debt2.toUser.id !== 1 || debt2.amount !== 15.00) {
      console.error('FAIL: Bob should owe Alice $15.00, got:', debt2);
      testPassed = false;
    }
  }

  if (testPassed) {
    console.log('SUCCESS: All balance & simplification test cases passed!');
  } else {
    process.exit(1);
  }
}

runTests();
