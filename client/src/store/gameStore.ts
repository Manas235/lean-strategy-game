import { create } from 'zustand';
import { allocateTasksWithAI, AllocationResult } from '../utils/aiTaskAllocator';

export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
export type StationId = 'raw-materials' | 'processing' | 'assembly' | 'quality' | 'shipping';

export interface Task {
  id: number; team_id: number; title: string; description: string;
  status: TaskStatus; priority: string; type: string; difficulty: number;
  worker_id: number | null; estimated_time: number; actual_time: number;
  xp_reward: number; lean_impact: string; deadline: string | null;
  required_skills?: string[];
  match_score?: number;
  ai_assignment_reason?: string;
}

export interface Worker {
  id: number; team_id: number; name: string; avatar: string;
  skills: string[]; experience: number; availability: number;
  productivity: number; current_station: StationId;
  workload: number; capacity: number;
  role?: string;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  description: string;
  skills: string[];
  teamSize: number;
  createdAt: string;
}

export interface StationState {
  id: StationId; name: string; workload: number; capacity: number;
  efficiency: number; status: 'optimal' | 'warning' | 'bottleneck';
  workers: number[]; tasks: number[];
}

export interface Mission {
  id: number; title: string; description: string; icon: string;
  target_metric: string; target_value: number; current_value: number;
  reward_xp: number; reward_coins: number; status: string;
}

export interface AIRecommendation {
  id: number; type: string; title: string; description: string;
  reason: string; lean_principle: string;
  predicted_impact: { cycle_time_change: number; efficiency_change: number; waste_change: number; throughput_change: number; };
  worker_id?: number; from_station?: string; to_station?: string;
  xp_reward: number; status: string;
}

export interface Achievement {
  id: number; name: string; description: string; icon: string;
  criteria: string; unlocked_at?: string;
}

export interface LeanSkill {
  id: number; name: string; description: string; icon: string;
  level_required: number; parent_skill_id: number | null; unlocked_at?: string;
}

export interface GameEvent {
  id: number; type: string; title: string; description: string;
  payload: any; created_at: string;
}

export interface LeaderboardEntry {
  rank: number; team_id: number; team_name: string;
  total_xp: number; level: number; efficiency: number;
}

export interface XPPopup {
  id: string; amount: number; x: number; y: number;
}

interface GameStore {
  // Connection
  teamId: number;
  connected: boolean;
  setConnected: (c: boolean) => void;

  // Player
  xp: number; level: number; coins: number; energy: number;
  aiCredits: number; leanScore: number; streak: number;

  // Project
  currentProject: Project;
  isProjectModalOpen: boolean;
  setProjectModalOpen: (open: boolean) => void;
  createProject: (projectData: { name: string; category?: string; description: string; skills: string[]; workers: Worker[]; tasks: Task[] }) => void;

  // Factory
  stations: Record<StationId, StationState>;
  efficiency: number; cycleTime: number; throughput: number;
  waste: number; wip: number; leadTime: number;
  customerSatisfaction: number; cost: number; turnNumber: number;

  // Tasks & Workers
  tasks: Task[];
  workers: Worker[];
  autoAssignTasksWithAI: () => { assignedCount: number; allocations: AllocationResult[] };
  assignTaskToWorker: (taskId: number, workerId: number | null) => void;

  // AI & Missions
  recommendations: AIRecommendation[];
  missions: Mission[];
  achievements: Achievement[];
  leanSkills: LeanSkill[];
  leaderboard: LeaderboardEntry[];
  events: GameEvent[];

  // UI State
  xpPopups: XPPopup[];
  showLevelUp: boolean;
  activePanel: string | null;
  showTitleScreen: boolean;
  setShowTitleScreen: (show: boolean) => void;

  // Actions
  setTasks: (tasks: Task[]) => void;
  setWorkers: (workers: Worker[]) => void;
  setFactoryState: (state: any) => void;
  setRecommendations: (recs: AIRecommendation[]) => void;
  setMissions: (missions: Mission[]) => void;
  setAchievements: (a: Achievement[]) => void;
  setLeanSkills: (s: LeanSkill[]) => void;
  setLeaderboard: (l: LeaderboardEntry[]) => void;
  setEvents: (e: GameEvent[]) => void;
  addXPPopup: (amount: number) => void;
  dismissXPPopup: (id: string) => void;
  setShowLevelUp: (show: boolean) => void;
  setActivePanel: (panel: string | null) => void;
  updateFromSimulation: (sim: any) => void;
  moveTask: (taskId: number, newStatus: TaskStatus) => void;
  advanceTurn: () => Promise<void>;
}

