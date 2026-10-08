import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { GitBranch, Lock, Unlock } from 'lucide-react';

export const LeanSkillTree: React.FC = () => {
  const { leanSkills, level, activePanel, setActivePanel } = useGameStore();

  if (activePanel !== 'skills') return null;

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
          width: 560,
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--neon-purple)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <GitBranch size={18} /> Lean Mastery Skill Tree
          </h3>
          <button className="btn-neon red" style={{ padding: '4px 10px', fontSize: 10 }} onClick={() => setActivePanel(null)}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {leanSkills.map((skill) => {
            const unlocked = skill.unlocked_at || level >= skill.level_required;
            return (
              <div
                key={skill.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  background: unlocked ? 'rgba(0,255,136,0.06)' : 'rgba(0,0,0,0.3)',
                  borderRadius: 10,
                  border: unlocked ? '1px solid rgba(0,255,136,0.25)' : '1px solid rgba(255,255,255,0.05)',
                  opacity: unlocked ? 1 : 0.45,
                }}
              >
                <div style={{ fontSize: 24, width: 40, textAlign: 'center' }}>{skill.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {skill.name}
                    {unlocked ? <Unlock size={12} color="var(--neon-green)" /> : <Lock size={12} color="var(--text-dim)" />}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{skill.description}</div>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 10,
                    color: unlocked ? 'var(--neon-green)' : 'var(--text-dim)',
                    padding: '4px 10px',
                    borderRadius: 4,
                    background: unlocked ? 'rgba(0,255,136,0.12)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${unlocked ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.05)'}`,
                  }}
                >
                  LVL {skill.level_required}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
