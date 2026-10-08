import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Trophy, TrendingUp, Zap } from 'lucide-react';

const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

export const LeaderboardPanel: React.FC = () => {
  const { leaderboard, activePanel, setActivePanel } = useGameStore();

  if (activePanel !== 'leaderboard') return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={() => setActivePanel(null)}
    >
      <div
        className="glass"
        style={{
          width: 480,
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--neon-cyan)' }}>
          <Trophy size={16} /> Global Leaderboard
        </h3>
        <button className="btn-neon red" style={{ padding: '4px 10px', fontSize: 9 }} onClick={() => setActivePanel(null)}>✕</button>
      </div>

      {leaderboard.map((entry, i) => (
        <div key={entry.team_id} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
          marginBottom: 6, background: i === 0 ? 'rgba(255,215,0,0.08)' : 'rgba(0,0,0,0.2)',
          borderRadius: 8, border: i === 0 ? '1px solid rgba(255,215,0,0.3)' : '1px solid transparent',
        }}>
          <span style={{ fontSize: 20, width: 30, textAlign: 'center' }}>{medals[i] || `#${i + 1}`}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{entry.team_name}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', display: 'flex', gap: 10 }}>
              <span><Zap size={9} /> Eff: {Math.round(entry.efficiency || 0)}%</span>
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--neon-green)' }}>
            {(entry.total_xp || 0).toLocaleString()} XP
          </div>
        </div>
      ))}
      </div>
    </div>
  );
};