const defaultProject: Project = {
  id: 'proj-1',
  name: 'Digital AI Lean Platform',
  category: 'Full-Stack Software & AI',
  description: 'Enterprise AI Strategy & Kanban continuous delivery stream.',
  skills: ['React', 'TypeScript', 'Node.js', 'DevOps', 'Quality Assurance', 'UI/UX Design'],
  teamSize: 5,
  createdAt: new Date().toISOString(),
};

const defaultStations: Record<StationId, StationState> = {
  'raw-materials': { id: 'raw-materials', name: 'Raw Materials', workload: 60, capacity: 100, efficiency: 85, status: 'optimal', workers: [2], tasks: [] },
  'processing': { id: 'processing', name: 'Processing', workload: 40, capacity: 100, efficiency: 80, status: 'optimal', workers: [1], tasks: [] },
  'assembly': { id: 'assembly', name: 'Assembly', workload: 80, capacity: 100, efficiency: 72, status: 'warning', workers: [4], tasks: [4] },
  'quality': { id: 'quality', name: 'Quality Check', workload: 30, capacity: 100, efficiency: 88, status: 'optimal', workers: [3], tasks: [5] },
  'shipping': { id: 'shipping', name: 'Shipping', workload: 20, capacity: 100, efficiency: 90, status: 'optimal', workers: [5], tasks: [] },
};

const defaultTasks: Task[] = [
  { id: 1, team_id: 1, title: 'Setup CI/CD Pipeline', description: 'Configure automated continuous deployment', status: 'backlog', priority: 'medium', type: 'optimization', difficulty: 2, worker_id: null, estimated_time: 3, actual_time: 0, xp_reward: 50, lean_impact: 'continuous_flow', deadline: null, required_skills: ['DevOps', 'Node.js'] },
  { id: 2, team_id: 1, title: 'Design Landing Page', description: 'Create responsive high-converting product page', status: 'todo', priority: 'high', type: 'feature', difficulty: 3, worker_id: null, estimated_time: 5, actual_time: 0, xp_reward: 75, lean_impact: 'value', deadline: null, required_skills: ['UI/UX Design', 'React'] },
  { id: 3, team_id: 1, title: 'Fix Auth Session Bug', description: 'Resolve login session timeout on token refresh', status: 'todo', priority: 'critical', type: 'bug', difficulty: 1, worker_id: null, estimated_time: 1, actual_time: 0, xp_reward: 40, lean_impact: 'quality', deadline: null, required_skills: ['Node.js', 'TypeScript'] },
  { id: 4, team_id: 1, title: 'Implement Kanban Board', description: 'Build interactive real-time board with WIP limits', status: 'in-progress', priority: 'high', type: 'feature', difficulty: 3, worker_id: 4, estimated_time: 4, actual_time: 2, xp_reward: 100, lean_impact: 'flow', deadline: null, required_skills: ['React', 'TypeScript'] },
  { id: 5, team_id: 1, title: 'Write Unit & E2E Tests', description: 'Cover core simulation modules with 80%+ coverage', status: 'review', priority: 'medium', type: 'optimization', difficulty: 2, worker_id: 3, estimated_time: 3, actual_time: 3, xp_reward: 50, lean_impact: 'quality', deadline: null, required_skills: ['Quality Assurance', 'TypeScript'] },
  { id: 6, team_id: 1, title: 'Optimize DB Queries', description: 'Reduce station bottleneck query latency', status: 'backlog', priority: 'medium', type: 'optimization', difficulty: 2, worker_id: null, estimated_time: 2, actual_time: 0, xp_reward: 40, lean_impact: 'waste_reduction', deadline: null, required_skills: ['Node.js', 'DevOps'] },
  { id: 7, team_id: 1, title: 'Add Search & Filter', description: 'Real-time task and worker filtering', status: 'done', priority: 'low', type: 'feature', difficulty: 2, worker_id: 1, estimated_time: 3, actual_time: 3, xp_reward: 60, lean_impact: 'value', deadline: null, required_skills: ['React'] },
];

