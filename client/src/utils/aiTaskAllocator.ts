import { Task, Worker } from '../store/gameStore';

export interface AllocationResult {
  taskId: number;
  workerId: number;
  matchScore: number; // 0 to 100
  reason: string;
  matchedSkills: string[];
}

/**
 * Intelligent AI Task Allocator
 * Allocates tasks to workers based on:
 * 1. Skill synergy (overlap between task required_skills and worker skills)
 * 2. Workload balance (Heijunka principle - avoid overloading workers)
 * 3. Worker experience & productivity alignment with task difficulty
 */
export function allocateTasksWithAI(
  tasks: Task[],
  workers: Worker[]
): { updatedTasks: Task[]; allocations: AllocationResult[] } {
  if (!workers.length || !tasks.length) {
    return { updatedTasks: tasks, allocations: [] };
  }

  // Clone workers with a tracking workload counter for fair distribution
  const workerLoads = workers.map(w => ({
    id: w.id,
    name: w.name,
    avatar: w.avatar,
    skills: (w.skills || []).map(s => s.toLowerCase().trim()),
    experience: w.experience || 1,
    productivity: w.productivity || 80,
    assignedCount: 0,
    estimatedHoursAssigned: 0,
  }));

  const allocations: AllocationResult[] = [];
  const updatedTasks: Task[] = [];

  // Sort tasks to allocate higher priority & harder tasks first
  const priorityWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  const sortedTasks = [...tasks].sort((a, b) => {
    const pDiff = (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
    if (pDiff !== 0) return pDiff;
    return (b.difficulty || 1) - (a.difficulty || 1);
  });

  for (const task of sortedTasks) {
    const requiredSkills = (task.required_skills || []).map(s => s.toLowerCase().trim());
    
    // Evaluate every worker for this task
    let bestWorker = workerLoads[0];
    let highestScore = -1;
    let bestMatchedSkills: string[] = [];
    let bestReason = '';

    for (const w of workerLoads) {
      // 1. Skill Match (50% weight)
      let matched: string[] = [];
      let skillMatchRatio = 0.5; // Baseline if no required skills specified

      if (requiredSkills.length > 0) {
        matched = requiredSkills.filter(req => 
          w.skills.some(ws => ws.includes(req) || req.includes(ws))
        );
        skillMatchRatio = matched.length / requiredSkills.length;
      } else {
        // Fallback: check if worker has domain skills related to task type/title
        const titleLower = task.title.toLowerCase();
        matched = w.skills.filter(ws => titleLower.includes(ws));
        skillMatchRatio = matched.length > 0 ? 0.9 : 0.6;
      }

      // 2. Workload & WIP Leveling (30% weight)
      // Penalize heavily loaded workers
      const loadPenalty = Math.min(w.assignedCount * 18 + w.estimatedHoursAssigned * 3, 60);
      const workloadScore = Math.max(0, 100 - loadPenalty);

      // 3. Experience & Difficulty Alignment (20% weight)
      const diffAlign = 100 - Math.abs((w.experience * 1.5) - (task.difficulty || 2)) * 15;
      const experienceScore = Math.max(20, Math.min(100, diffAlign));

      // Composite Score (0 - 100)
      const compositeScore = Math.round(
        (skillMatchRatio * 100 * 0.50) +
        (workloadScore * 0.30) +
        (experienceScore * 0.20)
      );

      if (compositeScore > highestScore) {
        highestScore = compositeScore;
        bestWorker = w;
        bestMatchedSkills = matched.length > 0 ? matched : [w.skills[0] || 'General'];
      }
    }

    // Build transparent AI reasoning
    const skillListStr = bestMatchedSkills.join(', ');
    if (bestMatchedSkills.length > 0 && requiredSkills.length > 0) {
      bestReason = `Skill match (${skillListStr}) + optimal workload capacity (${bestWorker.assignedCount} active tasks).`;
    } else {
      bestReason = `Optimal capacity and balanced flow distribution for ${bestWorker.name}.`;
    }

    // Update worker load
    bestWorker.assignedCount += 1;
    bestWorker.estimatedHoursAssigned += task.estimated_time || 2;

    const allocationResult: AllocationResult = {
      taskId: task.id,
      workerId: bestWorker.id,
      matchScore: Math.min(100, Math.max(40, highestScore)),
      reason: bestReason,
      matchedSkills: bestMatchedSkills,
    };

    allocations.push(allocationResult);

    updatedTasks.push({
      ...task,
      worker_id: bestWorker.id,
      match_score: allocationResult.matchScore,
      ai_assignment_reason: allocationResult.reason,
    });
  }

  // Restore original ordering of tasks by ID
  updatedTasks.sort((a, b) => a.id - b.id);

  return { updatedTasks, allocations };
}

/**
 * Predefined project templates to accelerate setup
 */
export interface ProjectTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  skills: string[];
  teamSize: number;
  sampleTasks: Array<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    difficulty: number;
    estimated_time: number;
    required_skills: string[];
    xp_reward: number;
  }>;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'ai-saas',
    name: 'AI Analytics SaaS Platform',
    category: 'Full-Stack & Machine Learning',
    description: 'Build a multi-tenant cloud analytics dashboard with predictive AI engines.',
    skills: ['React', 'TypeScript', 'Node.js', 'Python', 'Machine Learning', 'DevOps', 'UI/UX Design', 'QA Testing'],
    teamSize: 4,
    sampleTasks: [
      { title: 'Design Modern Glassmorphism Dashboard', description: 'Create high fidelity wireframes and tokenized design system', priority: 'high', type: 'feature', difficulty: 3, estimated_time: 4, required_skills: ['UI/UX Design', 'React'], xp_reward: 80 },
      { title: 'Implement JWT Auth & Role Access Control', description: 'Secure user login, OAuth2, and tenant organization scopes', priority: 'critical', type: 'feature', difficulty: 2, estimated_time: 3, required_skills: ['Node.js', 'TypeScript'], xp_reward: 70 },
      { title: 'Train Predictive Churn ML Model', description: 'Develop gradient boosting model in Python with 90%+ precision', priority: 'high', type: 'feature', difficulty: 4, estimated_time: 6, required_skills: ['Python', 'Machine Learning'], xp_reward: 120 },
      { title: 'Setup Docker & Kubernetes CI/CD Pipeline', description: 'Automate build, lint, container test, and deploy to AWS', priority: 'medium', type: 'optimization', difficulty: 3, estimated_time: 4, required_skills: ['DevOps'], xp_reward: 85 },
      { title: 'End-to-End Cypress Integration Tests', description: 'Automate full test coverage for auth and dashboard widgets', priority: 'medium', type: 'quality', difficulty: 2, estimated_time: 3, required_skills: ['QA Testing', 'TypeScript'], xp_reward: 60 },
      { title: 'Optimize PostgreSQL Timescale Queries', description: 'Index metrics tables to achieve sub-50ms analytics rendering', priority: 'high', type: 'optimization', difficulty: 3, estimated_time: 3, required_skills: ['Node.js', 'DevOps'], xp_reward: 90 },
    ],
  },
  {
    id: 'fintech-app',
    name: 'NextGen Mobile Fintech App',
    category: 'Mobile & High Security',
    description: 'High-frequency payment processing, multi-currency crypto wallet, and fraud detection.',
    skills: ['Mobile/React Native', 'Security', 'Fintech Backend', 'PostgreSQL', 'UI/UX Design', 'DevOps'],
    teamSize: 3,
    sampleTasks: [
      { title: 'Biometric Login & Secure Enclave Keys', description: 'FaceID/Fingerprint authentication with encrypted token storage', priority: 'critical', type: 'feature', difficulty: 4, estimated_time: 5, required_skills: ['Mobile/React Native', 'Security'], xp_reward: 110 },
      { title: 'Zero-Latency Payment Gateway API', description: 'Idempotent webhook ledger for Stripe/UPI transaction routes', priority: 'high', type: 'feature', difficulty: 4, estimated_time: 5, required_skills: ['Fintech Backend', 'PostgreSQL'], xp_reward: 100 },
      { title: 'Interactive Financial Portfolio Charts', description: 'Smooth animated balance history and asset distribution view', priority: 'medium', type: 'feature', difficulty: 2, estimated_time: 3, required_skills: ['UI/UX Design', 'Mobile/React Native'], xp_reward: 65 },
      { title: 'Real-time Fraud Anomaly Detection Filter', description: 'Block suspicious foreign transactions automatically', priority: 'critical', type: 'feature', difficulty: 3, estimated_time: 4, required_skills: ['Security', 'Fintech Backend'], xp_reward: 95 },
      { title: 'PCI-DSS Compliance Security Audit', description: 'Verify end-to-end data encryption and run vulnerability scans', priority: 'high', type: 'quality', difficulty: 3, estimated_time: 4, required_skills: ['Security', 'DevOps'], xp_reward: 90 },
    ],
  },
  {
    id: 'ecommerce-hub',
    name: 'Global E-Commerce Marketplace',
    category: 'Web & Microservices',
    description: 'High-volume storefront with inventory sync, automated recommendations, and cart recovery.',
    skills: ['Frontend/Next.js', 'Microservices', 'Database Optimization', 'UI/UX Design', 'QA Testing'],
    teamSize: 4,
    sampleTasks: [
      { title: 'Build Checkout Flow with 1-Click Buy', description: 'Streamlined checkout modal reducing customer drop-off', priority: 'critical', type: 'feature', difficulty: 3, estimated_time: 4, required_skills: ['Frontend/Next.js', 'UI/UX Design'], xp_reward: 85 },
      { title: 'Distributed Inventory Reservation Lock', description: 'Redis distributed locks to prevent overselling on flash sales', priority: 'high', type: 'feature', difficulty: 4, estimated_time: 5, required_skills: ['Microservices', 'Database Optimization'], xp_reward: 105 },
      { title: 'SEO Optimized Product Detail Pages', description: 'Server-side rendered rich metadata and web-vitals score > 95', priority: 'medium', type: 'optimization', difficulty: 2, estimated_time: 3, required_skills: ['Frontend/Next.js'], xp_reward: 60 },
      { title: 'Automated Cart Recovery Email Trigger', description: 'Event-driven email pipeline for abandoned shopper sessions', priority: 'medium', type: 'feature', difficulty: 2, estimated_time: 2, required_skills: ['Microservices'], xp_reward: 55 },
      { title: 'Load Testing for 50,000 Concurrent Users', description: 'K6 performance stress testing on checkout endpoints', priority: 'high', type: 'quality', difficulty: 3, estimated_time: 4, required_skills: ['QA Testing', 'Database Optimization'], xp_reward: 80 },
    ],
  },
];
