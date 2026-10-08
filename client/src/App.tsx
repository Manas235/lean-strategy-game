import React, { useEffect } from 'react';
import { FactoryScene } from './components/Factory3D/FactoryScene';
import { PlayerHUD } from './components/HUD/PlayerHUD';
import { XPPopup, LevelUpOverlay } from './components/HUD/XPPopup';
import { KanbanBoard } from './components/Kanban/KanbanBoard';
import { AIAdvisorPanel } from './components/AI/AIAdvisorPanel';
import { MissionPanel } from './components/Missions/MissionPanel';
import { LeaderboardPanel } from './components/Leaderboard/LeaderboardPanel';
import { AchievementGrid } from './components/Achievements/AchievementGrid';
import { LeanSkillTree } from './components/SkillTree/LeanSkillTree';
import { EventTimeline } from './components/Timeline/EventTimeline';
import { ProjectSetupModal } from './components/Project/ProjectSetupModal';
import { useSocket } from './hooks/useSocket';
import { useGameStore } from './store/gameStore';
import { TitleScreen } from './components/TitleScreen/TitleScreen';

function App() {
  const store = useGameStore();
  const showTitleScreen = useGameStore((s) => s.showTitleScreen);
  useSocket();

  // Load initial data from backend
  useEffect(() => {
    const teamId = store.teamId;
    const load = async () => {
      try {
        const fetchJson = async (url: string) => {
          try {
            const res = await fetch(url);
            if (!res.ok) return null;
            return await res.json();
          } catch {
            return null;
          }
        };

        const [tasks, workers, factory, missions, achievements, skills, leaderboard, events, recs] = await Promise.all([
          fetchJson(`/api/teams/${teamId}/tasks`),
          fetchJson(`/api/teams/${teamId}/workers`),
          fetchJson(`/api/teams/${teamId}/factory`),
          fetchJson(`/api/teams/${teamId}/missions`),
          fetchJson('/api/achievements'),
          fetchJson('/api/lean-skills'),
          fetchJson('/api/leaderboard'),
          fetchJson(`/api/teams/${teamId}/events`),
          fetchJson(`/api/teams/${teamId}/recommendations`),
        ]);

        if (Array.isArray(tasks) && tasks.length > 0) store.setTasks(tasks);
        if (Array.isArray(workers) && workers.length > 0) store.setWorkers(workers);
        if (factory && !factory.error) store.setFactoryState(factory);
        if (Array.isArray(missions) && missions.length > 0) store.setMissions(missions);
        if (Array.isArray(achievements) && achievements.length > 0) store.setAchievements(achievements);
        if (Array.isArray(skills) && skills.length > 0) store.setLeanSkills(skills);
        if (Array.isArray(leaderboard) && leaderboard.length > 0) store.setLeaderboard(leaderboard);
        if (Array.isArray(events) && events.length > 0) store.setEvents(events);
        if (Array.isArray(recs) && recs.length > 0) store.setRecommendations(recs);

        // Set player stats from team
        const team = await fetchJson(`/api/teams/${teamId}`);
        if (team && !team.error) {
          useGameStore.setState({
            xp: team.score || 0,
            level: Math.floor((team.score || 0) / 500) + 1,
            coins: 100,
            energy: team.energy || 100,
            aiCredits: team.ai_credits || 10,
          });
        }
      } catch (err) {
        console.warn('Backend not available, using defaults:', err);
      }
    };
    load();
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Title screen – shown on first load */}
      {showTitleScreen && <TitleScreen />}
      {/* 3D Factory Background */}
      <FactoryScene />

      {/* HUD Overlay */}
      <PlayerHUD />

      {/* Side Panels */}
      <MissionPanel />
      <AIAdvisorPanel />

      {/* Kanban at Bottom */}
      <KanbanBoard />

      {/* Toggle Panels (Right Side) */}
      <LeaderboardPanel />
      <AchievementGrid />
      <LeanSkillTree />
      <EventTimeline />

      {/* Project Configuration Modal */}
      <ProjectSetupModal />

      {/* Animated Overlays */}
      <XPPopup />
      <LevelUpOverlay />
    </div>
  );
}

export default App;
