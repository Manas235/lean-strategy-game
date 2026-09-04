// Shared types for the Lean Strategy Game
export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskType = 'feature' | 'bug' | 'optimization' | 'maintenance';
export type StationId = 'raw-materials' | 'processing' | 'assembly' | 'quality' | 'shipping';
export type MissionStatus = 'active' | 'completed' | 'failed';
export type RecommendationStatus = 'pending' | 'accepted' | 'rejected';

export interface User {
  id: number; username: string; email: string;
  xp: number; level: number; coins: number; energy: number;
  ai_credits: number; lean_score: number; streak: number;
}
export interface Team {
  id: number; name: string; score: number; budget: number;
  energy: number; ai_credits: number; materials: number; production_capacity: number;
}
export interface Worker {
  id: number; team_id: number; name: string; avatar: string;
  skills: string[]; experience: number; availability: number;
  productivity: number; current_station: StationId;
  workload: number; capacity: number;
}
export interface Task {
  id: number; team_id: number; title: string; description: string;
  status: TaskStatus; priority: TaskPriority; type: TaskType;
  difficulty: number; worker_id: number | null;
  estimated_time: number; actual_time: number; xp_reward: number;
  lean_impact: string; deadline: string | null;
}
export interface StationState {
  id: StationId; name: string; workload: number; capacity: number;
  efficiency: number; status: 'optimal' | 'warning' | 'bottleneck';
  workers: number[]; tasks: number[];
}
export interface FactoryState {
  id: number; team_id: number;
  stations: Record<StationId, StationState>;
  efficiency: number; cycle_time: number; throughput: number;
  waste: number; wip: number; lead_time: number;
  customer_satisfaction: number; cost: number; lean_score: number;
  turn_number: number;
}
export interface Mission {
  id: number; team_id: number; title: string; description: string;
  icon: string; target_metric: string; target_value: number;
  current_value: number; reward_xp: number; reward_coins: number;
  status: MissionStatus;
}
export interface Achievement {
  id: number; name: string; description: string; icon: string; criteria: string;
}
export interface LeanSkill {
  id: number; name: string; description: string; icon: string;
  level_required: number; parent_skill_id: number | null; unlocked: boolean;
}
export interface AIRecommendation {
  id: number; team_id: number;
  type: 'reallocation' | 'optimization' | 'waste_reduction' | 'flow_improvement';
  title: string; description: string; reason: string; lean_principle: string;
  predicted_impact: { cycle_time_change: number; efficiency_change: number; waste_change: number; throughput_change: number; };
  worker_id?: number; from_station?: StationId; to_station?: StationId;
  xp_reward: number; status: RecommendationStatus;
}
export interface GameEvent {
  id: number; team_id: number; type: string; title: string;
  description: string; payload: Record<string, unknown>; created_at: string;
}
export interface LeaderboardEntry {
  rank: number; team_id: number; team_name: string;
  total_xp: number; level: number; efficiency: number;
}
export enum WSEvent {
  TASK_MOVED = 'task:moved', TASK_CREATED = 'task:created',
  WORKER_ASSIGNED = 'worker:assigned', WORKER_REALLOCATED = 'worker:reallocated',
  FACTORY_UPDATED = 'factory:updated', METRICS_UPDATED = 'metrics:updated',
  BOTTLENECK_DETECTED = 'bottleneck:detected', AI_RECOMMENDATION = 'ai:recommendation',
  RECOMMENDATION_RESPONSE = 'ai:response', MISSION_COMPLETED = 'mission:completed',
  MISSION_UPDATED = 'mission:updated', ACHIEVEMENT_UNLOCKED = 'achievement:unlocked',
  LEVEL_UP = 'player:levelup', XP_GAINED = 'player:xp',
  EVENT_LOGGED = 'event:logged', LEADERBOARD_UPDATED = 'leaderboard:updated',
  TURN_ADVANCED = 'game:turn', GAME_STATE_SYNC = 'game:sync', JOIN_TEAM = 'team:join',
}
