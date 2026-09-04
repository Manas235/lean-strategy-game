import pool from './pool.js';

const schema = `
-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  coins INTEGER DEFAULT 100,
  energy INTEGER DEFAULT 100,
  ai_credits INTEGER DEFAULT 5,
  lean_score INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  score INTEGER DEFAULT 0,
  budget NUMERIC DEFAULT 10000,
  energy INTEGER DEFAULT 100,
  ai_credits INTEGER DEFAULT 10,
  materials INTEGER DEFAULT 50,
  production_capacity INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Members
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, team_id)
);

-- Workers
CREATE TABLE IF NOT EXISTS workers (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  avatar VARCHAR(20) DEFAULT '🧑‍🔧',
  skills TEXT[] DEFAULT '{}',
  experience INTEGER DEFAULT 1,
  availability NUMERIC DEFAULT 100,
  productivity NUMERIC DEFAULT 80,
  current_station VARCHAR(30) DEFAULT 'processing',
  workload NUMERIC DEFAULT 0,
  capacity NUMERIC DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT '',
  status VARCHAR(20) DEFAULT 'backlog',
  priority VARCHAR(20) DEFAULT 'medium',
  type VARCHAR(20) DEFAULT 'feature',
  difficulty INTEGER DEFAULT 1,
  worker_id INTEGER REFERENCES workers(id) ON DELETE SET NULL,
  estimated_time NUMERIC DEFAULT 1,
  actual_time NUMERIC DEFAULT 0,
  xp_reward INTEGER DEFAULT 25,
  lean_impact VARCHAR(100) DEFAULT 'flow',
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task Dependencies
CREATE TABLE IF NOT EXISTS task_dependencies (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  UNIQUE(task_id, depends_on_task_id)
);

-- Resources
CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  amount NUMERIC DEFAULT 0,
  UNIQUE(team_id, type)
);

-- Factory State
CREATE TABLE IF NOT EXISTS factory_state (
  id SERIAL PRIMARY KEY,
  team_id INTEGER UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  stations JSONB NOT NULL DEFAULT '{}',
  efficiency NUMERIC DEFAULT 80,
  cycle_time NUMERIC DEFAULT 4.5,
  throughput NUMERIC DEFAULT 10,
  waste NUMERIC DEFAULT 15,
  wip INTEGER DEFAULT 0,
  lead_time NUMERIC DEFAULT 8,
  customer_satisfaction NUMERIC DEFAULT 75,
  cost NUMERIC DEFAULT 0,
  lean_score NUMERIC DEFAULT 50,
  turn_number INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game Sessions
CREATE TABLE IF NOT EXISTS game_sessions (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  turn_number INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Missions
CREATE TABLE IF NOT EXISTS missions (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(10) DEFAULT '🎯',
  target_metric VARCHAR(50),
  target_value NUMERIC DEFAULT 0,
  current_value NUMERIC DEFAULT 0,
  reward_xp INTEGER DEFAULT 50,
  reward_coins INTEGER DEFAULT 25,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(10) DEFAULT '🏅',
  criteria VARCHAR(200)
);

-- User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Lean Skills
CREATE TABLE IF NOT EXISTS lean_skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(10) DEFAULT '🧠',
  level_required INTEGER DEFAULT 1,
  parent_skill_id INTEGER REFERENCES lean_skills(id) ON DELETE SET NULL
);

-- User Lean Skills
CREATE TABLE IF NOT EXISTS user_lean_skills (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  skill_id INTEGER REFERENCES lean_skills(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- Game Events
CREATE TABLE IF NOT EXISTS game_events (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200),
  description TEXT,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  type VARCHAR(50),
  title VARCHAR(200),
  description TEXT,
  reason TEXT,
  lean_principle VARCHAR(100),
  predicted_impact JSONB DEFAULT '{}',
  worker_id INTEGER REFERENCES workers(id) ON DELETE SET NULL,
  from_station VARCHAR(30),
  to_station VARCHAR(30),
  xp_reward INTEGER DEFAULT 25,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allocation History
CREATE TABLE IF NOT EXISTS allocation_history (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  worker_id INTEGER REFERENCES workers(id) ON DELETE SET NULL,
  from_station VARCHAR(30),
  to_station VARCHAR(30),
  reason TEXT,
  impact JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_workers_team_id ON workers(team_id);
CREATE INDEX IF NOT EXISTS idx_game_events_team_id ON game_events(team_id);
CREATE INDEX IF NOT EXISTS idx_game_events_created ON game_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_missions_team_status ON missions(team_id, status);
`;

