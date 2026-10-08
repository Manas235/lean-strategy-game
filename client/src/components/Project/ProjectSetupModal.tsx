import React, { useState } from 'react';
import { useGameStore, Worker, Task, StationId } from '../../store/gameStore';
import { PROJECT_TEMPLATES, ProjectTemplate } from '../../utils/aiTaskAllocator';
import {
  X, Plus, Trash2, Sparkles, Users, Briefcase,
  Layers, CheckCircle2, Shuffle, ArrowRight, ArrowLeft,
  Wand2
} from 'lucide-react';

const POPULAR_SKILLS = [
  'React', 'TypeScript', 'Node.js', 'Python', 'Machine Learning',
  'UI/UX Design', 'DevOps', 'QA Testing', 'Security', 'PostgreSQL',
  'Kubernetes', 'Mobile/React Native', 'GraphQL', 'Cloud Architecture'
];

const AVATAR_OPTIONS = ['👩‍💻', '👷', '🧑‍🔬', '👩‍🔧', '🧑‍🏭', '👨‍💼', '🧙‍♂️', '🚀'];

const DEFAULT_STATIONS: StationId[] = ['raw-materials', 'processing', 'assembly', 'quality', 'shipping'];

export const ProjectSetupModal: React.FC = () => {
  const { isProjectModalOpen, setProjectModalOpen, createProject } = useGameStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('ai-saas');

  // Form State
  const [projectName, setProjectName] = useState('AI Analytics SaaS Platform');
  const [projectCategory, setProjectCategory] = useState('Full-Stack & Machine Learning');
  const [projectDescription, setProjectDescription] = useState('Build a multi-tenant cloud analytics dashboard with predictive AI engines.');
  const [skills, setSkills] = useState<string[]>([
    'React', 'TypeScript', 'Node.js', 'Python', 'Machine Learning', 'DevOps', 'UI/UX Design', 'QA Testing'
  ]);
  const [customSkillInput, setCustomSkillInput] = useState('');

  // Team State
  const [teamSize, setTeamSize] = useState<number>(4);
  const [workers, setWorkers] = useState<Worker[]>([
    { id: 1, team_id: 1, name: 'Alex', avatar: '👩‍💻', skills: ['React', 'TypeScript', 'UI/UX Design'], experience: 4, availability: 100, productivity: 90, current_station: 'assembly', workload: 0, capacity: 100, role: 'Lead Frontend' },
    { id: 2, team_id: 1, name: 'Marcus', avatar: '🧑‍🔬', skills: ['Python', 'Machine Learning', 'Node.js'], experience: 5, availability: 100, productivity: 95, current_station: 'processing', workload: 0, capacity: 100, role: 'AI / Backend Engineer' },
    { id: 3, team_id: 1, name: 'Sara', avatar: '👩‍🔧', skills: ['DevOps', 'Node.js', 'PostgreSQL'], experience: 3, availability: 100, productivity: 85, current_station: 'raw-materials', workload: 0, capacity: 100, role: 'DevOps & Infra' },
    { id: 4, team_id: 1, name: 'Elena', avatar: '👷', skills: ['QA Testing', 'TypeScript'], experience: 3, availability: 100, productivity: 80, current_station: 'quality', workload: 0, capacity: 100, role: 'QA Automation' },
  ]);

  // Tasks State
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, team_id: 1, title: 'Design Modern Glassmorphism Dashboard', description: 'Create high fidelity wireframes and tokenized design system', priority: 'high', type: 'feature', difficulty: 3, estimated_time: 4, actual_time: 0, xp_reward: 80, lean_impact: 'value', deadline: null, status: 'todo', worker_id: null, required_skills: ['UI/UX Design', 'React'] },
    { id: 2, team_id: 1, title: 'Implement JWT Auth & Role Access Control', description: 'Secure user login, OAuth2, and tenant organization scopes', priority: 'critical', type: 'feature', difficulty: 2, estimated_time: 3, actual_time: 0, xp_reward: 70, lean_impact: 'flow', deadline: null, status: 'todo', worker_id: null, required_skills: ['Node.js', 'TypeScript'] },
    { id: 3, team_id: 1, title: 'Train Predictive Churn ML Model', description: 'Develop gradient boosting model in Python with 90%+ precision', priority: 'high', type: 'feature', difficulty: 4, estimated_time: 6, actual_time: 0, xp_reward: 120, lean_impact: 'value', deadline: null, status: 'backlog', worker_id: null, required_skills: ['Python', 'Machine Learning'] },
    { id: 4, team_id: 1, title: 'Setup Docker & Kubernetes CI/CD Pipeline', description: 'Automate build, lint, container test, and deploy to AWS', priority: 'medium', type: 'optimization', difficulty: 3, estimated_time: 4, actual_time: 0, xp_reward: 85, lean_impact: 'continuous_flow', deadline: null, status: 'backlog', worker_id: null, required_skills: ['DevOps'] },
    { id: 5, team_id: 1, title: 'End-to-End Cypress Integration Tests', description: 'Automate full test coverage for auth and dashboard widgets', priority: 'medium', type: 'quality', difficulty: 2, estimated_time: 3, actual_time: 0, xp_reward: 60, lean_impact: 'quality', deadline: null, status: 'backlog', worker_id: null, required_skills: ['QA Testing', 'TypeScript'] },
    { id: 6, team_id: 1, title: 'Optimize PostgreSQL Timescale Queries', description: 'Index metrics tables to achieve sub-50ms analytics rendering', priority: 'high', type: 'optimization', difficulty: 3, estimated_time: 3, actual_time: 0, xp_reward: 90, lean_impact: 'waste_reduction', deadline: null, status: 'backlog', worker_id: null, required_skills: ['Node.js', 'DevOps'] },
  ]);

  // New task inline form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSkills, setNewTaskSkills] = useState<string[]>([]);
  const [newTaskPriority, setNewTaskPriority] = useState<string>('medium');
  const [newTaskHours, setNewTaskHours] = useState<number>(3);

  if (!isProjectModalOpen) return null;

  // Apply a template
  const applyTemplate = (tpl: ProjectTemplate) => {
    setSelectedTemplateId(tpl.id);
    setProjectName(tpl.name);
    setProjectCategory(tpl.category);
    setProjectDescription(tpl.description);
    setSkills(tpl.skills);
    setTeamSize(tpl.teamSize);

    // Auto generate worker roster matching template skills
    const newWorkers: Worker[] = Array.from({ length: tpl.teamSize }).map((_, idx) => {
      const assignedSkills = tpl.skills.filter((_, sIdx) => sIdx % tpl.teamSize === idx || (sIdx + 1) % tpl.teamSize === idx);
      const names = ['Alex', 'Marcus', 'Sara', 'Elena', 'David', 'Zoe', 'Liam', 'Maya'];
      return {
        id: idx + 1,
        team_id: 1,
        name: names[idx % names.length],
        avatar: AVATAR_OPTIONS[idx % AVATAR_OPTIONS.length],
        skills: assignedSkills.length > 0 ? assignedSkills : [tpl.skills[0]],
        experience: Math.floor(Math.random() * 3) + 3,
        availability: 100,
        productivity: 80 + Math.floor(Math.random() * 15),
        current_station: DEFAULT_STATIONS[idx % DEFAULT_STATIONS.length],
        workload: 0,
        capacity: 100,
        role: `Specialist ${idx + 1}`,
      };
    });
    setWorkers(newWorkers);

    // Map sample tasks
    const newTasks: Task[] = tpl.sampleTasks.map((st, i) => ({
      id: i + 1,
      team_id: 1,
      title: st.title,
      description: st.description,
      priority: st.priority,
      type: st.type,
      difficulty: st.difficulty,
      estimated_time: st.estimated_time,
      actual_time: 0,
      xp_reward: st.xp_reward,
      lean_impact: 'value',
      deadline: null,
      status: i < 2 ? 'todo' : 'backlog',
      worker_id: null,
      required_skills: st.required_skills,
    }));
    setTasks(newTasks);
  };

  // Adjust team size dynamically
  const handleTeamSizeChange = (newSize: number) => {
    const size = Math.max(2, Math.min(8, newSize));
    setTeamSize(size);
    if (size > workers.length) {
      const names = ['Jordan', 'Sam', 'Kai', 'Taylor', 'Morgan', 'Casey'];
      const added: Worker[] = Array.from({ length: size - workers.length }).map((_, i) => {
        const id = workers.length + i + 1;
        return {
          id,
          team_id: 1,
          name: names[(id - 1) % names.length],
          avatar: AVATAR_OPTIONS[(id - 1) % AVATAR_OPTIONS.length],
          skills: [skills[(id - 1) % skills.length] || 'General'],
          experience: 3,
          availability: 100,
          productivity: 85,
          current_station: DEFAULT_STATIONS[(id - 1) % DEFAULT_STATIONS.length],
          workload: 0,
          capacity: 100,
          role: `Engineer ${id}`,
        };
      });
      setWorkers([...workers, ...added]);
    } else if (size < workers.length) {
      setWorkers(workers.slice(0, size));
    }
  };

  // Auto-balance skills among current workers
  const handleAutoBalanceSkills = () => {
    if (!skills.length || !workers.length) return;
    const updated = workers.map((w, idx) => {
      // Give each worker 2-3 skills distributed across the project pool
      const workerSkills = skills.filter((_, sIdx) => 
        (sIdx % workers.length === idx) || ((sIdx + 1) % workers.length === idx)
      );
      return {
        ...w,
        skills: workerSkills.length > 0 ? workerSkills : [skills[0]],
      };
    });
    setWorkers(updated);
  };

  // Toggle worker skill
  const toggleWorkerSkill = (workerId: number, skillName: string) => {
    setWorkers(workers.map(w => {
      if (w.id !== workerId) return w;
      const hasSkill = w.skills.includes(skillName);
      const newSkills = hasSkill 
        ? w.skills.filter(s => s !== skillName)
        : [...w.skills, skillName];
      return { ...w, skills: newSkills.length > 0 ? newSkills : [skillName] };
    }));
  };

  // Add custom skill to project
  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setCustomSkillInput('');
  };

  // Remove skill
  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
    setWorkers(workers.map(w => ({
      ...w,
      skills: w.skills.filter(s => s !== skillToRemove).length > 0 
        ? w.skills.filter(s => s !== skillToRemove) 
        : ['General'],
    })));
  };

  // Add task
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
      team_id: 1,
      title: newTaskTitle.trim(),
      description: 'Custom project task item',
      priority: newTaskPriority,
      type: 'feature',
      difficulty: Math.min(5, Math.max(1, Math.round(newTaskHours / 2))),
      estimated_time: newTaskHours,
      actual_time: 0,
      xp_reward: newTaskHours * 20,
      lean_impact: 'value',
      deadline: null,
      status: 'backlog',
      worker_id: null,
      required_skills: newTaskSkills.length > 0 ? newTaskSkills : [skills[0] || 'General'],
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setNewTaskSkills([]);
  };

  // Delete task
  const handleDeleteTask = (taskId: number) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  // Final Launch Action
  const handleLaunchProject = () => {
    createProject({
      name: projectName,
      category: projectCategory,
      description: projectDescription,
      skills,
      workers,
      tasks,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 5, 16, 0.88)',
        backdropFilter: 'blur(12px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        className="glass"
        style={{
          width: '95%',
          maxWidth: 960,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 16,
          border: '1px solid rgba(0, 243, 255, 0.3)',
          boxShadow: '0 0 50px rgba(0, 243, 255, 0.15)',
          background: 'rgba(10, 12, 28, 0.95)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(0, 243, 255, 0.08), rgba(168, 85, 247, 0.08))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(0, 243, 255, 0.15)',
                border: '1px solid var(--neon-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--neon-cyan)',
              }}
            >
              <Briefcase size={20} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: '#fff', letterSpacing: '0.5px' }}>
                PROJECT & SKILL CONFIGURATION WIZARD
              </h2>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Define project domain skills, team size, and let the AI assign tasks based on member skill proficiencies
              </p>
            </div>
          </div>

          <button
            onClick={() => setProjectModalOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Wizard Steps Indicator */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'rgba(0, 0, 0, 0.25)',
          }}
        >
          {[
            { num: 1, label: '1. Project & Skills', icon: Briefcase },
            { num: 2, label: '2. Team Size & Worker Skills', icon: Users },
            { num: 3, label: '3. Task Backlog & AI Review', icon: Layers },
          ].map((s) => {
            const active = step === s.num;
            const completed = step > s.num;
            return (
              <button
                key={s.num}
                onClick={() => setStep(s.num as any)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: active ? 'rgba(0, 243, 255, 0.08)' : 'transparent',
                  border: 'none',
                  borderBottom: active ? '2px solid var(--neon-cyan)' : '2px solid transparent',
                  color: active ? 'var(--neon-cyan)' : completed ? 'var(--neon-green)' : 'var(--text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.5px',
                  transition: 'all 0.2s',
                }}
              >
                {completed ? <CheckCircle2 size={14} color="var(--neon-green)" /> : <s.icon size={14} />}
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body (Scrollable) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {/* STEP 1: PROJECT & SKILLS */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Presets / Templates */}
              <div>
                <label style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--neon-cyan)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 8, display: 'block' }}>
                  ⚡ Quick Start Templates
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                  {PROJECT_TEMPLATES.map((tpl) => {
                    const isSelected = selectedTemplateId === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => applyTemplate(tpl)}
                        style={{
                          padding: 14,
                          borderRadius: 10,
                          background: isSelected ? 'rgba(0, 243, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '1px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: isSelected ? 'var(--neon-cyan)' : '#fff' }}>
                            {tpl.name}
                          </span>
                          <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-secondary)' }}>
                            {tpl.teamSize} Workers
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.4 }}>
                          {tpl.description}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {tpl.skills.slice(0, 4).map(s => (
                            <span key={s} style={{ fontSize: 9, background: 'rgba(0,243,255,0.08)', color: 'var(--neon-cyan)', padding: '1px 5px', borderRadius: 3 }}>
                              {s}
                            </span>
                          ))}
                          {tpl.skills.length > 4 && (
                            <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>+{tpl.skills.length - 4} more</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Project Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      fontSize: 13,
                      outline: 'none',
                    }}
                    placeholder="e.g. Autonomous AI Drone Swarm"
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    Category / Domain
                  </label>
                  <input
                    type="text"
                    value={projectCategory}
                    onChange={(e) => setProjectCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      fontSize: 13,
                      outline: 'none',
                    }}
                    placeholder="e.g. Robotics & Cloud"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Project Description
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    fontSize: 12,
                    outline: 'none',
                    resize: 'none',
                  }}
                  placeholder="Summary of project goals and objectives"
                />
              </div>

              {/* Required Skills Pool */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--neon-purple)', fontWeight: 700, letterSpacing: '0.5px' }}>
                    🎯 Project Required Skill Pool ({skills.length})
                  </label>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                    Skills used by the AI to match tasks to workers
                  </span>
                </div>

                {/* Selected Skills Chips */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    padding: 12,
                    borderRadius: 8,
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    minHeight: 48,
                    marginBottom: 10,
                  }}
                >
                  {skills.map((s) => (
                    <span
                      key={s}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: 'rgba(168, 85, 247, 0.15)',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        color: '#d8b4fe',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {s}
                      <button
                        onClick={() => handleRemoveSkill(s)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#d8b4fe',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {skills.length === 0 && (
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', alignSelf: 'center' }}>
                      No skills added yet. Add skills below or select from suggestions.
                    </span>
                  )}
                </div>

                {/* Add Custom Skill & Quick Suggestions */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    type="text"
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill(customSkillInput);
                      }
                    }}
                    placeholder="Type custom skill (e.g. Solidity, Rust, Docker) and press Enter"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      fontSize: 12,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => handleAddSkill(customSkillInput)}
                    className="btn-neon blue"
                    style={{ padding: '8px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                  >
                    <Plus size={14} /> Add Skill
                  </button>
                </div>

                {/* Quick Add Suggestions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', marginRight: 4 }}>Suggestions:</span>
                  {POPULAR_SKILLS.filter(s => !skills.includes(s)).slice(0, 8).map(s => (
                    <button
                      key={s}
                      onClick={() => handleAddSkill(s)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'var(--text-secondary)',
                        fontSize: 10,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: TEAM SIZE & WORKER SKILLS */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Team Size Controller */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 16,
                  borderRadius: 10,
                  background: 'rgba(0, 243, 255, 0.05)',
                  border: '1px solid rgba(0, 243, 255, 0.2)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={16} color="var(--neon-cyan)" />
                    Team Roster Size: <span style={{ color: 'var(--neon-cyan)' }}>{teamSize} People</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Assign unique skills to each team member. The AI will evaluate each person's skills for task matches.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={handleAutoBalanceSkills}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 6,
                      background: 'rgba(168, 85, 247, 0.2)',
                      border: '1px solid rgba(168, 85, 247, 0.5)',
                      color: '#d8b4fe',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    title="Evenly distribute project skills across the team"
                  >
                    <Shuffle size={13} /> Auto-Balance Skills
                  </button>

                  <div style={{ display: 'flex', gap: 4 }}>
                    {[2, 3, 4, 5, 6].map(num => (
                      <button
                        key={num}
                        onClick={() => handleTeamSizeChange(num)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          background: teamSize === num ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.08)',
                          color: teamSize === num ? '#000' : '#fff',
                          fontWeight: 700,
                          fontSize: 12,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Workers Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                {workers.map((worker) => (
                  <div
                    key={worker.id}
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    {/* Worker Profile Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{worker.avatar}</span>
                      <div style={{ flex: 1 }}>
                        <input
                          type="text"
                          value={worker.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWorkers(workers.map(w => w.id === worker.id ? { ...w, name: val } : w));
                          }}
                          style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px solid rgba(255,255,255,0.15)',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: 13,
                            padding: '2px 0',
                            outline: 'none',
                          }}
                        />
                        <input
                          type="text"
                          value={worker.role || 'Software Engineer'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWorkers(workers.map(w => w.id === worker.id ? { ...w, role: val } : w));
                          }}
                          style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            fontSize: 10,
                            padding: '1px 0',
                            outline: 'none',
                          }}
                        />
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--neon-green)', fontWeight: 600 }}>
                        {worker.productivity}% Prod
                      </div>
                    </div>

                    {/* Skill Tags for this Worker */}
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 6, fontWeight: 600 }}>
                        ASSIGNED SKILLS ({worker.skills.length}):
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {skills.map((skillName) => {
                          const isAssigned = worker.skills.includes(skillName);
                          return (
                            <button
                              key={skillName}
                              onClick={() => toggleWorkerSkill(worker.id, skillName)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: isAssigned ? 700 : 400,
                                background: isAssigned ? 'rgba(0, 243, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                                border: isAssigned ? '1px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
                                color: isAssigned ? 'var(--neon-cyan)' : 'var(--text-dim)',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                              }}
                            >
                              {isAssigned ? '✓ ' : '+ '}{skillName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: TASK BACKLOG & AI REVIEW */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* AI Allocation Preview Banner */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 10,
                  background: 'linear-gradient(90deg, rgba(0, 243, 255, 0.1), rgba(168, 85, 247, 0.1))',
                  border: '1px solid rgba(0, 243, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Sparkles size={24} color="var(--neon-cyan)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>
                      AI Task Allocation Engine Ready
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      Tasks will be matched to {workers.length} workers based on required skill overlap and Lean WIP balance.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, background: 'rgba(0, 255, 136, 0.15)', color: 'var(--neon-green)', padding: '4px 8px', borderRadius: 4, fontWeight: 700 }}>
                    {tasks.length} Total Tasks
                  </span>
                </div>
              </div>

              {/* Add New Task Quick Bar */}
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neon-cyan)', textTransform: 'uppercase' }}>
                  + Add Custom Task to Backlog
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Task Title (e.g. Implement GraphQL Caching)"
                    style={{
                      flex: 2,
                      minWidth: 200,
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      fontSize: 12,
                      outline: 'none',
                    }}
                  />

                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: 'rgba(10, 10, 25, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      fontSize: 12,
                      outline: 'none',
                    }}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Priority</option>
                  </select>

                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newTaskHours}
                    onChange={(e) => setNewTaskHours(Number(e.target.value))}
                    style={{
                      width: 70,
                      padding: '8px 8px',
                      borderRadius: 6,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      fontSize: 12,
                      outline: 'none',
                      textAlign: 'center',
                    }}
                    title="Estimated Hours"
                  />

                  <button
                    onClick={handleAddTask}
                    className="btn-neon green"
                    style={{ padding: '8px 16px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Plus size={14} /> Add Task
                  </button>
                </div>

                {/* Pick Required Skills for New Task */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Required Skills:</span>
                  {skills.map(s => {
                    const sel = newTaskSkills.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => {
                          setNewTaskSkills(sel ? newTaskSkills.filter(x => x !== s) : [...newTaskSkills, s]);
                        }}
                        style={{
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 10,
                          background: sel ? 'var(--neon-purple)' : 'rgba(255,255,255,0.05)',
                          color: sel ? '#fff' : 'var(--text-secondary)',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {sel ? '✓ ' : '+ '}{s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Task List Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#fff', marginBottom: 4 }}>
                        {task.title}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 700, color: task.priority === 'critical' ? 'var(--neon-red)' : task.priority === 'high' ? 'var(--neon-orange)' : 'var(--neon-blue)' }}>
                          {task.priority}
                        </span>
                        <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>• {task.estimated_time}h</span>
                        <span style={{ fontSize: 9, color: 'var(--neon-green)' }}>• +{task.xp_reward} XP</span>
                        {task.required_skills?.map(rs => (
                          <span key={rs} style={{ fontSize: 9, background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe', padding: '1px 5px', borderRadius: 3 }}>
                            {rs}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--neon-red)',
                        cursor: 'pointer',
                        padding: 6,
                        borderRadius: 4,
                        opacity: 0.7,
                      }}
                      title="Delete task"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          {step > 1 ? (
            <button
              onClick={() => setStep((step - 1) as any)}
              className="btn-neon blue"
              style={{ padding: '10px 18px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((step + 1) as any)}
              className="btn-neon cyan"
              style={{ padding: '10px 22px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            >
              Continue to Step {step + 1} <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleLaunchProject}
              className="btn-neon green"
              style={{
                padding: '12px 28px',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                boxShadow: '0 0 25px rgba(0, 255, 136, 0.4)',
              }}
            >
              <Wand2 size={16} />
              LAUNCH PROJECT & AUTO-ASSIGN WITH AI
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