const defaultWorkers: Worker[] = [
  { id: 1, team_id: 1, name: 'Ravi', avatar: '👷', skills: ['React', 'UI/UX Design'], experience: 3, availability: 100, productivity: 85, current_station: 'processing', workload: 40, capacity: 100, role: 'Frontend Engineer' },
  { id: 2, team_id: 1, name: 'Priya', avatar: '👩‍🔧', skills: ['Node.js', 'DevOps'], experience: 4, availability: 100, productivity: 90, current_station: 'raw-materials', workload: 60, capacity: 100, role: 'Backend & Cloud' },
  { id: 3, team_id: 1, name: 'Arjun', avatar: '🧑‍🔬', skills: ['Quality Assurance', 'TypeScript'], experience: 2, availability: 100, productivity: 75, current_station: 'quality', workload: 30, capacity: 100, role: 'QA & Test Automation' },
  { id: 4, team_id: 1, name: 'Maya', avatar: '👩‍💻', skills: ['React', 'TypeScript', 'UI/UX Design'], experience: 5, availability: 100, productivity: 92, current_station: 'assembly', workload: 80, capacity: 100, role: 'Lead Full-Stack Dev' },
  { id: 5, team_id: 1, name: 'Kiran', avatar: '🧑‍🏭', skills: ['DevOps', 'Node.js', 'Security'], experience: 1, availability: 100, productivity: 70, current_station: 'shipping', workload: 20, capacity: 100, role: 'DevOps & Reliability' },
];

const defaultMissions: Mission[] = [
  { id: 1, title: 'Eliminate Bottleneck', description: 'Clear the Assembly station warning bottleneck', icon: '🎯', target_metric: 'bottleneck_count', target_value: 0, current_value: 1, reward_xp: 100, reward_coins: 50, status: 'active' },
  { id: 2, title: 'Waste Hunter', description: 'Reduce production waste below 12%', icon: '♻️', target_metric: 'waste', target_value: 12, current_value: 18, reward_xp: 150, reward_coins: 75, status: 'active' },
  { id: 3, title: 'Flow Master', description: 'Maintain continuous flow with 85%+ efficiency', icon: '⚡', target_metric: 'flow_streak', target_value: 5, current_value: 2, reward_xp: 200, reward_coins: 100, status: 'active' },
];

const defaultRecommendations: AIRecommendation[] = [
  {
    id: 1,
    type: 'reallocation',
    title: 'Relieve Assembly Bottleneck',
    description: 'Reallocate Ravi (👷) from Processing to Assembly to balance workflow.',
    reason: 'Assembly workload is at 80% capacity with 1 task waiting. Processing is operating comfortably at 40%.',
    lean_principle: 'Heijunka (Workload Leveling)',
    predicted_impact: { cycle_time_change: -0.8, efficiency_change: 6, waste_change: -4, throughput_change: 2 },
    worker_id: 1,
    from_station: 'processing',
    to_station: 'assembly',
    xp_reward: 35,
    status: 'pending',
  },
  {
    id: 2,
    type: 'wip_limit',
    title: 'Implement WIP Limits on To Do',
    description: 'Enforce a maximum of 3 tasks in progress to reduce context switching.',
    reason: 'High multitasking increases cycle time and hides defects.',
    lean_principle: 'Kanban Pull Principle',
    predicted_impact: { cycle_time_change: -0.5, efficiency_change: 4, waste_change: -2, throughput_change: 1 },
    xp_reward: 25,
    status: 'pending',
  }
];

const defaultAchievements: Achievement[] = [
  { id: 1, name: 'Waste Hunter', description: 'Reduce waste below 10%', icon: '♻️', criteria: 'waste < 10' },
  { id: 2, name: 'Bottleneck Slayer', description: 'Clear 5 bottlenecks', icon: '⚡', criteria: 'bottlenecks_cleared >= 5', unlocked_at: new Date().toISOString() },
  { id: 3, name: 'Kaizen Champion', description: 'Apply continuous improvement 10 times', icon: '🏆', criteria: 'kaizen_actions >= 10' },
  { id: 4, name: 'Flow Master', description: 'Maintain continuous flow for 5 turns', icon: '🌊', criteria: 'flow_streak >= 5' },
  { id: 5, name: 'Productivity Master', description: 'Achieve 95%+ efficiency', icon: '🚀', criteria: 'efficiency >= 95' },
  { id: 6, name: 'Lean Expert', description: 'Unlock all Lean skills', icon: '🧠', criteria: 'all_skills_unlocked' },
];

