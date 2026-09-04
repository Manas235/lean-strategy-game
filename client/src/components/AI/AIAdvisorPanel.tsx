import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { Bot, ArrowRight, TrendingDown, TrendingUp, X } from 'lucide-react';

export const AIAdvisorPanel: React.FC = () => {
  const { recommendations, teamId, activePanel, setActivePanel } = useGameStore();
  const pending = recommendations.filter((r) => r.status === 'pending');

  const respond = async (recId: number, status: 'accepted' | 'rejected') => {
    try {
      const res = await fetch(`/api/recommendations/${recId}/respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, team_id: teamId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (status === 'accepted' && data.xp_gained) {
          useGameStore.getState().addXPPopup(data.xp_gained);
        }
        if (data.simulation) useGameStore.getState().updateFromSimulation(data.simulation);
      } else if (status === 'accepted') {
        useGameStore.getState().addXPPopup(35);
      }
    } catch {
      if (status === 'accepted') {
        useGameStore.getState().addXPPopup(35);
      }
    }
    useGameStore.getState().setRecommendations(
      useGameStore.getState().recommendations.filter((r) => r.id !== recId)
    );
  };

  if (pending.length === 0) {
    if (activePanel === 'ai') {
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
          <div className="glass" style={{ width: 440, padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bot size={18} /> AI Lean Strategic Advisor
              </h3>
              <button className="btn-neon red" style={{ padding: '4px 10px', fontSize: 10 }} onClick={() => setActivePanel(null)}>✕</button>
            </div>
            <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🤖✨</div>
              <p>No active bottlenecks detected! All stations are operating within optimal lean thresholds.</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  // If opened via nav tab, render modal; otherwise render floating cards
  if (activePanel === 'ai') {
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
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bot size={18} /> AI Lean Strategic Advisor
            </h3>
            <button className="btn-neon red" style={{ padding: '4px 10px', fontSize: 10 }} onClick={() => setActivePanel(null)}>✕</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pending.map((rec) => (
              <RecCard key={rec.id} rec={rec} onRespond={respond} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Floating notifications at top right
  return (
    <div
      style={{
        position: 'absolute',
        top: 90,
        right: 16,
        width: 320,
        zIndex: 25,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxHeight: '45vh',
        overflowY: 'auto',
      }}
    >
      <AnimatePresence>
        {pending.slice(0, 2).map((rec) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
          >
            <RecCard rec={rec} onRespond={respond} onDismiss={() => respond(rec.id, 'rejected')} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const RecCard: React.FC<{
  rec: any;
  onRespond: (id: number, status: 'accepted' | 'rejected') => void;
  onDismiss?: () => void;
}> = ({ rec, onRespond, onDismiss }) => (
  <div
    className="glass"
    style={{
      padding: 14,
      borderLeft: `4px solid ${
        rec.type === 'reallocation'
          ? 'var(--neon-red)'
          : rec.type === 'waste_reduction'
          ? 'var(--neon-green)'
          : 'var(--neon-orange)'
      }`,
      position: 'relative',
    }}
  >
    {onDismiss && (
      <button
        onClick={onDismiss}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'none',
          border: 'none',
          color: 'var(--text-dim)',
          cursor: 'pointer',
          padding: 2,
        }}
        title="Dismiss"
      >
        <X size={14} />
      </button>
    )}

    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #00f3ff, #0077ff)',
          boxShadow: '0 0 10px rgba(0,243,255,0.4)',
        }}
      >
        <Bot size={15} color="#fff" />
      </div>
      <div style={{ flex: 1, paddingRight: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 8, color: 'var(--neon-cyan)', letterSpacing: '1.5px' }}>
          AI ADVISOR
        </div>
        <div style={{ fontSize: 12, fontWeight: 700 }}>{rec.title}</div>
      </div>
    </div>

    {/* Description */}
    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.4 }}>
      {rec.description}
    </p>

    {/* Reallocation visual */}
    {rec.from_station && rec.to_station && (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '6px',
          background: 'rgba(0,0,0,0.35)',
          borderRadius: 6,
          marginBottom: 8,
          fontSize: 10,
          fontFamily: 'var(--font-display)',
        }}
      >
        <span style={{ color: 'var(--neon-orange)' }}>{rec.from_station}</span>
        <ArrowRight size={12} color="var(--neon-cyan)" />
        <span style={{ color: 'var(--neon-green)' }}>{rec.to_station}</span>
      </div>
    )}

    {/* Predicted Impact */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
      <ImpactChip label="Cycle" value={`${rec.predicted_impact.cycle_time_change}%`} positive={rec.predicted_impact.cycle_time_change < 0} />
      <ImpactChip label="Efficiency" value={`+${rec.predicted_impact.efficiency_change}%`} positive={true} />
      <ImpactChip label="Waste" value={`${rec.predicted_impact.waste_change}%`} positive={rec.predicted_impact.waste_change < 0} />
      <ImpactChip label="Reward" value={`+${rec.xp_reward} XP`} positive={true} />
    </div>

    <div style={{ fontSize: 9, color: 'var(--neon-purple)', marginBottom: 8 }}>
      🧠 {rec.lean_principle}
    </div>

    {/* Action buttons */}
    <div style={{ display: 'flex', gap: 6 }}>
      <button
        className="btn-neon green"
        style={{ flex: 1, padding: '5px 8px', fontSize: 10 }}
        onClick={() => onRespond(rec.id, 'accepted')}
      >
        ⚡ Execute (+{rec.xp_reward} XP)
      </button>
      <button
        className="btn-neon red"
        style={{ padding: '5px 10px', fontSize: 10 }}
        onClick={() => onRespond(rec.id, 'rejected')}
      >
        ✕
      </button>
    </div>
  </div>
);

const ImpactChip: React.FC<{ label: string; value: string; positive: boolean }> = ({ label, value, positive }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 9,
      padding: '3px 6px',
      background: 'rgba(0,0,0,0.25)',
      borderRadius: 4,
    }}
  >
    {positive ? <TrendingUp size={9} color="var(--neon-green)" /> : <TrendingDown size={9} color="var(--neon-red)" />}
    <span style={{ color: 'var(--text-dim)' }}>{label}:</span>
    <span style={{ fontWeight: 700, color: positive ? 'var(--neon-green)' : 'var(--neon-red)' }}>{value}</span>
  </div>
);
