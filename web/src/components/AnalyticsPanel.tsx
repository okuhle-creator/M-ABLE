import { Activity, BookOpen, CheckCircle2, Flame, TrendingUp } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { historyStore } from '../lib/history-store';
import { ASL_CATEGORIES, learningStore } from '../lib/learning-store';
import type { SignLabel } from '../ml/meta';
import { Badge, Card, ProgressBar, SectionHeader, StatCard } from './ui';

export function AnalyticsPanel({ labels }: { labels: readonly SignLabel[] }) {
  const learningState = useSyncExternalStore(learningStore.subscribe, learningStore.getSnapshot);
  const conversationHistory = useSyncExternalStore(historyStore.subscribe, () =>
    historyStore.getAll(),
  );

  const totalShipped = labels.filter((l) => l.shipped).length;
  const progressList = Object.values(learningState.progress);
  const totalPracticed = progressList.length;
  const totalMastered = progressList.filter((p) => p.mastered).length;

  const totalPracticeSessions = progressList.reduce((acc, p) => acc + p.attempts, 0);

  // Category completion rates
  const categoryStats = ASL_CATEGORIES.map((cat) => {
    const totalInCat = cat.signs.length;
    const masteredInCat = cat.signs.filter(
      (s) => learningState.progress[s.toLowerCase()]?.mastered,
    ).length;
    const practicedInCat = cat.signs.filter((s) => learningState.progress[s.toLowerCase()]).length;
    const percent = Math.round((masteredInCat / totalInCat) * 100);

    return {
      category: cat.title,
      total: totalInCat,
      mastered: masteredInCat,
      practiced: practicedInCat,
      percent,
    };
  });

  // Recent practice attempts
  const recentPractices = [...progressList]
    .sort((a, b) => b.lastPracticed - a.lastPracticed)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl flex items-center gap-2.5">
          <Activity className="size-6 text-accent" />
          Learning Analytics & Insights
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Objective progress metrics computed strictly from your local camera interactions and quiz
          results.
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Signs Practiced"
          value={`${totalPracticed} / ${totalShipped}`}
          description={`${Math.round((totalPracticed / totalShipped) * 100)}% of ASL vocabulary`}
          icon={BookOpen}
        />
        <StatCard
          label="Signs Mastered"
          value={totalMastered}
          description="High confidence on 2+ attempts"
          icon={CheckCircle2}
        />
        <StatCard
          label="Total Camera Takes"
          value={totalPracticeSessions}
          description="Gesture sequence evaluations"
          icon={TrendingUp}
        />
        <StatCard
          label="Learning Streak"
          value={`${learningState.streakDays} Days`}
          description="Active consecutive days"
          icon={Flame}
        />
      </div>

      {/* Category Mastery Breakdown */}
      <Card className="p-5 space-y-4">
        <SectionHeader
          title="Curriculum Mastery by Category"
          description="Percentage of verified signs mastered per functional vocabulary module"
        />

        <div className="space-y-4 pt-2">
          {categoryStats.map((stat) => (
            <div key={stat.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink">{stat.category}</span>
                <span className="text-ink-muted">
                  {stat.mastered} of {stat.total} Mastered ({stat.percent}%)
                </span>
              </div>
              <ProgressBar
                value={stat.percent}
                showPercent={false}
                barClassName={stat.percent >= 80 ? 'bg-success' : 'bg-accent'}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Two Column Section: Recent Practice & Conversation Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Signs Practiced */}
        <Card className="p-5 space-y-4">
          <SectionHeader
            title="Recent Camera Practice"
            description="Latest signs evaluated with real-time model confidence"
          />

          {recentPractices.length === 0 ? (
            <p className="text-xs text-ink-muted py-6 text-center">
              No practice records yet. Launch Practice mode with your camera!
            </p>
          ) : (
            <div className="space-y-2">
              {recentPractices.map((rec) => (
                <div
                  key={rec.sign}
                  className="flex items-center justify-between p-2.5 rounded-md border border-line bg-surface-muted/30 text-xs"
                >
                  <div>
                    <span className="font-bold text-ink capitalize">{rec.sign}</span>
                    <span className="text-ink-muted ml-2 font-mono">
                      {rec.attempts} {rec.attempts === 1 ? 'attempt' : 'attempts'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-ink">
                      {Math.round(rec.bestScore * 100)}%
                    </span>
                    {rec.mastered && (
                      <Badge variant="success" className="text-[10px]">
                        Mastered
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Communication History Summary */}
        <Card className="p-5 space-y-4">
          <SectionHeader
            title="Communication Activity"
            description="Conversation transcripts and vocalized sentences"
          />

          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-line bg-surface flex items-center justify-between text-xs">
              <span className="font-medium text-ink">Sentences Constructed & Spoken</span>
              <span className="font-bold font-mono text-ink text-sm">
                {conversationHistory.length}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-line bg-surface flex items-center justify-between text-xs">
              <span className="font-medium text-ink">Vocabulary Bookmarks</span>
              <span className="font-bold font-mono text-ink text-sm">
                {learningState.bookmarkedSigns.length}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-line bg-surface flex items-center justify-between text-xs">
              <span className="font-medium text-ink">Quizzes Completed</span>
              <span className="font-bold font-mono text-ink text-sm">
                {learningState.quizzes.length}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
