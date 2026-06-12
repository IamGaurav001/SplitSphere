# SplitSphere - Simplified Splitwise Clone

SplitSphere is a full-stack, responsive web application inspired by Splitwise. It enables groups of users to log expenses, split bills multiple ways, engage in real-time chat, track balances, and settle debts using a simplified payment path algorithm.

---

## Features

1. **Authentication**: Secure registration and login using JWT and password hashing (Bcrypt).
2. **Group Management**:
   - Create groups with custom descriptions.
   - Invite users by email lookup.
   - Remove users from groups.
3. **Expense Splitting**:
   - Split expenses **Equally** across participants.
   - Split **Unequally** using exact local currency values.
   - Split by **Percentage** (validates sum is 100%).
   - Split by **Shares** (ratio allocations).
   - Accounts for rounding remains by distributing cent differentials.
4. **Real-time Chat**: Connects to Socket.io rooms to deliver instant discussion updates inside specific expenses.
5. **Simplified Debts**: Evaluates group transactions and returns the minimum number of direct transfers needed to settle all balances.
6. **Cash Settlements**: Record cash payments to offset balances.

---

## Technical Stack

- **Frontend**: React (Vite), React Router, Lucide Icons, Socket.io-client, Axios, Vanilla CSS.
- **Backend**: Node.js (Express), Socket.io, JSON Web Tokens (JWT), Bcrypt.
- **Database**: PostgreSQL (Relational DB only).

---

## Setup & Running Locally

### Prerequisites
- Node.js (v18+)
- PostgreSQL database instance

### Database Setup
1. Create a PostgreSQL database named `splitsphere` (or any other name).
2. Run the SQL statements inside `server/schema.sql` on your database to create tables and indexes:
   ```bash
   psql -d splitsphere -f server/schema.sql
   ```

### Backend Installation
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your environment. Open or create the `.env` file in the `server` folder:
   ```env
   PORT=5001
   DATABASE_URL=postgresql://your_db_username:your_db_password@localhost:5432/splitsphere
   JWT_SECRET=your_jwt_secret_key
   ALLOWED_ORIGINS=http://localhost:5173
   ```
4. Start the server in development mode (using nodemon):
   ```bash
   npm run dev
   ```

### Frontend Installation
1. Navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

---

## Verification & Tests
We created a unit test to verify balance calculations and the debt simplification algorithm.
Run the test from the `server` folder:
```bash
node tests/balances.test.js
```

---

## AI Collaboration Context
This project was co-engineered with **Antigravity**, a Google DeepMind agent, using the specifications established in [AI_CONTEXT.md](./AI_CONTEXT.md) and [BUILD_PLAN.md](./BUILD_PLAN.md).
