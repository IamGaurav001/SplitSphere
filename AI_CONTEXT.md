# AI Context: Splitwise Clone (SplitSphere)

This document is the source of truth for the Splitwise Clone application. It is updated iteratively as the product scope, architecture, and requirements are defined.

## 1. Product Goals & Understanding
- **Goal**: Build a simplified Splitwise clone called **SplitSphere** in 2 days.
- **Concept**: A social expense-sharing application where users can create groups, log expenses split in multiple ways (equal, unequal, percentage, share), chat about specific expenses in real-time, view group balances, and record debt settlements.

## 2. Product Scope & MVP definition
- **In-Scope / MVP Features**:
  1. **Login Module**: JWT-based email/password registration and login.
  2. **Groups**: Create groups, invite/add users (via email lookup), and remove users from groups.
  3. **Expenses**:
     - Create expenses with description, amount, payer, and category.
     - Four split types: Equal, Unequal (fixed amounts), Percentage, and Shares.
     - Real-time chat inside each expense.
  4. **Balances & Settlements**:
     - Live group-wise balances and individual balance summaries.
     - Settle debts by recording payments between members.
     - Optional: Simplify debts algorithm (minimizing transactions within a group).
- **Out-of-Scope Features**:
  - OCR receipt scanning.
  - Multi-currency support (standardizing on a single currency, e.g., USD or INR).
  - Recurring expenses.

## 3. Core Workflows & User Personas
- **Personas**: Roommates sharing bills, friends traveling together, or colleagues splitting lunch.
- **Workflows**:
  1. User signs up/logs in -> landing dashboard.
  2. User creates a group (e.g. "Room 402") -> invites roommate by email.
  3. User adds an expense -> inputs total, paid_by user, selects split method, inputs shares/percentages -> system validates splits sum up correctly.
  4. Real-time updates occur via Socket.io when chat messages are sent in the expense view.
  5. Users view their current outstanding balance and click "Settle Up" to record a payment.

## 4. Technical Stack & Implementation Decisions
- **Frontend Stack**: React (Vite), React Router, Vanilla CSS (harmonious dark/glassmorphic layout).
- **Backend Stack**: Node.js (Express), Socket.io for real-time chat, JWT for auth.
- **Database (Relational only)**: PostgreSQL.
- **Hosting/Deployment**: Vercel (Frontend), Render (Backend & PostgreSQL).

