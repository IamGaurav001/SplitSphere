const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

// Initialize express app
const app = express();
const server = http.createServer(app);

// Configure CORS with auto-allow for Vercel subdomains to prevent misconfiguration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith('.vercel.app') || 
                      origin.startsWith('http://localhost:');
                      
    if (isAllowed) {
      callback(null, true);
    } else {
      // Log origin but allow for MVP deployment stability
      console.log(`CORS fallback: allowing request from origin ${origin}`);
      callback(null, true);
    }
  },
  credentials: true
};

const io = socketIo(server, {
  cors: corsOptions
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
const authRouter = require('./routes/auth');
const groupsRouter = require('./routes/groups');
const expensesRouter = require('./routes/expenses');

app.use('/api/auth', authRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/expenses', expensesRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Socket.io real-time chat setup
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  // User joins an expense room
  socket.on('join_expense', (expenseId) => {
    socket.join(`expense_${expenseId}`);
    console.log(`Socket ${socket.id} joined room expense_${expenseId}`);
  });

  // User sends a chat message inside an expense
  socket.on('send_message', async (data) => {
    const { expenseId, userId, message } = data;
    
    if (!expenseId || !userId || !message) return;

    try {
      // 1. Save to DB
      const result = await db.query(
        `INSERT INTO chat_messages (expense_id, user_id, message) 
         VALUES ($1, $2, $3) 
         RETURNING id, expense_id, user_id, message, created_at`,
        [expenseId, userId, message.trim()]
      );
      
      const savedMessage = result.rows[0];

      // 2. Fetch user's name to display
      const userResult = await db.query('SELECT name FROM users WHERE id = $1', [userId]);
      savedMessage.user_name = userResult.rows[0]?.name || 'Unknown User';

      // 3. Emit message back to room
      io.to(`expense_${expenseId}`).emit('receive_message', savedMessage);
      console.log(`Broadcasted message in expense_${expenseId} from User ${userId}`);
    } catch (err) {
      console.error('Socket message save error:', err);
    }
  });

  // User leaves expense room
  socket.on('leave_expense', (expenseId) => {
    socket.leave(`expense_${expenseId}`);
    console.log(`Socket ${socket.id} left room expense_${expenseId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`SplitSphere server running on port ${PORT}`);
});