const defaultSkills: LeanSkill[] = [
  { id: 1, name: '5S Organization', description: 'Sort, Set in Order, Shine, Standardize, Sustain', icon: '🧹', level_required: 1, parent_skill_id: null, unlocked_at: new Date().toISOString() },
  { id: 2, name: 'Kanban Basics', description: 'Visual workflow management', icon: '📋', level_required: 1, parent_skill_id: null, unlocked_at: new Date().toISOString() },
  { id: 3, name: 'Waste Identification', description: 'Identify the 7 types of waste (Muda)', icon: '🔍', level_required: 2, parent_skill_id: null },
  { id: 4, name: 'Pull System', description: 'Demand-driven production flow', icon: '🔄', level_required: 3, parent_skill_id: 2 },
  { id: 5, name: 'Kanban Optimization', description: 'WIP limits and flow optimization', icon: '📊', level_required: 3, parent_skill_id: 2 },
  { id: 6, name: 'Just-in-Time', description: 'Produce only what is needed, when needed', icon: '⏰', level_required: 4, parent_skill_id: 4 },
  { id: 7, name: 'Kaizen', description: 'Continuous incremental improvement', icon: '🌱', level_required: 5, parent_skill_id: null },
  { id: 8, name: 'Value Stream Mapping', description: 'Map the entire value flow', icon: '🗺️', level_required: 6, parent_skill_id: 7 },
];

const defaultLeaderboard: LeaderboardEntry[] = [
  { rank: 1, team_id: 1, team_name: 'Team Phoenix (You)', total_xp: 1250, level: 3, efficiency: 86 },
  { rank: 2, team_id: 2, team_name: 'Team Titans', total_xp: 1100, level: 3, efficiency: 82 },
  { rank: 3, team_id: 3, team_name: 'Team Alpha', total_xp: 950, level: 2, efficiency: 75 },
];

