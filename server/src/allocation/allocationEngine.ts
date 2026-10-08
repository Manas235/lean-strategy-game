// Dynamic Resource Allocation Engine
import pool from '../db/pool.js';

export interface AllocationResult {
  worker_id: number;
  worker_name: string;
  from_station: string;
  to_station: string;
  reason: string;
  score: number;
  predicted_impact: { cycle_time_change: number; efficiency_change: number; waste_change: number; };
}

export async function findOptimalAllocation(teamId: number): Promise<AllocationResult[]> {
  const workersRes = await pool.query('SELECT * FROM workers WHERE team_id = $1', [teamId]);
  const factoryRes = await pool.query('SELECT * FROM factory_state WHERE team_id = $1', [teamId]);

  const workers = workersRes.rows;
  const factory = factoryRes.rows[0];
  if (!factory) return [];

  const stations = typeof factory.stations === 'string' ? JSON.parse(factory.stations) : factory.stations;
  const results: AllocationResult[] = [];

  // Find overloaded and underutilized stations
  const stationEntries = Object.entries(stations) as [string, any][];
  const overloaded = stationEntries.filter(([, s]) => s.workload > 85);
  const underloaded = stationEntries.filter(([, s]) => s.workload < 40);

  for (const [overSid, overStation] of overloaded) {
    for (const [underSid, underStation] of underloaded) {
      // Find best worker to move (highest skill match for target station + lowest workload)
      const candidates = workers.filter((w: any) =>
        w.current_station === underSid && Number(w.workload) < 60
      );

      for (const worker of candidates) {
        const hasSkill = worker.skills?.includes(overSid) ? 1 : 0;
        const experienceScore = Number(worker.experience) / 10;
        const availabilityScore = Number(worker.availability) / 100;
        const productivityScore = Number(worker.productivity) / 100;
        const score = (hasSkill * 40) + (experienceScore * 20) + (availabilityScore * 20) + (productivityScore * 20);

        results.push({
          worker_id: worker.id,
          worker_name: worker.name,
          from_station: underSid,
          to_station: overSid,
          reason: `${overStation.name} is at ${Math.round(overStation.workload)}% while ${underStation.name} is at ${Math.round(underStation.workload)}%`,
          score,
          predicted_impact: {
            cycle_time_change: -(score * 0.3),
            efficiency_change: score * 0.2,
            waste_change: -(score * 0.1),
          },
        });
      }
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 3); // Top 3 recommendations
}

export async function executeAllocation(teamId: number, workerId: number, toStation: string): Promise<void> {
  const workerRes = await pool.query('SELECT * FROM workers WHERE id = $1 AND team_id = $2', [workerId, teamId]);
  const worker = workerRes.rows[0];
  if (!worker) throw new Error('Worker not found');

  const fromStation = worker.current_station;

  // Update worker's station
  await pool.query('UPDATE workers SET current_station = $1, workload = LEAST(100, workload + 20) WHERE id = $2', [toStation, workerId]);

  // Log allocation history
  await pool.query(
    'INSERT INTO allocation_history (team_id, worker_id, from_station, to_station, reason, impact) VALUES ($1, $2, $3, $4, $5, $6)',
    [teamId, workerId, fromStation, toStation, 'AI-recommended reallocation', JSON.stringify({ cycle_time_change: -18, efficiency_change: 12 })]
  );

  // Log game event
  await pool.query(
    'INSERT INTO game_events (team_id, type, title, description, payload) VALUES ($1, $2, $3, $4, $5)',
    [teamId, 'WORKER_REALLOCATED', `${worker.name} Reassigned`, `${worker.name} moved from ${fromStation} to ${toStation}`,
     JSON.stringify({ worker_id: workerId, from: fromStation, to: toStation })]
  );
}