const seedData = `
-- Seed Achievements
INSERT INTO achievements (name, description, icon, criteria) VALUES
  ('Waste Hunter', 'Reduce waste below 10%', '♻️', 'waste < 10'),
  ('Bottleneck Slayer', 'Clear 5 bottlenecks', '⚡', 'bottlenecks_cleared >= 5'),
  ('Kaizen Champion', 'Apply continuous improvement 10 times', '🏆', 'kaizen_actions >= 10'),
  ('Flow Master', 'Maintain continuous flow for 5 turns', '🌊', 'flow_streak >= 5'),
  ('Productivity Master', 'Achieve 95%+ efficiency', '🚀', 'efficiency >= 95'),
  ('Lean Expert', 'Unlock all Lean skills', '🧠', 'all_skills_unlocked'),
  ('Speed Demon', 'Complete 10 tasks in one turn', '💨', 'tasks_completed_turn >= 10'),
  ('Team Player', 'Reassign workers 20 times', '🤝', 'reassignments >= 20')
ON CONFLICT DO NOTHING;

-- Seed Lean Skills
INSERT INTO lean_skills (name, description, icon, level_required, parent_skill_id) VALUES
  ('5S Organization', 'Sort, Set in Order, Shine, Standardize, Sustain', '🧹', 1, NULL),
  ('Kanban Basics', 'Visual workflow management', '📋', 1, NULL),
  ('Waste Identification', 'Identify the 7 types of waste', '🔍', 2, NULL),
  ('Pull System', 'Demand-driven production flow', '🔄', 3, 2),
  ('Kanban Optimization', 'WIP limits and flow optimization', '📊', 3, 2),
  ('Just-in-Time', 'Produce only what is needed, when needed', '⏰', 4, 4),
  ('Kaizen', 'Continuous incremental improvement', '🌱', 5, NULL),
  ('Value Stream Mapping', 'Map the entire value flow', '🗺️', 6, 7),
  ('Continuous Flow', 'Uninterrupted production flow', '🌊', 7, 6),
  ('Poka-Yoke', 'Error-proofing techniques', '🛡️', 8, 7),
  ('Heijunka', 'Production leveling', '📏', 9, 9),
  ('Advanced Waste Elimination', 'Master-level waste reduction', '🎯', 10, 8)
ON CONFLICT DO NOTHING;

-- Seed a default team
INSERT INTO teams (name, budget, energy, ai_credits, materials, production_capacity) VALUES
  ('Team Phoenix', 10000, 100, 10, 50, 100),
  ('Team Titans', 10000, 100, 10, 50, 100),
  ('Team Alpha', 10000, 100, 10, 50, 100)
ON CONFLICT (name) DO NOTHING;

-- Seed Workers for Team 1
INSERT INTO workers (team_id, name, avatar, skills, experience, availability, productivity, current_station, workload, capacity) VALUES
  (1, 'Ravi', '👷', '{assembly,quality}', 3, 100, 85, 'processing', 40, 100),
  (1, 'Priya', '👩‍🔧', '{processing,raw-materials}', 4, 100, 90, 'raw-materials', 60, 100),
  (1, 'Arjun', '🧑‍🔬', '{quality,shipping}', 2, 100, 75, 'quality', 30, 100),
  (1, 'Maya', '👩‍💻', '{assembly,processing}', 5, 100, 92, 'assembly', 80, 100),
  (1, 'Kiran', '🧑‍🏭', '{shipping,raw-materials}', 1, 100, 70, 'shipping', 20, 100)
ON CONFLICT DO NOTHING;

-- Seed Tasks for Team 1
INSERT INTO tasks (team_id, title, description, status, priority, type, difficulty, worker_id, estimated_time, xp_reward, lean_impact) VALUES
  (1, 'Setup CI/CD Pipeline', 'Configure automated deployment', 'backlog', 'medium', 'optimization', 2, NULL, 3, 50, 'continuous_flow'),
  (1, 'Design Landing Page', 'Create the main product page', 'todo', 'high', 'feature', 3, NULL, 5, 75, 'value'),
  (1, 'Fix Auth Bug', 'Resolve login session timeout', 'todo', 'critical', 'bug', 1, NULL, 1, 30, 'quality'),
  (1, 'Implement Kanban Board', 'Build interactive board', 'in-progress', 'high', 'feature', 3, 4, 4, 100, 'flow'),
  (1, 'Write Unit Tests', 'Cover core modules', 'review', 'medium', 'optimization', 2, 3, 3, 50, 'quality'),
  (1, 'Optimize DB Queries', 'Reduce query latency', 'backlog', 'medium', 'optimization', 2, NULL, 2, 40, 'waste_reduction'),
  (1, 'Add Search Feature', 'Full-text search', 'todo', 'low', 'feature', 2, NULL, 3, 60, 'value'),
  (1, 'Deploy Monitoring', 'Setup alerts and dashboards', 'backlog', 'high', 'maintenance', 2, NULL, 2, 45, 'continuous_improvement')
ON CONFLICT DO NOTHING;

-- Seed Factory State for Team 1
INSERT INTO factory_state (team_id, stations, efficiency, cycle_time, throughput, waste, wip, lead_time, customer_satisfaction, lean_score, turn_number)
VALUES (1, '${JSON.stringify({
  "raw-materials": { "id": "raw-materials", "name": "Raw Materials", "workload": 60, "capacity": 100, "efficiency": 85, "status": "optimal", "workers": [2], "tasks": [] },
  "processing": { "id": "processing", "name": "Processing", "workload": 40, "capacity": 100, "efficiency": 80, "status": "optimal", "workers": [1], "tasks": [] },
  "assembly": { "id": "assembly", "name": "Assembly", "workload": 80, "capacity": 100, "efficiency": 72, "status": "warning", "workers": [4], "tasks": [4] },
  "quality": { "id": "quality", "name": "Quality Check", "workload": 30, "capacity": 100, "efficiency": 88, "status": "optimal", "workers": [3], "tasks": [5] },
  "shipping": { "id": "shipping", "name": "Shipping", "workload": 20, "capacity": 100, "efficiency": 90, "status": "optimal", "workers": [5], "tasks": [] }
})}', 78, 4.2, 12, 18, 3, 8.5, 72, 55, 0)
ON CONFLICT (team_id) DO NOTHING;

-- Seed Missions for Team 1
INSERT INTO missions (team_id, title, description, icon, target_metric, target_value, current_value, reward_xp, reward_coins, status) VALUES
  (1, 'Eliminate Bottleneck', 'Clear the Assembly bottleneck', '🎯', 'bottleneck_count', 0, 1, 100, 50, 'active'),
  (1, 'Waste Hunter', 'Reduce waste below 10%', '♻️', 'waste', 10, 18, 150, 75, 'active'),
  (1, 'Flow Master', 'Maintain continuous flow for 5 turns', '⚡', 'flow_streak', 5, 0, 200, 100, 'active')
ON CONFLICT DO NOTHING;
`;

export async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('🗄️  Creating database schema...');
    await client.query(schema);
    console.log('✅ Schema created');

    console.log('🌱 Seeding data...');
    await client.query(seedData);
    console.log('✅ Data seeded');
  } catch (err) {
    console.error('❌ Database init error:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Run directly
if (process.argv[1]?.includes('init')) {
  initDatabase().then(() => { console.log('Done!'); process.exit(0); })
    .catch(() => process.exit(1));
}