export const useGameStore = create<GameStore>((set, get) => ({
  teamId: 1,
  connected: false,
  setConnected: (c) => set({ connected: c }),

  xp: 320, level: 2, coins: 150, energy: 95,
  aiCredits: 8, leanScore: 68, streak: 3,

  currentProject: defaultProject,
  isProjectModalOpen: false,
  setProjectModalOpen: (open) => set({ isProjectModalOpen: open }),

  createProject: ({ name, category = 'Custom Project', description, skills, workers, tasks }) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name,
      category,
      description,
      skills,
      teamSize: workers.length,
      createdAt: new Date().toISOString(),
    };

    set({
      currentProject: newProject,
      workers,
      tasks,
      isProjectModalOpen: false,
      turnNumber: 1,
      waste: 14,
      efficiency: 84,
      leadTime: 6.5,
    });

    get().addXPPopup(150);

    // Also auto-assign initial tasks using AI
    const { updatedTasks } = allocateTasksWithAI(tasks, workers);
    set({ tasks: updatedTasks });
  },

  autoAssignTasksWithAI: () => {
    const { tasks, workers, addXPPopup } = get();
    const { updatedTasks, allocations } = allocateTasksWithAI(tasks, workers);
    set({ tasks: updatedTasks });
    addXPPopup(50);
    return { assignedCount: allocations.length, allocations };
  },

  assignTaskToWorker: (taskId: number, workerId: number | null) => {
    set((s) => ({
      tasks: s.tasks.map(t => {
        if (t.id === taskId) {
          const assignedWorker = s.workers.find(w => w.id === workerId);
          return {
            ...t,
            worker_id: workerId,
            ai_assignment_reason: assignedWorker ? `Manually assigned to ${assignedWorker.name}` : undefined,
          };
        }
        return t;
      }),
    }));
  },

  stations: defaultStations,
  efficiency: 78, cycleTime: 4.2, throughput: 12,
  waste: 18, wip: 3, leadTime: 8.5,
  customerSatisfaction: 72, cost: 0, turnNumber: 1,

  tasks: defaultTasks,
  workers: defaultWorkers,
  recommendations: defaultRecommendations,
  missions: defaultMissions,
  achievements: defaultAchievements,
  leanSkills: defaultSkills,
  leaderboard: defaultLeaderboard,
  events: [],
  xpPopups: [],
  showLevelUp: false,
  activePanel: null,
  showTitleScreen: true,
  setShowTitleScreen: (show) => set({ showTitleScreen: show }),

  setTasks: (tasks) => {
    if (Array.isArray(tasks) && tasks.length > 0) set({ tasks });
  },
  setWorkers: (workers) => {
    if (Array.isArray(workers) && workers.length > 0) set({ workers });
  },
  setFactoryState: (state) => {
    if (!state || state.error) return;
    try {
      const stations = typeof state.stations === 'string' ? JSON.parse(state.stations) : state.stations;
      set({
        stations: stations || defaultStations,
        efficiency: Number(state.efficiency) || 78,
        cycleTime: Number(state.cycle_time) || 4.2,
        throughput: Number(state.throughput) || 12,
        waste: Number(state.waste) || 18,
        wip: Number(state.wip) || 3,
        leadTime: Number(state.lead_time) || 8.5,
        customerSatisfaction: Number(state.customer_satisfaction) || 72,
        cost: Number(state.cost) || 0,
        leanScore: Number(state.lean_score) || 50,
        turnNumber: Number(state.turn_number) || 0,
      });
    } catch {
      // Keep existing
    }
  },
  setRecommendations: (recs) => {
    if (Array.isArray(recs)) set({ recommendations: recs });
  },
  setMissions: (missions) => {
    if (Array.isArray(missions) && missions.length > 0) set({ missions });
  },
  setAchievements: (a) => {
    if (Array.isArray(a) && a.length > 0) set({ achievements: a });
  },
  setLeanSkills: (s) => {
    if (Array.isArray(s) && s.length > 0) set({ leanSkills: s });
  },
  setLeaderboard: (l) => {
    if (Array.isArray(l) && l.length > 0) set({ leaderboard: l });
  },
  setEvents: (e) => {
    if (Array.isArray(e)) set({ events: e });
  },
  addXPPopup: (amount) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({
      xpPopups: [...s.xpPopups, { id, amount, x: 50 + Math.random() * 20, y: 30 + Math.random() * 10 }],
      xp: s.xp + amount,
    }));
    // Check level up
    const newXP = get().xp;
    const newLevel = Math.floor(newXP / 500) + 1;
    if (newLevel > get().level) {
      set({ level: newLevel, showLevelUp: true });
      setTimeout(() => set({ showLevelUp: false }), 3000);
    }
    // Auto-dismiss after 2s
    setTimeout(() => {
      set((s) => ({ xpPopups: s.xpPopups.filter(p => p.id !== id) }));
    }, 2000);
  },
  dismissXPPopup: (id) => set((s) => ({ xpPopups: s.xpPopups.filter(p => p.id !== id) })),
  setShowLevelUp: (show) => set({ showLevelUp: show }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  updateFromSimulation: (sim) => {
    if (!sim) return;
    set({
      efficiency: sim.efficiency ?? get().efficiency,
      cycleTime: sim.cycle_time ?? get().cycleTime,
      throughput: sim.throughput ?? get().throughput,
      waste: sim.waste ?? get().waste,
      wip: sim.wip ?? get().wip,
      leadTime: sim.lead_time ?? get().leadTime,
      customerSatisfaction: sim.customer_satisfaction ?? get().customerSatisfaction,
      cost: sim.cost ?? get().cost,
      leanScore: sim.lean_score ?? get().leanScore,
    });
  },
  moveTask: (taskId, newStatus) => {
    set((s) => ({
      tasks: s.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t),
    }));
    if (newStatus === 'done') {
      get().addXPPopup(50);
    }
  },
  advanceTurn: async () => {
    const { teamId, turnNumber, efficiency, waste, throughput, cycleTime, addXPPopup, updateFromSimulation, setRecommendations, setEvents } = get();
    try {
      const res = await fetch(`/api/teams/${teamId}/turn`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.simulation) updateFromSimulation(data.simulation);
        if (data.recommendations?.length) setRecommendations(data.recommendations);
        const evRes = await fetch(`/api/teams/${teamId}/events`);
        if (evRes.ok) setEvents(await evRes.json());
        addXPPopup(75);
        return;
      }
    } catch {
      // Fallback local simulation
    }

    // Dynamic local simulation
    const newEfficiency = Math.min(98, Math.max(55, Math.round(efficiency + (Math.random() * 5 - 1.8))));
    const newWaste = Math.max(5, Math.round(waste - 1));
    const newThroughput = throughput + Math.floor(Math.random() * 3 + 1);
    const newCycle = Math.max(2.2, +(cycleTime - 0.1).toFixed(1));

    set({
      turnNumber: turnNumber + 1,
      efficiency: newEfficiency,
      waste: newWaste,
      throughput: newThroughput,
      cycleTime: newCycle,
      leanScore: Math.min(100, get().leanScore + 2),
    });

    addXPPopup(75);
  },
}));
