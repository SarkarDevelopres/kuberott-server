// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require("http");
const { initSocket } = require("./socket.js");
const mongoose = require('mongoose');
const User = require("./db/models/user");

const connectDB = require('./db/connectDB'); // must return a Promise!

mongoose.set('bufferCommands', false); // fail fast instead of buffering

const app = express();
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

const server = createServer(app);
initSocket(server);

// Routes
const authRouter = require('./routes/auth.routes');
const userRouter = require('./routes/user.routes');
const movieRouter = require('./routes/movie.routes');
const adminRouter = require('./routes/admin.routes');
// const empRouter = require('./routes/employee.routes');

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/ping', (_req, res) => {
  res.send('SERVER IS ALIVE');
});


// Public routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/movie', movieRouter);
app.use('/api/admin', adminRouter);
// app.use('/api/employee', empRouter);

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// --- DB diagnostics (optional) ---
mongoose.connection.on('error', (e) => console.error('[db] error:', e.message));
mongoose.connection.on('disconnected', () => console.error('[db] disconnected'));

async function main() {

  const PORT = process.env.PORT || 4000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
  // 1) Connect to Mongo FIRST
  await connectDB(); // must resolve only when connected
  console.log('[db] connected');

  await User.syncIndexes();
  console.log("User indexes synced");

}

main().catch((err) => {
  console.error('[boot] fatal:', err);
  process.exit(1);
});
