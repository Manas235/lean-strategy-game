import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db/pool.js';
import { initDatabase } from './db/init.js';
import { runSimulation } from './engine/simulationEngine.js';
import { generateRecommendations } from './ai/aiAdvisor.js';
import { executeAllocation } from './allocation/allocationEngine.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'lean-secret';
const PORT = process.env.PORT || 3001;

// ─── AUTH ───
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, xp, level, coins, energy, ai_credits, lean_score, streak',
      [username, email, hash]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─── USERS ───
app.get('/api/users/:id', async (req, res) => {
  const result = await pool.query('SELECT id, username, email, xp, level, coins, energy, ai_credits, lean_score, streak FROM users WHERE id = $1', [req.params.id]);
  res.json(result.rows[0] || {});
});

// ─── TEAMS ───
app.get('/api/teams', async (_req, res) => {
  const result = await pool.query('SELECT * FROM teams ORDER BY score DESC');
  res.json(result.rows);
});

app.get('/api/teams/:id', async (req, res) => {
  const team = await pool.query('SELECT * FROM teams WHERE id = $1', [req.params.id]);
  const members = await pool.query(
    `SELECT u.id, u.username, u.xp, u.level, tm.role FROM team_members tm JOIN users u ON u.id = tm.user_id WHERE tm.team_id = $1`,
    [req.params.id]
  );
  res.json({ ...team.rows[0], members: members.rows });
});

