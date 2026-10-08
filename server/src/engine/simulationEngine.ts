// Game Simulation Engine — Recalculates factory state each turn
import pool from '../db/pool.js';

export interface SimulationResult {
  efficiency: number;
  cycle_time: number;
  throughput: number;
  waste: number;
  wip: number;
  lead_time: number;
  customer_satisfaction: number;
  cost: number;
  lean_score: number;
  bottlenecks: string[];
  events: { type: string; title: string; description: string }[];
}

export async function runSimulation(teamId: number): Promise<SimulationResult> {
  const factoryRes = await pool.query('SELECT * FROM factory_state WHERE team_id = $1', [teamId]);
  const workersRes = await pool.query('SELECT * FROM workers WHERE team_id = $1', [teamId]);
  const tasksRes = await pool.query('SELECT * FROM tasks WHERE team_id = $1', [teamId]);

  const factory = factoryRes.rows[0];
  if (!factory) throw new Error('No factory state found');

  const workers = workersRes.rows;
  const tasks = tasksRes.rows;
  const stations = typeof factory.stations === 'string' ? JSON.parse(factory.stations) : factory.stations;
  const events: { type: string; title: string; description: string }[] = [];

  // Calculate WIP
  const wipTasks = tasks.filter((t: any) => t.status === 'in-progress');
  const wip = wipTasks.length;

  // Calculate station workloads
  const stationIds = ['raw-materials', 'processing', 'assembly', 'quality', 'shipping'];
  const bottlenecks: string[] = [];

  for (const sid of stationIds) {
    const stationWorkers = workers.filter((w: any) => w.current_station === sid);
    const stationTasks = tasks.filter((t: any) => {
      if (sid === 'processing') return t.status === 'in-progress';
      if (sid === 'quality') return t.status === 'review';
      if (sid === 'assembly') return t.status === 'in-progress';
      return false;
    });
    const totalCapacity = stationWorkers.reduce((sum: number, w: any) => sum + Number(w.capacity), 0) || 100;
    const totalWorkload = stationWorkers.reduce((sum: number, w: any) => sum + Number(w.workload), 0);
    const workloadPct = totalCapacity > 0 ? (totalWorkload / totalCapacity) * 100 : 0;

    let status: 'optimal' | 'warning' | 'bottleneck' = 'optimal';
    if (workloadPct > 100) { status = 'bottleneck'; bottlenecks.push(sid); }
    else if (workloadPct > 75) { status = 'warning'; }

    const efficiency = Math.max(20, 100 - Math.max(0, workloadPct - 80) * 1.5);
    stations[sid] = {
      ...stations[sid], workload: workloadPct, capacity: totalCapacity,
      efficiency, status,
      workers: stationWorkers.map((w: any) => w.id),
      tasks: stationTasks.map((t: any) => t.id),
    };
  }

  // Global metrics
  const avgEfficiency = stationIds.reduce((sum, sid) => sum + (stations[sid]?.efficiency || 80), 0) / stationIds.length;
  const effClamped = Math.round(Math.min(100, Math.max(0, avgEfficiency)));

  // WIP congestion penalty
  const wipPenalty = Math.max(0, wip - 5) * 2;

  // Cycle time: base + WIP penalty + bottleneck penalty
  const cycleTime = Math.round((3 + wipPenalty * 0.3 + bottlenecks.length * 1.2) * 10) / 10;

  // Throughput: inversely related to cycle time
  const throughput = Math.max(1, Math.round((100 / cycleTime) * (effClamped / 100)));

  // Waste: increases with bottlenecks and poor utilization
  const baseWaste = 10;
  const wasteFromBottlenecks = bottlenecks.length * 5;
  const wasteFromWIP = Math.max(0, wip - 4) * 2;
  const waste = Math.min(60, baseWaste + wasteFromBottlenecks + wasteFromWIP);

  // Lead time
  const leadTime = Math.round((cycleTime * 1.5 + wip * 0.5) * 10) / 10;

  // Customer satisfaction: inversely related to waste and lead time
  const custSat = Math.round(Math.max(20, 100 - waste - leadTime * 2));

  // Cost: based on workers and inefficiency
  const costPerTurn = workers.length * 100 + (100 - effClamped) * 20;

  // Lean score: composite
  const leanScore = Math.round(
    effClamped * 0.3 + (100 - waste) * 0.25 + custSat * 0.2 + throughput * 0.15 + (100 - Math.min(100, cycleTime * 10)) * 0.1
  );

  // Generate events for bottlenecks
  for (const b of bottlenecks) {
    events.push({ type: 'BOTTLENECK_DETECTED', title: `${stations[b]?.name} Bottleneck!`, description: `${stations[b]?.name} is overloaded at ${Math.round(stations[b]?.workload || 0)}% capacity.` });
  }

  // Overworked workers
  for (const w of workers) {
    if (Number(w.workload) > 90) {
      events.push({ type: 'WORKER_OVERLOADED', title: `${w.name} is Overworked!`, description: `${w.name}'s workload is at ${w.workload}%. Productivity will decrease.` });
      // Reduce productivity
      await pool.query('UPDATE workers SET productivity = GREATEST(50, productivity - 5) WHERE id = $1', [w.id]);
    }
  }

  // Update factory state
  await pool.query(
    `UPDATE factory_state SET stations = $1, efficiency = $2, cycle_time = $3, throughput = $4, waste = $5, wip = $6, lead_time = $7, customer_satisfaction = $8, cost = $9, lean_score = $10, turn_number = turn_number + 1, updated_at = NOW() WHERE team_id = $11`,
    [JSON.stringify(stations), effClamped, cycleTime, throughput, waste, wip, leadTime, custSat, costPerTurn, leanScore, teamId]
  );

  return { efficiency: effClamped, cycle_time: cycleTime, throughput, waste, wip, lead_time: leadTime, customer_satisfaction: custSat, cost: costPerTurn, lean_score: leanScore, bottlenecks, events };
}
