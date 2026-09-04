import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Award } from 'lucide-react';

export const AchievementGrid: React.FC = () => {
  const { achievements, activePanel, setActivePanel } = useGameStore();

  if (activePanel !== 'achievements') return null;

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
          width: 520,
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--neon-orange)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={18} /> Achievements & Badges
          </h3>
          <button className="btn-neon red" style={{ padding: '4px 10px', fontSize: 10 }} onClick={() => setActivePanel(null)}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {achievements.map((a) => (
            <div
              key={a.id}
              style={{
                padding: 14,
                background: a.unlocked_at ? 'rgba(0,255,136,0.08)' : 'rgba(0,0,0,0.3)',
                borderRadius: 10,
                border: a.unlocked_at ? '1px solid rgba(0,255,136,0.4)' : '1px solid rgba(255,255,255,0.06)',
                opacity: a.unlocked_at ? 1 : 0.55,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>{a.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{a.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{a.description}</div>
              {a.unlocked_at && (
                <div style={{ fontSize: 9, color: 'var(--neon-green)', marginTop: 6, fontWeight: 'bold' }}>
                  ✅ UNLOCKED
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
