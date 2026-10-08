import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Clock, History } from 'lucide-react';

const eventColors: Record<string, string> = {
  TASK_MOVED: 'var(--neon-blue)',
  TASK_COMPLETED: 'var(--neon-green)',
  WORKER_REALLOCATED: 'var(--neon-orange)',
  BOTTLENECK_DETECTED: 'var(--neon-red)',
  MISSION_COMPLETED: 'var(--neon-pink)',
  ACHIEVEMENT_UNLOCKED: 'var(--neon-yellow)',
  LEVEL_UP: 'var(--neon-purple)',
};

export const EventTimeline: React.FC = () => {
  const { events, activePanel, setActivePanel } = useGameStore();

  if (activePanel !== 'timeline') return null;

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
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--neon-blue)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={18} /> Activity & Event Timeline
          </h3>
          <button className="btn-neon red" style={{ padding: '4px 10px', fontSize: 10 }} onClick={() => setActivePanel(null)}>✕</button>
        </div>

        {events.length === 0 && (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-dim)', fontSize: 13 }}>
            No timeline events recorded yet. Advance a turn or complete tasks to generate history!
          </div>
        )}

        {events.map((event) => (
          <div
            key={event.id}
            style={{
              display: 'flex',
              gap: 12,
              padding: '10px 0',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                marginTop: 4,
                background: eventColors[event.type] || 'var(--neon-cyan)',
                boxShadow: `0 0 8px ${eventColors[event.type] || 'var(--neon-cyan)'}`,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{event.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{event.description}</div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
              <Clock size={11} />
              {event.created_at ? new Date(event.created_at).toLocaleTimeString() : 'Just now'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