## 5. Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Groups Table
```sql
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Group Members Table (Many-to-Many Join Table)
```sql
CREATE TABLE group_members (
  group_id INT REFERENCES groups(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, user_id)
);
```

### Expenses Table
```sql
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  group_id INT REFERENCES groups(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  paid_by INT REFERENCES users(id) ON DELETE CASCADE,
  split_type VARCHAR(20) CHECK (split_type IN ('equal', 'unequal', 'percentage', 'shares')) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Expense Splits Table
```sql
CREATE TABLE expense_splits (
  id SERIAL PRIMARY KEY,
  expense_id INT REFERENCES expenses(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL, -- Calculated amount this user owes
  percentage NUMERIC(5, 2),       -- Nullable, set if split_type is 'percentage'
  share INT,                      -- Nullable, set if split_type is 'shares'
  UNIQUE(expense_id, user_id)
);
```

### Chat Messages Table
```sql
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  expense_id INT REFERENCES expenses(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Settlements Table
```sql
CREATE TABLE settlements (
  id SERIAL PRIMARY KEY,
  group_id INT REFERENCES groups(id) ON DELETE CASCADE,
  payer_id INT REFERENCES users(id) ON DELETE CASCADE,
  payee_id INT REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 6. API Design (Endpoints)

### Auth Endpoints
- `POST /api/auth/register` - Create user
- `POST /api/auth/login` - Sign in user & return JWT token
- `GET /api/auth/me` - Get current authenticated user

### Group Endpoints
- `GET /api/groups` - Get all groups for current user
- `POST /api/groups` - Create a new group
- `GET /api/groups/:id` - Get details of a group (including members)
- `POST /api/groups/:id/members` - Add a member to a group by email
- `DELETE /api/groups/:id/members/:userId` - Remove a member from a group

### Expense Endpoints
- `GET /api/groups/:groupId/expenses` - Get expenses in a group
- `POST /api/groups/:groupId/expenses` - Add a new expense (calculates splits on backend and creates splits entries)
- `GET /api/expenses/:id` - Get single expense detail including splits and chat history
- `DELETE /api/expenses/:id` - Delete an expense

### Settlement Endpoints
- `GET /api/groups/:groupId/balances` - Calculate current net balances (and simplified debts) for members
- `POST /api/groups/:groupId/settlements` - Record a payment/settlement between group members

## 7. Frontend Structure & Routing
```
src/
├── components/
│   ├── Common/          # Button, Input, Modal, GlassCard
│   ├── Groups/          # GroupList, GroupDetails, AddMemberModal
│   ├── Expenses/        # ExpenseList, ExpenseForm, ExpenseDetails (with Chat)
│   └── Dashboard/       # BalanceSummary, SettleUpModal
├── pages/
│   ├── Dashboard.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   └── GroupPage.jsx
├── services/
│   ├── api.js           # Axios base setup
│   └── socket.js        # Socket.io helper
├── context/
│   └── AuthContext.jsx  # Global auth state
├── App.jsx
├── main.jsx
└── index.css            # Custom CSS system (dark mode, glassmorphism, transitions)
```

## 8. Balance Calculation & Debt Settlement Logic

### Net Balance Calculation
For each user $U$ in a group, their net balance is calculated as:
$$\text{Balance}_U = \sum (\text{Expenses paid by } U) - \sum (\text{Splits owed by } U) - \sum (\text{Settlements received by } U \text{ as payee}) + \sum (\text{Settlements paid by } U \text{ as payer})$$
- If $\text{Balance}_U > 0$, the group owes money to $U$.
- If $\text{Balance}_U < 0$, $U$ owes money to the group.

### Debt Simplification Algorithm
To simplify debts within a group:
1. Compute the net balance of every user.
2. Separate users into two lists: debtors ($\text{balance} < 0$) and creditors ($\text{balance} > 0$).
3. Sort both lists: debtors ascending (most negative first), creditors descending (most positive first).
4. Match the largest debtor with the largest creditor:
   - Settle the amount min(|debtor_balance|, creditor_balance).
   - Update their balances.
   - If a user's balance becomes 0, remove them from the list.
   - Repeat until all debts are settled.
5. Return the resulting list of transactions (e.g. "User A owes User B $25.00").

## 9. Real-Time Chat (Socket.io Events)
- Connection: Frontend connects and joins room `expense_:expenseId` upon entering an expense detail page.
- Events:
  - `join_expense(expenseId)`
  - `send_message({ expenseId, message })`
  - `receive_message({ messageObj })`
  - `leave_expense(expenseId)`

## 10. Deployment Plan
- **Database**: Supabase PostgreSQL or Neon (free tier relational DB).
- **Backend**: Render web service.
- **Frontend**: Vercel static hosting.

## 11. Testing Plan
- Manual API route verification using Postman or local curl scripts.
- Unit tests for the split calculation and debt simplification logic.
- UI validation for responsive layouts and micro-animations on different screen sizes.

## 12. Trade-offs & Known Limitations
- Real-time database syncing is mock-simulated if database connection latency is high, but Socket.io ensures immediate chat delivery.
- Fractional precision: All calculations rounded to 2 decimal places. In case of splitting divisions that result in fractional cents (e.g., $10.00 split 3 ways is $3.33, $3.33, $3.34), the remainder (e.g. $0.01) is added to the payer's split to ensure the sum exactly matches the total amount.
