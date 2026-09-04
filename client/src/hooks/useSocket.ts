import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';

const SOCKET_URL = 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const store = useGameStore();

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      store.setConnected(true);
      socket.emit('team:join', store.teamId);
    });

    socket.on('disconnect', () => store.setConnected(false));

    socket.on('factory:updated', (data) => store.updateFromSimulation(data));
    socket.on('game:turn', (data) => store.updateFromSimulation(data));

    socket.on('task:moved', (data) => {
      store.moveTask(data.taskId, data.status);
    });

    socket.on('player:xp', (data) => {
      store.addXPPopup(data.xp);
    });

    socket.on('ai:recommendation', (recs) => {
      store.setRecommendations(recs);
    });

    socket.on('worker:reallocated', (data) => {
      // Refresh workers from API
      fetch(`/api/teams/${store.teamId}/workers`).then(r => r.json()).then(w => store.setWorkers(w));
    });

    socket.on('mission:completed', (data) => {
      store.addXPPopup(data.xp);
      // Refresh missions
      fetch(`/api/teams/${store.teamId}/missions`).then(r => r.json()).then(m => store.setMissions(m));
    });

    socket.on('achievement:unlocked', () => {
      fetch('/api/achievements').then(r => r.json()).then(a => store.setAchievements(a));
    });

    return () => { socket.disconnect(); };
  }, []);

  return socketRef;
}
