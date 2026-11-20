/**
 * ASL Learning Curriculum & Progress Store
 * Local-first tracking of sign mastery, categories, quizzes, and daily challenges.
 */

export interface LessonCategory {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  signs: string[];
}

export const ASL_CATEGORIES: LessonCategory[] = [
  {
    id: 'greetings',
    title: 'Greetings & Politeness',
    description: 'Essential everyday conversational openers and social signs.',
    difficulty: 'Beginner',
    signs: ['hello', 'please', 'thankyou', 'yes', 'no', 'fine', 'good', 'morning'],
  },
  {
    id: 'emergency',
    title: 'Emergency & Healthcare',
    description: 'Urgent assistance, medical concerns, and symptom indicators.',
    difficulty: 'Beginner',
    signs: ['help', 'hurt', 'sick', 'doctor', 'hospital', 'fire', 'call', 'wait'],
  },
  {
    id: 'family',
    title: 'Family & Relationships',
    description: 'Key kinship terms, social connections, and community members.',
    difficulty: 'Beginner',
    signs: ['family', 'mother', 'father', 'brother', 'sister', 'boy', 'girl', 'baby'],
  },
  {
    id: 'everyday',
    title: 'Daily Living & Needs',
    description: 'Vital sustenance, basic physical states, and immediate desires.',
    difficulty: 'Intermediate',
    signs: ['water', 'eat', 'drink', 'food', 'sleep', 'home', 'go', 'want', 'like'],
  },
  {
    id: 'actions',
    title: 'Actions & Verbs',
    description: 'Dynamic movement verbs and common directional interactions.',
    difficulty: 'Intermediate',
    signs: ['hear', 'talk', 'look', 'see', 'find', 'give', 'make', 'play', 'work'],
  },
  {
    id: 'questions',
    title: 'Questions & Clarifications',
    description: 'Interrogatives and communication management signs.',
    difficulty: 'Advanced',
    signs: ['who', 'what', 'where', 'when', 'why', 'how', 'many'],
  },
];

export interface SignProgress {
  sign: string;
  attempts: number;
  bestScore: number;
  lastPracticed: number;
  mastered: boolean;
}

export interface QuizResult {
  id: string;
  category: string;
  totalQuestions: number;
  correctAnswers: number;
  timestamp: number;
}

export interface LearningState {
  progress: Record<string, SignProgress>;
  bookmarkedSigns: string[];
  quizzes: QuizResult[];
  streakDays: number;
  lastActiveDate: string;
}

const STORAGE_KEY = 'm_able_learning_v1';

const DEFAULT_STATE: LearningState = {
  progress: {},
  bookmarkedSigns: ['hello', 'thankyou', 'help'],
  quizzes: [],
  streakDays: 1,
  lastActiveDate: new Date().toISOString().slice(0, 10),
};

export class LearningStore {
  private state: LearningState = { ...DEFAULT_STATE };
  private listeners = new Set<() => void>();

  constructor() {
    this.load();
    this.updateStreak();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<LearningState>;
        this.state = {
          ...DEFAULT_STATE,
          ...parsed,
          progress: parsed.progress ?? {},
          bookmarkedSigns: parsed.bookmarkedSigns ?? DEFAULT_STATE.bookmarkedSigns,
          quizzes: parsed.quizzes ?? [],
        };
      }
    } catch {
      this.state = { ...DEFAULT_STATE };
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Storage restricted
    }
    this.notify();
  }

  private updateStreak(): void {
    const today = new Date().toISOString().slice(0, 10);
    if (this.state.lastActiveDate !== today) {
      const lastDate = new Date(this.state.lastActiveDate);
      const now = new Date(today);
      const diffDays = Math.round((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        this.state.streakDays += 1;
      } else if (diffDays > 1) {
        this.state.streakDays = 1;
      }
      this.state.lastActiveDate = today;
      this.persist();
    }
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): LearningState => this.state;

  recordPractice(sign: string, score: number): void {
    const existing = this.state.progress[sign] ?? {
      sign,
      attempts: 0,
      bestScore: 0,
      lastPracticed: 0,
      mastered: false,
    };

    const newBest = Math.max(existing.bestScore, score);
    const mastered = newBest >= 0.75 && existing.attempts >= 2;

    this.state.progress = {
      ...this.state.progress,
      [sign]: {
        sign,
        attempts: existing.attempts + 1,
        bestScore: newBest,
        lastPracticed: Date.now(),
        mastered,
      },
    };
    this.persist();
  }

  toggleBookmark(sign: string): boolean {
    const lower = sign.toLowerCase();
    const exists = this.state.bookmarkedSigns.includes(lower);
    if (exists) {
      this.state.bookmarkedSigns = this.state.bookmarkedSigns.filter((s) => s !== lower);
    } else {
      this.state.bookmarkedSigns = [...this.state.bookmarkedSigns, lower];
    }
    this.persist();
    return !exists;
  }

  isBookmarked(sign: string): boolean {
    return this.state.bookmarkedSigns.includes(sign.toLowerCase());
  }

  recordQuiz(category: string, totalQuestions: number, correctAnswers: number): void {
    const result: QuizResult = {
      id: `quiz-${Date.now()}`,
      category,
      totalQuestions,
      correctAnswers,
      timestamp: Date.now(),
    };
    this.state.quizzes = [result, ...this.state.quizzes].slice(0, 30);
    this.persist();
  }

  getSignOfTheDay(shippedSigns: string[]): string {
    if (!shippedSigns.length) return 'hello';
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24),
    );
    return shippedSigns[dayOfYear % shippedSigns.length] ?? 'hello';
  }
}

export const learningStore = new LearningStore();