app.post('/api/teams/:id/join', async (req, res) => {
  try {
    const { user_id } = req.body;
    await pool.query('INSERT INTO team_members (user_id, team_id) VALUES ($1, $2)', [user_id, req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─── WORKERS ───
app.get('/api/teams/:teamId/workers', async (req, res) => {
  const result = await pool.query('SELECT * FROM workers WHERE team_id = $1 ORDER BY id', [req.params.teamId]);
  res.json(result.rows);
});

app.put('/api/workers/:id/reassign', async (req, res) => {
  const { station, team_id } = req.body;
  await executeAllocation(team_id, Number(req.params.id), station);
  // Re-run simulation
  const simResult = await runSimulation(team_id);
  const recs = await generateRecommendations(team_id);
  io.to(`team-${team_id}`).emit('factory:updated', simResult);
  io.to(`team-${team_id}`).emit('ai:recommendation', recs);
  io.to(`team-${team_id}`).emit('worker:reallocated', { worker_id: req.params.id, station });
  res.json({ success: true, simulation: simResult });
});

// ─── TASKS ───
app.get('/api/teams/:teamId/tasks', async (req, res) => {
  const result = await pool.query('SELECT * FROM tasks WHERE team_id = $1 ORDER BY id', [req.params.teamId]);
  res.json(result.rows);
});

app.post('/api/teams/:teamId/tasks', async (req, res) => {
  const { title, description, priority, type, difficulty, estimated_time, xp_reward, lean_impact, deadline } = req.body;
  const result = await pool.query(
    `INSERT INTO tasks (team_id, title, description, priority, type, difficulty, estimated_time, xp_reward, lean_impact, deadline)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.params.teamId, title, description || '', priority || 'medium', type || 'feature', difficulty || 1, estimated_time || 1, xp_reward || 25, lean_impact || 'flow', deadline || null]
  );
  io.to(`team-${req.params.teamId}`).emit('task:created', result.rows[0]);
  res.json(result.rows[0]);
});

app.put('/api/tasks/:id/move', async (req, res) => {
  const { status, team_id } = req.body;
  const oldTask = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
  await pool.query('UPDATE tasks SET status = $1 WHERE id = $2', [status, req.params.id]);

  // Log event
  await pool.query(
    'INSERT INTO game_events (team_id, type, title, description, payload) VALUES ($1, $2, $3, $4, $5)',
    [team_id, 'TASK_MOVED', 'Task Moved', `${oldTask.rows[0]?.title} moved to ${status}`,
     JSON.stringify({ task_id: req.params.id, from: oldTask.rows[0]?.status, to: status })]
  );

  // If task completed, award XP
  let xpGained = 0;
  if (status === 'done' && oldTask.rows[0]) {
    xpGained = oldTask.rows[0].xp_reward || 25;
    // Update team score
    await pool.query('UPDATE teams SET score = score + $1 WHERE id = $2', [xpGained, team_id]);
    // Log completion event
    await pool.query(
      'INSERT INTO game_events (team_id, type, title, description, payload) VALUES ($1, $2, $3, $4, $5)',
      [team_id, 'TASK_COMPLETED', 'Task Completed!', `${oldTask.rows[0].title} completed! +${xpGained} XP`,
       JSON.stringify({ task_id: req.params.id, xp: xpGained })]
    );
  }

  // Run simulation after every task move
  const simResult = await runSimulation(team_id);
  const recs = await generateRecommendations(team_id);

  // Check missions
  await checkMissions(team_id, simResult);

  io.to(`team-${team_id}`).emit('task:moved', { taskId: req.params.id, status });
  io.to(`team-${team_id}`).emit('factory:updated', simResult);
  if (recs.length > 0) io.to(`team-${team_id}`).emit('ai:recommendation', recs);
  if (xpGained > 0) io.to(`team-${team_id}`).emit('player:xp', { xp: xpGained });

  res.json({ success: true, simulation: simResult, xp_gained: xpGained, recommendations: recs });
});

// ─── FACTORY STATE ───
app.get('/api/teams/:teamId/factory', async (req, res) => {
  const result = await pool.query('SELECT * FROM factory_state WHERE team_id = $1', [req.params.teamId]);
  const factory = result.rows[0];
  if (factory && typeof factory.stations === 'string') {
    factory.stations = JSON.parse(factory.stations);
  }
  res.json(factory || {});
});

app.post('/api/teams/:teamId/turn', async (req, res) => {
  const teamId = Number(req.params.teamId);
  const simResult = await runSimulation(teamId);
  const recs = await generateRecommendations(teamId);
  io.to(`team-${teamId}`).emit('game:turn', simResult);
  if (recs.length > 0) io.to(`team-${teamId}`).emit('ai:recommendation', recs);
  res.json({ simulation: simResult, recommendations: recs });
});

// ─── MISSIONS ───
app.get('/api/teams/:teamId/missions', async (req, res) => {
  const result = await pool.query('SELECT * FROM missions WHERE team_id = $1 ORDER BY status, id', [req.params.teamId]);
  res.json(result.rows);
});

// ─── ACHIEVEMENTS ───
app.get('/api/achievements', async (_req, res) => {
  const result = await pool.query('SELECT * FROM achievements ORDER BY id');
  res.json(result.rows);
});

app.get('/api/users/:userId/achievements', async (req, res) => {
  const result = await pool.query(
    `SELECT a.*, ua.unlocked_at FROM achievements a LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1 ORDER BY a.id`,
    [req.params.userId]
  );
  res.json(result.rows);
});

// ─── LEAN SKILLS ───
app.get('/api/lean-skills', async (_req, res) => {
  const result = await pool.query('SELECT * FROM lean_skills ORDER BY level_required, id');
  res.json(result.rows);
});

app.get('/api/users/:userId/lean-skills', async (req, res) => {
  const result = await pool.query(
    `SELECT ls.*, uls.unlocked_at FROM lean_skills ls LEFT JOIN user_lean_skills uls ON ls.id = uls.skill_id AND uls.user_id = $1 ORDER BY ls.level_required`,
    [req.params.userId]
  );
  res.json(result.rows);
});

// ─── AI RECOMMENDATIONS ───
app.get('/api/teams/:teamId/recommendations', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM ai_recommendations WHERE team_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 5',
    [req.params.teamId, 'pending']
  );
  res.json(result.rows);
});

app.put('/api/recommendations/:id/respond', async (req, res) => {
  const { status, team_id } = req.body; // 'accepted' or 'rejected'
  const rec = await pool.query('SELECT * FROM ai_recommendations WHERE id = $1', [req.params.id]);
  const recommendation = rec.rows[0];
  if (!recommendation) return res.status(404).json({ error: 'Not found' });

  await pool.query('UPDATE ai_recommendations SET status = $1 WHERE id = $2', [status, req.params.id]);

  if (status === 'accepted') {
    // Execute the recommendation
    if (recommendation.type === 'reallocation' && recommendation.worker_id && recommendation.to_station) {
      await executeAllocation(team_id, recommendation.worker_id, recommendation.to_station);
    }
    // Award XP
    await pool.query('UPDATE teams SET score = score + $1 WHERE id = $2', [recommendation.xp_reward, team_id]);
    // Run simulation
    const simResult = await runSimulation(team_id);
    io.to(`team-${team_id}`).emit('factory:updated', simResult);
    io.to(`team-${team_id}`).emit('player:xp', { xp: recommendation.xp_reward });
    if (recommendation.worker_id) {
      io.to(`team-${team_id}`).emit('worker:reallocated', { worker_id: recommendation.worker_id, station: recommendation.to_station });
    }
    res.json({ success: true, xp_gained: recommendation.xp_reward, simulation: simResult });
  } else {
    res.json({ success: true });
  }
});

// ─── LEADERBOARD ───
app.get('/api/leaderboard', async (_req, res) => {
  const result = await pool.query(
    `SELECT t.id as team_id, t.name as team_name, t.score as total_xp, fs.efficiency, fs.lean_score as level
     FROM teams t LEFT JOIN factory_state fs ON t.id = fs.team_id
     ORDER BY t.score DESC`
  );
  res.json(result.rows.map((r: any, i: number) => ({ ...r, rank: i + 1 })));
});

// ─── EVENTS / TIMELINE ───
app.get('/api/teams/:teamId/events', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM game_events WHERE team_id = $1 ORDER BY created_at DESC LIMIT 50',
    [req.params.teamId]
  );
  res.json(result.rows);
});

// ─── MISSION CHECKING ───
async function checkMissions(teamId: number, simResult: any) {
  const missions = await pool.query('SELECT * FROM missions WHERE team_id = $1 AND status = $2', [teamId, 'active']);
  for (const mission of missions.rows) {
    let currentVal = 0;
    if (mission.target_metric === 'waste') currentVal = simResult.waste;
    else if (mission.target_metric === 'bottleneck_count') currentVal = simResult.bottlenecks.length;
    else if (mission.target_metric === 'efficiency') currentVal = simResult.efficiency;

    await pool.query('UPDATE missions SET current_value = $1 WHERE id = $2', [currentVal, mission.id]);

    // Check completion
    let completed = false;
    if (mission.target_metric === 'waste' && currentVal <= mission.target_value) completed = true;
    if (mission.target_metric === 'bottleneck_count' && currentVal <= mission.target_value) completed = true;
    if (mission.target_metric === 'efficiency' && currentVal >= mission.target_value) completed = true;

    if (completed) {
      await pool.query('UPDATE missions SET status = $1 WHERE id = $2', ['completed', mission.id]);
      await pool.query('UPDATE teams SET score = score + $1 WHERE id = $2', [mission.reward_xp, teamId]);
      io.to(`team-${teamId}`).emit('mission:completed', { mission, xp: mission.reward_xp, coins: mission.reward_coins });
      await pool.query(
        'INSERT INTO game_events (team_id, type, title, description, payload) VALUES ($1,$2,$3,$4,$5)',
        [teamId, 'MISSION_COMPLETED', 'Mission Complete!', `${mission.title} completed! +${mission.reward_xp} XP`,
         JSON.stringify({ mission_id: mission.id, xp: mission.reward_xp })]
      );
    }
  }
}

// ─── WEBSOCKET ───
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('team:join', (teamId: number) => {
    socket.join(`team-${teamId}`);
    console.log(`👥 Socket ${socket.id} joined team-${teamId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ─── START ───
async function start() {
  try {
    await initDatabase();
    console.log('✅ Database initialized');
  } catch (err) {
    console.error('⚠️ Database init failed, continuing anyway:', (err as Error).message);
  }

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket listening on port ${PORT}`);
  });
}

start();
