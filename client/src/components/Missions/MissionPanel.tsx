import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { Target, Gift } from 'lucide-react';

export const MissionPanel: React.FC = () => {
  const { missions, activePanel, setActivePanel } = useGameStore();

  if (activePanel !== 'missions') return null;

  const active = missions.filter((m) => m.status === 'active');
  const completed = missions.filter((m) => m.status === 'completed');

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
          width: 500,
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--neon-orange)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={18} /> Active Lean Missions
          </h3>
          <button className="btn-neon red" style={{ padding: '4px 10px', fontSize: 10 }} onClick={() => setActivePanel(null)}>✕</button>
        </div>

        {active.map((mission, i) => {
          const progress = mission.target_value > 0
            ? Math.min(100, Math.max(0, (1 - (mission.current_value / mission.target_value)) * 100))
            : 0;
          return (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{
                padding: '14px',
                marginBottom: 10,
                background: 'rgba(0,0,0,0.35)',
                borderRadius: 10,
                borderLeft: '4px solid var(--neon-orange)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 20 }}>{mission.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{mission.title}</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{mission.description}</p>
              
              {/* Progress Bar */}
              <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginBottom: 6 }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--neon-orange)', borderRadius: 3, transition: 'width 0.5s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)' }}>
                <span>{Math.round(progress)}% complete</span>
                <span style={{ color: 'var(--neon-green)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                  <Gift size={12} /> +{mission.reward_xp} XP | {mission.reward_coins} 🪙
                </span>
              </div>
            </motion.div>
          );
        })}

        {completed.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, color: 'var(--neon-green)', letterSpacing: '1px', marginBottom: 8, fontFamily: 'var(--font-display)' }}>
              ✅ COMPLETED MISSIONS ({completed.length})
            </div>
            {completed.map((m) => (
              <div
                key={m.id}
                style={{
                  fontSize: 12,
                  color: 'var(--text-dim)',
                  padding: '8px 12px',
                  marginBottom: 6,
                  background: 'rgba(0,255,136,0.05)',
                  borderRadius: 6,
                  textDecoration: 'line-through',
                }}
              >
                {m.icon} {m.title}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
