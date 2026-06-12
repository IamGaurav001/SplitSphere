# Key Prompts Used - SplitSphere

This file documents the core prompts used to direct the AI assistant during the development of the SplitSphere application.

---

### 1. Initial Prompt (Interview & Scope Setup)
> "You are a junior engineer helping me complete an internship assignment. The assignment is to reverse engineer Splitwise, scope a realistic 3-day version, and build a working deployed app. Start by interviewing me. Ask questions across product goals, data model, stack... Do not recommend technical solutions. Your job is to let me think through the technical solution. Do not give me a final plan until you have asked enough questions."

---

### 2. Technology Stack & Database Selection
> "Frontend :- React(Vite)  Backend:- Node.js(Express) can we do mongodb"
*(Follow-up clarifying that MongoDB is out of scope due to the relational-only constraint, leading to the selection of PostgreSQL, JWT, Socket.io, Vercel, and Render)*
> "PostgreSQL, JWT, Socket.io Vercel and Render"

---

### 3. Execution Phase Trigger
> "now start doing the project"

---

### 4. Spacing Configuration
> "Fix the spacing issue"
*(Follow-up adjusting layout flex gaps, margin offsets, and loading padding to make layouts more compact)*

---

### 5. UI Style Pivot (Neo-Brutalist Redesign)
> "Redesign the whole UI make it clean and modern design it should not look AI made it should be clean"
> "i want this type of ui" (With Neo-brutalist light grid reference image)

---

### 6. Container Width Adjustments
> "remove waste space from sides"
*(Follow-up setting max-width to 100% and updating padding to utilize full-screen grids)*
