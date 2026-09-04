import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

export const XPPopup: React.FC = () => {
  const { xpPopups } = useGameStore();

  return (
    <AnimatePresence>
      {xpPopups.map((popup) => (
        <motion.div
          key={popup.id}
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{ opacity: 1, y: -50, scale: 1.2 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{
            position: 'fixed', left: `${popup.x}%`, top: `${popup.y}%`,
            zIndex: 100, pointerEvents: 'none',
            fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 900,
            color: '#00ff88',
            textShadow: '0 0 10px #00ff88, 0 0 30px rgba(0,255,136,0.5), 0 0 50px rgba(0,255,136,0.3)',
          }}
        >
          +{popup.amount} XP
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

export const LevelUpOverlay: React.FC = () => {
  const { showLevelUp, level } = useGameStore();

  return (
    <AnimatePresence>
      {showLevelUp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
            pointerEvents: 'none',
          }}
        >
          <motion.div
            initial={{ scale: 0.3, rotateY: 180 }}
            animate={{ scale: 1, rotateY: 0 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            style={{ textAlign: 'center' }}
          >
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 900,
              background: 'linear-gradient(135deg, #00f3ff, #ff00ff, #ffaa00)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 30px rgba(0,243,255,0.5))',
              marginBottom: 10,
            }}>
              LEVEL UP!
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 120, fontWeight: 900,
              color: '#fff',
              textShadow: '0 0 20px var(--neon-cyan), 0 0 60px var(--neon-purple)',
            }}>
              {level}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 20, color: 'var(--neon-green)', marginTop: 10 }}>
              🎉 New abilities unlocked!
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
