import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Flame,
  GraduationCap,
  HelpCircle,
  Play,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import { ASL_CATEGORIES, learningStore, type LessonCategory } from '../lib/learning-store';
import { showToast } from '../lib/toast-store';
import { dictionaryUrl, type SignLabel } from '../ml/meta';
import { Badge, Button, Card, ProgressBar, StatCard } from './ui';

export function LearningCenter({
  labels,
  onLaunchPractice,
}: {
  labels: readonly SignLabel[];
  onLaunchPractice: (index: number) => void;
}) {
  const learningState = useSyncExternalStore(learningStore.subscribe, learningStore.getSnapshot);

  const initialCategory: LessonCategory = ASL_CATEGORIES[0] ?? {
    id: 'greetings',
    title: 'Greetings & Politeness',
    description: 'Essential everyday conversational openers and social signs.',
    difficulty: 'Beginner',
    signs: ['hello', 'please', 'thankyou'],
  };
  const [selectedCategory, setSelectedCategory] = useState<LessonCategory>(initialCategory);
  const [activeTab, setActiveTab] = useState<'curriculum' | 'quiz' | 'achievements'>('curriculum');

  // Quiz Mode State
  const [quizActive, setQuizActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);

  const shippedLabels = labels.filter((l) => l.shipped);
  const shippedNames = shippedLabels.map((l) => l.sign.toLowerCase());
  const signOfTheDay = learningStore.getSignOfTheDay(shippedNames);
  const signOfTheDayLabel = labels.find((l) => l.sign.toLowerCase() === signOfTheDay);

  // Generate 5 dynamic quiz questions based on current category
  const quizQuestions = selectedCategory.signs.slice(0, 5).map((signName) => {
    const correctSign = labels.find((l) => l.sign.toLowerCase() === signName.toLowerCase());
    // Pick 3 distractors
    const otherSigns = shippedLabels
      .filter((l) => l.sign.toLowerCase() !== signName.toLowerCase())
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = [correctSign, ...otherSigns].filter(Boolean).sort(() => Math.random() - 0.5);

    return {
      targetSign: correctSign,
      targetName: signName,
      options,
      correctIndex: options.findIndex((opt) => opt?.sign.toLowerCase() === signName.toLowerCase()),
    };
  });

  const handleStartQuiz = () => {
    setQuizActive(true);
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setQuizAnswered(null);
  };

  const handleSelectQuizAnswer = (optionIndex: number) => {
    if (quizAnswered !== null) return;
    setQuizAnswered(optionIndex);

    const q = quizQuestions[currentQuestionIndex];
    if (optionIndex === q?.correctIndex) {
      setQuizScore((s) => s + 1);
      showToast('Correct answer!', 'success');
    } else {
      showToast('Not quite! Check the correct sign above.', 'warn');
    }
  };

  const handleNextQuizQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setQuizAnswered(null);
    } else {
      // Finish quiz
      learningStore.recordQuiz(selectedCategory.title, quizQuestions.length, quizScore);
      showToast(`Quiz completed! You scored ${quizScore}/${quizQuestions.length}`, 'success');
      setQuizActive(false);
    }
  };

  // Stats calculation
  const totalMastered = Object.values(learningState.progress).filter((p) => p.mastered).length;
  const totalPracticed = Object.keys(learningState.progress).length;

  return (
    <div className="space-y-6">
      {/* Learning Center Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl flex items-center gap-2.5">
            <GraduationCap className="size-7 text-accent" />
            ASL Learning Centre
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Structured American Sign Language curriculum with real-time camera feedback and
            interactive assessment.
          </p>
        </div>

        {/* Quick Streak & Stats Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent" className="py-1 px-2.5 text-xs">
            <Flame className="size-3.5 text-warn inline mr-1" />
            {learningState.streakDays} Day Streak
          </Badge>
          <Badge variant="success" className="py-1 px-2.5 text-xs">
            <Trophy className="size-3.5 text-success inline mr-1" />
            {totalMastered} Mastered
          </Badge>
        </div>
      </div>

      {/* Hero: Sign of the Day Card */}
      <Card className="p-5 bg-gradient-to-br from-surface to-surface-muted/60 border-accent-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-lg bg-accent-soft text-accent border border-accent-border">
              <Calendar className="size-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-accent font-mono">
                Sign of the Day
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-ink capitalize">
                {signOfTheDayLabel?.label ?? signOfTheDay}
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Practice this verified ASL sign to maintain your daily streak.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {signOfTheDayLabel && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onLaunchPractice(signOfTheDayLabel.index);
                }}
              >
                <Play className="size-3.5" /> Practice with Camera
              </Button>
            )}
            {signOfTheDayLabel && (
              <a
                href={dictionaryUrl(signOfTheDayLabel)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-medium p-2"
              >
                <ExternalLink className="size-3.5" /> Reference Video
              </a>
            )}
          </div>
        </div>
      </Card>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-line gap-2">
        {(
          [
            ['curriculum', 'Structured Curricula', BookOpen],
            ['quiz', 'Interactive Quiz', HelpCircle],
            ['achievements', 'Progress & Streaks', Award],
          ] as const
        ).map(([tabId, label, Icon]) => (
          <button
            key={tabId}
            type="button"
            onClick={() => {
              setActiveTab(tabId);
              setQuizActive(false);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === tabId
                ? 'border-accent text-accent font-bold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: STRUCTURED CURRICULUM */}
      {activeTab === 'curriculum' && (
        <div className="space-y-6">
          {/* Category Selector Pills */}
          <div className="flex flex-wrap gap-2">
            {ASL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setQuizActive(false);
                }}
                className={`rounded-lg border px-3.5 py-2 text-xs font-medium text-left transition-all cursor-pointer ${
                  selectedCategory.id === cat.id
                    ? 'border-accent bg-accent-soft text-accent font-semibold shadow-xs'
                    : 'border-line bg-surface text-ink hover:bg-surface-muted'
                }`}
              >
                <div className="font-semibold">{cat.title}</div>
                <div className="text-[10px] text-ink-muted mt-0.5">{cat.difficulty}</div>
              </button>
            ))}
          </div>

          {/* Active Category Detail Card */}
          <Card className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-line">
              <div>
                <h3 className="text-lg font-bold text-ink">{selectedCategory.title}</h3>
                <p className="text-xs text-ink-muted mt-0.5">{selectedCategory.description}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleStartQuiz}>
                <HelpCircle className="size-4 text-accent" /> Test Yourself on This Category
              </Button>
            </div>

            {/* Signs Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {selectedCategory.signs.map((signName) => {
                const labelObj = labels.find(
                  (l) => l.sign.toLowerCase() === signName.toLowerCase(),
                );
                const progress = learningState.progress[signName.toLowerCase()];
                const isMastered = progress?.mastered;

                return (
                  <div
                    key={signName}
                    className="flex flex-col justify-between rounded-lg border border-line bg-surface p-3.5 hover:border-line-strong transition-all shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-ink capitalize">
                          {labelObj?.label ?? signName}
                        </span>
                        {isMastered ? (
                          <CheckCircle2 className="size-4 text-success" />
                        ) : progress?.attempts ? (
                          <span className="text-[10px] font-mono text-ink-muted">
                            {progress.attempts} tries
                          </span>
                        ) : (
                          <span className="text-[10px] text-ink-subtle">Unpracticed</span>
                        )}
                      </div>

                      {progress?.bestScore ? (
                        <div className="mt-2">
                          <ProgressBar
                            value={Math.round(progress.bestScore * 100)}
                            showPercent={false}
                            barClassName={isMastered ? 'bg-success' : 'bg-accent'}
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-line/60">
                      {labelObj ? (
                        <button
                          type="button"
                          onClick={() => {
                            onLaunchPractice(labelObj.index);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline cursor-pointer"
                        >
                          <Play className="size-3" /> Practice
                        </button>
                      ) : (
                        <span className="text-[10px] text-ink-muted">Custom</span>
                      )}

                      {labelObj && (
                        <a
                          href={dictionaryUrl(labelObj)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-ink-muted hover:text-ink inline-flex items-center gap-0.5"
                          title="View verified demonstration on Signing Savvy"
                        >
                          Video <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: INTERACTIVE QUIZ MODE */}
      {activeTab === 'quiz' && (
        <Card className="p-6 max-w-2xl mx-auto space-y-6">
          {!quizActive ? (
            <div className="text-center py-8 space-y-4">
              <div className="inline-flex p-4 rounded-full bg-accent-soft text-accent border border-accent-border">
                <HelpCircle className="size-8" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-ink">
                Test Your Knowledge: {selectedCategory.title}
              </h2>
              <p className="text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
                Test your sign recall across {selectedCategory.signs.length} signs in this category.
                Scores are saved to your local learning profile.
              </p>
              <Button variant="primary" size="lg" onClick={handleStartQuiz}>
                Start 5-Question Quiz
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
                <span>
                  Question {currentQuestionIndex + 1} of {quizQuestions.length}
                </span>
                <span>Category: {selectedCategory.title}</span>
              </div>

              <ProgressBar
                value={currentQuestionIndex + 1}
                max={quizQuestions.length}
                showPercent={false}
              />

              <div className="p-4 rounded-lg border border-line bg-surface-muted/40 text-center">
                <span className="text-xs uppercase tracking-wider text-ink-muted">
                  Which sign is this?
                </span>
                <p className="text-2xl font-bold tracking-tight text-ink mt-1 capitalize">
                  &ldquo;{quizQuestions[currentQuestionIndex]?.targetName}&rdquo;
                </p>
                <p className="text-xs text-ink-muted mt-1">
                  Select the correct sign meaning or category match below:
                </p>
              </div>

              {/* Options Grid */}
              <div className="grid gap-2.5 sm:grid-cols-2">
                {quizQuestions[currentQuestionIndex]?.options.map((opt, optIndex) => {
                  const isCorrect = optIndex === quizQuestions[currentQuestionIndex]?.correctIndex;
                  const isSelected = quizAnswered === optIndex;

                  let buttonStyle = 'border-line bg-surface hover:bg-surface-muted text-ink';
                  if (quizAnswered !== null) {
                    if (isCorrect) {
                      buttonStyle = 'border-success-border bg-success-soft text-success font-bold';
                    } else if (isSelected) {
                      buttonStyle = 'border-danger-border bg-danger-soft text-danger';
                    }
                  }

                  return (
                    <button
                      key={optIndex}
                      type="button"
                      onClick={() => {
                        handleSelectQuizAnswer(optIndex);
                      }}
                      disabled={quizAnswered !== null}
                      className={`p-3 rounded-lg border text-sm font-medium text-left transition-all cursor-pointer flex items-center justify-between ${buttonStyle}`}
                    >
                      <span className="capitalize">{opt?.label ?? opt?.sign}</span>
                      {quizAnswered !== null && isCorrect && (
                        <CheckCircle2 className="size-4 text-success shrink-0" />
                      )}
                      {quizAnswered !== null && isSelected && !isCorrect && (
                        <XCircle className="size-4 text-danger shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {quizAnswered !== null && (
                <div className="flex justify-end pt-2">
                  <Button variant="primary" size="md" onClick={handleNextQuizQuestion}>
                    {currentQuestionIndex < quizQuestions.length - 1
                      ? 'Next Question'
                      : 'Complete Quiz'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: ACHIEVEMENTS & PROGRESS */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Signs Practiced"
              value={totalPracticed}
              description="Unique ASL signs attempted via webcam"
              icon={BookOpen}
            />
            <StatCard
              label="Signs Mastered"
              value={totalMastered}
              description="High confidence on 2+ distinct sessions"
              icon={CheckCircle2}
            />
            <StatCard
              label="Active Streak"
              value={`${learningState.streakDays} Days`}
              description="Consistent daily learning habit"
              icon={Flame}
            />
          </div>

          <Card className="p-5 space-y-4">
            <div className="pb-3 border-b border-line">
              <h3 className="text-base font-bold text-ink">Quiz History</h3>
              <p className="text-xs text-ink-muted">Recent interactive assessment performance</p>
            </div>
            {learningState.quizzes.length === 0 ? (
              <p className="text-sm text-ink-muted">No quizzes completed yet. Take one above!</p>
            ) : (
              <div className="space-y-2">
                {learningState.quizzes.slice(0, 5).map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between p-3 rounded-md border border-line bg-surface text-sm"
                  >
                    <div>
                      <p className="font-semibold text-ink">{q.category}</p>
                      <p className="text-xs text-ink-muted">
                        {new Date(q.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={q.correctAnswers >= 4 ? 'success' : 'neutral'}>
                      {q.correctAnswers} / {q.totalQuestions} Correct
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
