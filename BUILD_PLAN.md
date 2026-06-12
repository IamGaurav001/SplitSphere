# Build Plan - SplitSphere (Splitwise Clone)

This document provides a comprehensive summary of the product research, technical architecture, AI collaboration process, and engineering trade-offs made during the development of SplitSphere.

---

## 1. Product Research

### How We Studied Splitwise
We analyzed the core functional flows of Splitwise, focusing on how it balances peer-to-peer debts, handles complex expense divisions, and structures group boundaries.

### Key Learnings
- **Transactional Consistency**: Financial splits must strictly equal the total payment. Fractions of a cent (e.g. division remainders) must be systematically accounted for.
- **Cognitive Overhead**: Direct transaction paths can get complicated in large groups. Users prefer seeing a single "simplified" debt summary rather than multiple back-and-forth transfers.
- **Collaboration Context**: Sharing bills is social. Having comments or chats directly associated with specific expenses provides valuable context on why amounts were changed or recorded.

### Identified Workflows
1. **User Identity & Onboarding**: Email/password registry securing user transactions.
2. **Group Demarcation**: Creating spaces where members are added and balances calculated.
3. **Multi-mode Splitting**:
   - **Equal**: Divides base amounts and distributes remainders.
   - **Unequal**: Matches arbitrary user-specified values to the total.
   - **Percentage**: Validates percentage inputs to 100% and computes splits.
   - **Shares**: Computes splits using ratio allocations (`user_share / total_shares`).
4. **Debt Simplification**: Matching global group balances to calculate minimal payment routes.
5. **Real-time Collaboration**: Expense-specific live discussion feed.

### Product Assumptions
- **Single Currency**: Scoped to a single base currency (e.g., USD / $) to simplify calculations.
- **Valid Membership**: Transactions require both payer and payee to belong to the active group.
- **Account Existence**: Group member invitations check if the email is registered in the system.

---

## 2. Architecture

### Tech Stack
- **Frontend**: React (Vite) for state management and rendering, React Router for client routing.
- **Backend**: Node.js (Express) hosting JSON APIs and Socket.io for WebSockets.
- **Database**: PostgreSQL (Relational) ensuring transaction constraints and cascade controls.
- **Styling**: Vanilla CSS (Slate & Sapphire dark mode with glassmorphic cards and micro-animations).

### Relational Database Schema
- **`users`**: Manages credentials and unique emails.
- **`groups`**: Names and descriptions of active groups.
- **`group_members`**: Join table matching users to groups (many-to-many).
- **`expenses`**: General transaction headers storing totals and split types.
- **`expense_splits`**: Relational splits mapping amounts owed to individual group members.
- **`chat_messages`**: Real-time comments tied to a specific expense.
- **`settlements`**: Records cash repayments between members.

### API Design
- `/api/auth/register` (POST) - Create user
- `/api/auth/login` (POST) - Sign in user & return JWT token
- `/api/auth/me` (GET) - Fetch current user
- `/api/groups` (GET/POST) - List and create groups
- `/api/groups/:id/members` (POST) - Add member to a group
- `/api/groups/:id/balances` (GET) - Fetch balances and run simplification
- `/api/groups/:id/settlements` (POST) - Record cash payment
- `/api/expenses/group/:groupId` (GET/POST) - List and log group expenses
- `/api/expenses/:id` (GET/DELETE) - Fetch split details + chats, or delete expense

---

## 3. AI Collaboration Process

### AI Instruction Strategy
The AI was configured as a junior collaborator that strictly followed requirements, avoided recommending singular technical architectures before interviewing, and updated `AI_CONTEXT.md` as decisions matured.

### Question-and-Answer Progression
1. **Tech Stack Alignment**: Probing options for database (relational Postgres chosen), authentication (JWT chosen), chat updates (Socket.io WebSockets chosen), and deployment (Vercel & Render chosen).
2. **Schema Definition**: Mapping entities into a DDL schema (`schema.sql`) enforcing foreign keys.
3. **Math and Algorithmic Scoping**: Clarifying remainder cent distribution and sorting logic for debt-minimization.

### Context Maintenance
- `AI_CONTEXT.md` was created as the source of truth, updating sections (goals, scope, database, APIs, socket events) iteratively.
- A testing script (`server/tests/balances.test.js`) was created to run balance computations locally to confirm design parameters.

---

## 4. Trade-offs

### What We Simplified
- **Rounding Remainders**: Cents remainders are distributed starting from the first participant in the split list to enforce matching totals.
- **Member Invites**: Added directly by email lookup. If a user is not registered, the invite fails, avoiding complex email-invitation queues.

### What We Hardcoded
- **JWT Key Fallback**: The development environment uses a preset fallback key if the `JWT_SECRET` environment variable is not defined.
- **Local Dev URLs**: Fallback ports are configured (`localhost:5001` for API, `localhost:5173` for client) for quick local boot.

### What We Avoided
- **Database ORMs**: Used raw queries with `pg` pool to avoid initialization and sync overhead in a 2-day build.
- **Tailwind CSS Utility Overload**: Written in Vanilla CSS to keep templates clean, maintainable, and visually customized.

### Improvements for More Time
- **Group Activity Log**: A global feed showing who added/deleted expenses or settlements.
- **Draft Invites**: Enabling invites for unregistered emails by generating registration tokens.
- **Multi-currency Conversions**: Integrating foreign exchange APIs to split bills in multiple currencies.
