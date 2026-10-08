import React from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  Zap,
  TrendingUp,
  AlertTriangle,
  Cpu,
  Flame,
  Brain,
  Coins,
  Battery,
  Target,
  Bot,
  Trophy,
  Award,
  GitBranch,
  History,
  FastForward,
  Briefcase,
  Plus,
} from 'lucide-react';

export const PlayerHUD: React.FC = () => {
  const {
    xp,
    level,
    coins,
    energy,
    aiCredits,
    efficiency,
    throughput,
    waste,
    streak,
    leanScore,
    connected,
    turnNumber,
    missions,
    recommendations,
    activePanel,
    currentProject,
    setProjectModalOpen,
    setActivePanel,
    advanceTurn,
  } = useGameStore();

  const xpInLevel = xp % 500;
  const xpPct = (xpInLevel / 500) * 100;
  const activeMissionsCount = missions.filter((m) => m.status === 'active').length;
  const pendingRecsCount = recommendations.filter((r) => r.status === 'pending').length;

  const togglePanel = (panel: string) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        padding: '10px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {/* Top Primary Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          pointerEvents: 'auto',
          flexWrap: 'wrap',
        }}
      >
        {/* Level Badge */}
        <div
          className="glass"
          style={{
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 180,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #9d00ff, #ff00ff)',
              boxShadow: '0 0 14px rgba(157,0,255,0.5)',
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontWeight: 900,
              color: '#fff',
            }}
          >
            {level}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '2px' }}>
              LEVEL {level}
            </div>
            <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginTop: 2 }}>
              <div
                style={{
                  width: `${xpPct}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #9d00ff, #ff00ff)',
                  borderRadius: 3,
                  boxShadow: '0 0 8px #ff00ff',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>
              {xpInLevel}/500 XP
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="glass" style={{ padding: '6px 14px', display: 'flex', gap: 14 }}>
          <StatChip icon={<Coins size={13} color="#ffaa00" />} label="COINS" value={coins} color="var(--neon-orange)" />
          <StatChip icon={<Battery size={13} color="#00ff88" />} label="ENERGY" value={energy} color="var(--neon-green)" />
          <StatChip icon={<Cpu size={13} color="#00f3ff" />} label="AI CREDITS" value={aiCredits} color="var(--neon-cyan)" />
          <StatChip icon={<Flame size={13} color="#ff003c" />} label="STREAK" value={streak} color="var(--neon-red)" />
          <StatChip icon={<Brain size={13} color="#9d00ff" />} label="LEAN SCORE" value={leanScore} color="var(--neon-purple)" />
        </div>

        {/* Real-time Metrics */}
        <div className="glass" style={{ padding: '6px 14px', display: 'flex', gap: 14, marginLeft: 'auto' }}>
          <MetricChip
            icon={<Zap size={14} />}
            label="EFFICIENCY"
            value={`${Math.round(efficiency)}%`}
            color={efficiency > 80 ? 'var(--neon-green)' : efficiency > 60 ? 'var(--neon-orange)' : 'var(--neon-red)'}
          />
          <MetricChip icon={<TrendingUp size={14} />} label="OUTPUT" value={throughput} color="var(--neon-cyan)" />
          <MetricChip
            icon={<AlertTriangle size={14} />}
            label="WASTE"
            value={`${Math.round(waste)}%`}
            color={waste < 15 ? 'var(--neon-green)' : waste < 25 ? 'var(--neon-orange)' : 'var(--neon-red)'}
          />
        </div>

        {/* Advance Turn Button */}
        <button
          onClick={() => advanceTurn()}
          className="btn-neon green"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            fontSize: 11,
            fontWeight: 700,
            boxShadow: '0 0 16px rgba(0, 255, 136, 0.4)',
          }}
        >
          <FastForward size={14} />
          ADVANCE TURN ({turnNumber})
        </button>

        {/* Connection Indicator */}
        <div
          title={connected ? 'Connected to live server' : 'Running in local simulation mode'}
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: connected ? 'var(--neon-green)' : 'var(--neon-cyan)',
            boxShadow: `0 0 8px ${connected ? 'var(--neon-green)' : 'var(--neon-cyan)'}`,
          }}
        />
      </div>

      {/* Secondary Navigation Command Dock */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          pointerEvents: 'auto',
          alignSelf: 'flex-start',
        }}
      >
        <button
          onClick={() => setProjectModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 6,
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: '1px solid var(--neon-cyan)',
            background: 'linear-gradient(90deg, rgba(0, 243, 255, 0.25), rgba(168, 85, 247, 0.25))',
            color: '#ffffff',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 14px rgba(0, 243, 255, 0.3)',
          }}
          title="Create a new project and configure skills & team size"
        >
          <Briefcase size={13} color="var(--neon-cyan)" />
          <span>+ NEW PROJECT</span>
        </button>

        <NavButton
          active={activePanel === 'missions'}
          onClick={() => togglePanel('missions')}
          icon={<Target size={13} />}
          label="Missions"
          badge={activeMissionsCount > 0 ? activeMissionsCount : undefined}
          badgeColor="var(--neon-orange)"
        />
        <NavButton
          active={activePanel === 'ai'}
          onClick={() => togglePanel('ai')}
          icon={<Bot size={13} />}
          label="AI Advisor"
          badge={pendingRecsCount > 0 ? pendingRecsCount : undefined}
          badgeColor="var(--neon-cyan)"
        />
        <NavButton
          active={activePanel === 'leaderboard'}
          onClick={() => togglePanel('leaderboard')}
          icon={<Trophy size={13} />}
          label="Leaderboard"
        />
        <NavButton
          active={activePanel === 'achievements'}
          onClick={() => togglePanel('achievements')}
          icon={<Award size={13} />}
          label="Badges"
        />
        <NavButton
          active={activePanel === 'skills'}
          onClick={() => togglePanel('skills')}
          icon={<GitBranch size={13} />}
          label="Skill Tree"
        />
        <NavButton
          active={activePanel === 'timeline'}
          onClick={() => togglePanel('timeline')}
          icon={<History size={13} />}
          label="Timeline"
        />
      </div>
    </div>
  );
};

const NavButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  badgeColor?: string;
}> = ({ active, onClick, icon, label, badge, badgeColor }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '5px 12px',
      borderRadius: 6,
      fontFamily: 'var(--font-display)',
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.8px',
      textTransform: 'uppercase',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: active ? '1px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
      background: active ? 'rgba(0, 243, 255, 0.2)' : 'rgba(10, 10, 22, 0.75)',
      color: active ? '#ffffff' : 'var(--text-secondary)',
      backdropFilter: 'blur(10px)',
      boxShadow: active ? '0 0 12px rgba(0, 243, 255, 0.35)' : 'none',
    }}
  >
    {icon}
    <span>{label}</span>
    {badge !== undefined && (
      <span
        style={{
          background: badgeColor || 'var(--neon-cyan)',
          color: '#000',
          fontSize: 9,
          fontWeight: 900,
          padding: '1px 5px',
          borderRadius: 10,
          marginLeft: 2,
        }}
      >
        {badge}
      </span>
    )}
  </button>
);

const StatChip: React.FC<{ icon: React.ReactNode; label: string; value: number; color: string }> = ({
  icon,
  label,
  value,
  color,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    {icon}
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '1px' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 'bold', color }}>{value}</div>
    </div>
  </div>
);

const MetricChip: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({
  icon,
  label,
  value,
  color,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <div style={{ color }}>{icon}</div>
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '1px' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color }}>{value}</div>
    </div>
  </div>
);
