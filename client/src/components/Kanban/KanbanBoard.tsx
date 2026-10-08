import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useGameStore, Task, TaskStatus } from '../../store/gameStore';
import {
  Clock, Star, User, Zap, ChevronDown, ChevronUp, Layers,
  Sparkles, CheckCircle, Info, PlusCircle, RefreshCw
} from 'lucide-react';

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'backlog', title: 'Backlog', color: 'var(--text-dim)' },
  { id: 'todo', title: 'To Do', color: 'var(--neon-blue)' },
  { id: 'in-progress', title: 'In Progress', color: 'var(--neon-orange)' },
  { id: 'review', title: 'Review', color: 'var(--neon-purple)' },
  { id: 'done', title: 'Done', color: 'var(--neon-green)' },
];

const priorityColors: Record<string, string> = {
  low: '#888',
  medium: 'var(--neon-blue)',
  high: 'var(--neon-orange)',
  critical: 'var(--neon-red)',
};

const difficultyStars = (d: number) => '⭐'.repeat(Math.min(d, 5));

// Height of the board body (columns area)
const BOARD_HEIGHT = '35vh';
// How much of the header peeks above the viewport bottom when collapsed
const PEEK_HEIGHT = 36;

export const KanbanBoard: React.FC = () => {
  const { tasks, teamId, currentProject, autoAssignTasksWithAI, setProjectModalOpen } = useGameStore();
  const [hovered, setHovered] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentNotice, setAssignmentNotice] = useState<string | null>(null);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { destination, draggableId } = result;
    const taskId = Number(draggableId);
    const newStatus = destination.droppableId as TaskStatus;

    // Optimistic update
    useGameStore.getState().moveTask(taskId, newStatus);

    // Send to backend
    try {
      const res = await fetch(`/api/tasks/${taskId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, team_id: teamId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.xp_gained) useGameStore.getState().addXPPopup(data.xp_gained);
        if (data.simulation) useGameStore.getState().updateFromSimulation(data.simulation);
        if (data.recommendations?.length) useGameStore.getState().setRecommendations(data.recommendations);
      }
    } catch {
      // Local optimistic update already completed
    }
  };

  const handleAIAssign = () => {
    setIsAssigning(true);
    setTimeout(() => {
      const result = autoAssignTasksWithAI();
      setIsAssigning(false);
      setAssignmentNotice(`AI assigned ${result.assignedCount} tasks across team based on skill synergy!`);
      setTimeout(() => setAssignmentNotice(null), 4000);
    }, 600);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: hovered
          ? 'translateX(-50%) translateY(0)'
          : `translateX(-50%) translateY(calc(100% - ${PEEK_HEIGHT}px))`,
        width: '96%',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
        transition: 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)',
        pointerEvents: 'auto',
      }}
    >
      {/* Board Header Bar — always visible as the "tab" */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 14px',
          background: 'rgba(10, 12, 28, 0.92)',
          backdropFilter: 'blur(14px)',
          borderRadius: '10px 10px 0 0',
          border: '1px solid rgba(0, 243, 255, 0.28)',
          borderBottom: 'none',
          cursor: 'default',
          height: PEEK_HEIGHT,
          boxShadow: hovered
            ? '0 -4px 32px rgba(0, 243, 255, 0.18)'
            : '0 -2px 16px rgba(0, 243, 255, 0.08)',
          transition: 'box-shadow 0.35s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={14} color="var(--neon-cyan)" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '1px', color: 'var(--neon-cyan)', fontWeight: 700 }}>
              {currentProject?.name?.toUpperCase() || 'DIGITAL AI LEAN PLATFORM'}
            </span>
          </div>

          <span style={{ fontSize: 10, color: 'var(--text-dim)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4 }}>
            {tasks.length} TASKS • WIP LIMIT: 3
          </span>

          {assignmentNotice && (
            <span
              style={{
                fontSize: 11,
                color: 'var(--neon-green)',
                background: 'rgba(0, 255, 136, 0.15)',
                padding: '2px 10px',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontWeight: 600,
                border: '1px solid rgba(0, 255, 136, 0.3)',
                animation: 'pulse 1.5s infinite',
              }}
            >
              <CheckCircle size={12} /> {assignmentNotice}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Hover hint when collapsed */}
          {!hovered && (
            <span style={{
              fontSize: 9,
              color: 'var(--text-dim)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '1px',
              opacity: 0.7,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <ChevronUp size={11} /> HOVER TO EXPAND
            </span>
          )}

          {/* AI Auto Assign Button */}
          <button
            onClick={handleAIAssign}
            disabled={isAssigning}
            style={{
              background: 'linear-gradient(90deg, rgba(0, 243, 255, 0.2), rgba(168, 85, 247, 0.2))',
              border: '1px solid var(--neon-cyan)',
              color: 'var(--neon-cyan)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: 6,
              boxShadow: '0 0 12px rgba(0, 243, 255, 0.25)',
              transition: 'all 0.2s',
            }}
            title="Automatically assign tasks based on team member skills and capacity"
          >
            {isAssigning ? (
              <>
                <RefreshCw size={13} className="spin" />
                <span>AI MATCHING...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} color="var(--neon-cyan)" />
                <span>⚡ AI AUTO-ASSIGN TASKS</span>
              </>
            )}
          </button>

          {/* New Project Quick Button */}
          <button
            onClick={() => setProjectModalOpen(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 10,
              fontFamily: 'var(--font-display)',
              padding: '4px 10px',
              borderRadius: 6,
            }}
            title="Configure a new project or change team skills"
          >
            <PlusCircle size={12} />
            <span>PROJECT SETUP</span>
          </button>

          {/* Collapse chevron indicator */}
          <ChevronDown
            size={14}
            color="var(--text-dim)"
            style={{
              transform: hovered ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.35s ease',
            }}
          />
        </div>
      </div>

      {/* Columns Container */}
      <div style={{ height: BOARD_HEIGHT, display: 'flex', gap: 10 }}>
        <DragDropContext onDragEnd={onDragEnd}>
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="glass"
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  borderTop: `2px solid ${col.color}`,
                  background: 'rgba(10, 10, 22, 0.88)',
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: col.color, letterSpacing: '1px' }}>
                    {col.title}
                  </h4>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 'bold',
                      color: col.color,
                      background: `${col.color}20`,
                      padding: '1px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: 6,
                        background: snapshot.isDraggingOver ? `${col.color}12` : 'transparent',
                        transition: 'background 0.2s',
                      }}
                    >
                      {colTasks.map((task, index) => (
                        <TaskCard key={task.id} task={task} index={index} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </DragDropContext>
      </div>
    </div>
  );
};

const TaskCard: React.FC<{ task: Task; index: number }> = ({ task, index }) => {
  const { workers, assignTaskToWorker } = useGameStore();
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [showReason, setShowReason] = useState(false);

  const assignedWorker = workers.find((w) => w.id === task.worker_id);
  const pColor = priorityColors[task.priority] || 'var(--neon-blue)';

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            padding: '8px 10px',
            marginBottom: 6,
            background: snapshot.isDragging ? 'rgba(0,243,255,0.12)' : 'var(--bg-card)',
            border: `1px solid ${snapshot.isDragging ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.06)'}`,
            borderLeft: `3px solid ${pColor}`,
            borderRadius: 6,
            boxShadow: snapshot.isDragging ? '0 0 16px rgba(0,243,255,0.3)' : 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            cursor: 'grab',
            position: 'relative',
            ...provided.draggableProps.style,
          }}
        >
          {/* Title */}
          <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4, lineHeight: 1.3 }}>
            {task.title}
          </div>

          {/* Required Skills Chips */}
          {task.required_skills && task.required_skills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
              {task.required_skills.map((skill) => (
                <span
                  key={skill}
                  style={{
                    fontSize: 8,
                    fontWeight: 600,
                    padding: '1px 5px',
                    borderRadius: 3,
                    background: 'rgba(168, 85, 247, 0.18)',
                    color: '#d8b4fe',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Meta Info */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 9, color: 'var(--text-secondary)' }}>
            <span style={{ color: pColor, textTransform: 'uppercase', fontWeight: 700 }}>
              {task.priority}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Star size={9} /> {difficultyStars(task.difficulty)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Clock size={9} /> {task.estimated_time}h
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--neon-green)', fontWeight: 600 }}>
              <Zap size={9} /> +{task.xp_reward} XP
            </span>
          </div>

          {/* Assigned Worker / Reassignment Row */}
          <div
            style={{
              marginTop: 6,
              paddingTop: 4,
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {assignedWorker ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAssignDropdown(!showAssignDropdown);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 10,
                  color: 'var(--neon-cyan)',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: 4,
                  background: 'rgba(0, 243, 255, 0.08)',
                }}
                title="Click to reassign worker"
              >
                <span>{assignedWorker.avatar}</span>
                <span style={{ fontWeight: 600 }}>{assignedWorker.name}</span>
                {task.match_score && (
                  <span
                    style={{
                      fontSize: 8,
                      background: 'rgba(0, 255, 136, 0.2)',
                      color: 'var(--neon-green)',
                      padding: '1px 4px',
                      borderRadius: 3,
                      fontWeight: 700,
                    }}
                  >
                    ✨ {task.match_score}%
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAssignDropdown(!showAssignDropdown);
                }}
                style={{
                  background: 'none',
                  border: '1px dashed rgba(255, 255, 255, 0.2)',
                  color: 'var(--text-dim)',
                  fontSize: 9,
                  padding: '2px 6px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <User size={10} /> + Assign Member
              </button>
            )}

            {/* AI Explanation Tooltip Trigger */}
            {task.ai_assignment_reason && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReason(!showReason);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: 2,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="View AI Assignment Reasoning"
                >
                  <Info size={11} color="var(--neon-cyan)" />
                </button>

                {showReason && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      bottom: 20,
                      right: 0,
                      width: 220,
                      padding: 8,
                      borderRadius: 6,
                      background: 'rgba(10, 15, 35, 0.96)',
                      border: '1px solid var(--neon-cyan)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
                      zIndex: 30,
                      fontSize: 10,
                      color: '#fff',
                      lineHeight: 1.3,
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--neon-cyan)', marginBottom: 2 }}>
                      🤖 AI Skill Match Reason:
                    </div>
                    {task.ai_assignment_reason}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Assign Dropdown */}
          {showAssignDropdown && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 4,
                background: 'rgba(10, 15, 30, 0.98)',
                border: '1px solid rgba(0, 243, 255, 0.4)',
                borderRadius: 6,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
                zIndex: 40,
                padding: 4,
                maxHeight: 160,
                overflowY: 'auto',
              }}
            >
              <div style={{ fontSize: 9, color: 'var(--text-dim)', padding: '4px 6px', fontWeight: 700 }}>
                SELECT TEAM MEMBER:
              </div>
              {workers.map((w) => {
                // Calculate quick match overlap
                const reqs = task.required_skills || [];
                const overlap = reqs.filter(r => w.skills.some(ws => ws.toLowerCase().includes(r.toLowerCase())));
                const matchPct = reqs.length > 0 ? Math.round((overlap.length / reqs.length) * 100) : 75;

                return (
                  <div
                    key={w.id}
                    onClick={() => {
                      assignTaskToWorker(task.id, w.id);
                      setShowAssignDropdown(false);
                    }}
                    style={{
                      padding: '5px 8px',
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      fontSize: 10,
                      color: '#fff',
                      background: assignedWorker?.id === w.id ? 'rgba(0, 243, 255, 0.15)' : 'transparent',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{w.avatar}</span>
                      <span>{w.name}</span>
                    </span>
                    <span style={{ fontSize: 8, color: matchPct > 50 ? 'var(--neon-green)' : 'var(--text-dim)' }}>
                      {matchPct}% Fit
                    </span>
                  </div>
                );
              })}
              <div
                onClick={() => {
                  assignTaskToWorker(task.id, null);
                  setShowAssignDropdown(false);
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 9,
                  color: 'var(--neon-red)',
                  cursor: 'pointer',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  marginTop: 2,
                }}
              >
                ✕ Unassign Worker
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};
