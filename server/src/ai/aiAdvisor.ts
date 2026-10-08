// AI Strategy Engine — Analyzes factory state and generates recommendations
import pool from '../db/pool.js';

export interface AIInsight {
  type: 'reallocation' | 'optimization' | 'waste_reduction' | 'flow_improvement';
  title: string;
  description: string;
  reason: string;
  lean_principle: string;
  predicted_impact: { cycle_time_change: number; efficiency_change: number; waste_change: number; throughput_change: number; };
  worker_id?: number;
  from_station?: string;
  to_station?: string;
  xp_reward: number;
}

export async function generateRecommendations(teamId: number): Promise<AIInsight[]> {
  const factoryRes = await pool.query('SELECT * FROM factory_state WHERE team_id = $1', [teamId]);
  const workersRes = await pool.query('SELECT * FROM workers WHERE team_id = $1', [teamId]);
  const tasksRes = await pool.query('SELECT * FROM tasks WHERE team_id = $1', [teamId]);

  const factory = factoryRes.rows[0];
  if (!factory) return [];

  const workers = workersRes.rows;
  const tasks = tasksRes.rows;
  const stations = typeof factory.stations === 'string' ? JSON.parse(factory.stations) : factory.stations;
  const recommendations: AIInsight[] = [];

  // 1. Detect bottlenecks and recommend reallocation
  const stationIds = ['raw-materials', 'processing', 'assembly', 'quality', 'shipping'];
  for (const sid of stationIds) {
    const station = stations[sid];
    if (!station) continue;
    if (station.status === 'bottleneck' || station.workload > 90) {
      // Find an underutilized station
      const underutilized = stationIds.find(s => stations[s]?.workload < 50 && s !== sid);
      if (underutilized) {
        const availableWorker = workers.find((w: any) =>
          w.current_station === underutilized && Number(w.workload) < 50
        );
        if (availableWorker) {
          recommendations.push({
            type: 'reallocation',
            title: `⚠ ${station.name} Bottleneck Detected`,
            description: `Move ${availableWorker.name} from ${stations[underutilized].name} to ${station.name}`,
            reason: `${station.name} is at ${Math.round(station.workload)}% capacity while ${stations[underutilized].name} is only at ${Math.round(stations[underutilized].workload)}%.`,
            lean_principle: 'Flow Optimization',
            predicted_impact: {
              cycle_time_change: -18,
              efficiency_change: 12,
              waste_change: -8,
              throughput_change: 15,
            },
            worker_id: availableWorker.id,
            from_station: underutilized,
            to_station: sid,
            xp_reward: 25,
          });
        }
      }
    }
  }

  // 2. Waste reduction recommendation
  if (Number(factory.waste) > 20) {
    recommendations.push({
      type: 'waste_reduction',
      title: '♻️ High Waste Detected',
      description: `Factory waste is at ${factory.waste}%. Apply 5S organization to reduce waste.`,
      reason: `Waste above 20% indicates unorganized processes. 5S can reduce waste by standardizing workflows.`,
      lean_principle: '5S Organization',
      predicted_impact: { cycle_time_change: -5, efficiency_change: 8, waste_change: -12, throughput_change: 5 },
      xp_reward: 30,
    });
  }

  // 3. WIP limit recommendation
  const wipCount = tasks.filter((t: any) => t.status === 'in-progress').length;
  if (wipCount > 4) {
    recommendations.push({
      type: 'flow_improvement',
      title: '🔄 WIP Limit Exceeded',
      description: `${wipCount} tasks in progress. Limit WIP to 4 to improve flow.`,
      reason: `Too much work-in-progress creates congestion and increases cycle time. Pull System principle suggests limiting WIP.`,
      lean_principle: 'Pull System / Kanban',
      predicted_impact: { cycle_time_change: -22, efficiency_change: 10, waste_change: -5, throughput_change: 8 },
      xp_reward: 20,
    });
  }

  // 4. Efficiency optimization
  if (Number(factory.efficiency) < 70) {
    recommendations.push({
      type: 'optimization',
      title: '⚡ Low Efficiency Alert',
      description: `Overall efficiency is ${factory.efficiency}%. Review worker assignments and task priorities.`,
      reason: `Low efficiency suggests misalignment between worker skills and assigned stations. Kaizen approach recommends continuous small improvements.`,
      lean_principle: 'Kaizen',
      predicted_impact: { cycle_time_change: -10, efficiency_change: 15, waste_change: -3, throughput_change: 10 },
      xp_reward: 35,
    });
  }

  // Store recommendations in DB
  for (const rec of recommendations) {
    await pool.query(
      `INSERT INTO ai_recommendations (team_id, type, title, description, reason, lean_principle, predicted_impact, worker_id, from_station, to_station, xp_reward, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending')
       ON CONFLICT DO NOTHING`,
      [teamId, rec.type, rec.title, rec.description, rec.reason, rec.lean_principle,
       JSON.stringify(rec.predicted_impact), rec.worker_id || null, rec.from_station || null, rec.to_station || null, rec.xp_reward]
    );
  }

  return recommendations;
}
