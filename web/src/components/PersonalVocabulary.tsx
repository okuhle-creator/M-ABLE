import { Bookmark, ExternalLink, Layers, Play } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import { learningStore } from '../lib/learning-store';
import { showToast } from '../lib/toast-store';
import { dictionaryUrl, type SignLabel } from '../ml/meta';
import { Badge, Button, Card, EmptyState } from './ui';

export function PersonalVocabulary({
  labels,
  onPracticeSign,
}: {
  labels: readonly SignLabel[];
  onPracticeSign: (index: number) => void;
}) {
  const learningState = useSyncExternalStore(learningStore.subscribe, learningStore.getSnapshot);

  const [activeTab, setActiveTab] = useState<'bookmarks' | 'flashcards'>('bookmarks');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const bookmarkedSignObjects = labels.filter((l) =>
    learningState.bookmarkedSigns.includes(l.sign.toLowerCase()),
  );

  const handleNextFlashcard = () => {
    setShowAnswer(false);
    setFlashcardIndex((prev) => (prev + 1) % Math.max(1, bookmarkedSignObjects.length));
  };

  const handlePrevFlashcard = () => {
    setShowAnswer(false);
    setFlashcardIndex(
      (prev) =>
        (prev - 1 + bookmarkedSignObjects.length) % Math.max(1, bookmarkedSignObjects.length),
    );
  };

  const currentFlashcard = bookmarkedSignObjects[flashcardIndex];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl flex items-center gap-2.5">
            <Bookmark className="size-6 text-accent" />
            Personal Vocabulary & Flashcards
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Curate frequently used signs, study interactive flashcards, and practice custom
            gestures.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="accent">{bookmarkedSignObjects.length} Bookmarked Signs</Badge>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-line gap-2">
        {(
          [
            ['bookmarks', 'Saved Signs', Bookmark],
            ['flashcards', 'Flashcard Mode', Layers],
          ] as const
        ).map(([tabId, label, Icon]) => (
          <button
            key={tabId}
            type="button"
            onClick={() => {
              setActiveTab(tabId);
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

      {/* TAB 1: SAVED SIGNS GALLERY */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-4">
          {bookmarkedSignObjects.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="No bookmarked signs yet"
              description="Browse the Sign Dictionary and click the bookmark star to save signs to your personal vocabulary."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {bookmarkedSignObjects.map((sign) => {
                const progress = learningState.progress[sign.sign.toLowerCase()];

                return (
                  <Card key={sign.index} className="p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-bold text-ink capitalize">{sign.label}</h3>
                          <span className="text-xs text-ink-muted font-mono">
                            ASL Class #{sign.index}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            learningStore.toggleBookmark(sign.sign);
                            showToast(`Removed "${sign.label}" from personal vocabulary`, 'info');
                          }}
                          className="text-accent hover:text-danger p-1"
                          title="Remove from bookmarks"
                        >
                          <Bookmark className="size-4 fill-current" />
                        </button>
                      </div>

                      {progress ? (
                        <div className="mt-2 text-xs text-ink-muted">
                          <span>Best: {Math.round(progress.bestScore * 100)}%</span>
                          {progress.mastered && (
                            <Badge variant="success" className="ml-2 text-[10px]">
                              Mastered
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-ink-subtle">
                          Not yet practiced with camera
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-line/60">
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => {
                          onPracticeSign(sign.index);
                        }}
                      >
                        <Play className="size-3" /> Practice
                      </Button>
                      <a
                        href={dictionaryUrl(sign)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent hover:underline inline-flex items-center gap-1"
                      >
                        Video <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FLASHCARD STUDY MODE */}
      {activeTab === 'flashcards' && (
        <div className="max-w-xl mx-auto space-y-5">
          {bookmarkedSignObjects.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="Add signs to study flashcards"
              description="Save at least one sign in the dictionary to unlock flashcard study sessions."
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>
                  Card {flashcardIndex + 1} of {bookmarkedSignObjects.length}
                </span>
                <span>Click card to reveal sign details</span>
              </div>

              {/* Interactive Flip Card */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setShowAnswer(!showAnswer);
                }}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') setShowAnswer(!showAnswer);
                }}
                className="min-h-64 cursor-pointer rounded-xl border border-line bg-surface p-8 shadow-md flex flex-col items-center justify-center text-center transition-all hover:border-accent select-none"
              >
                {!showAnswer ? (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-accent font-mono">
                      Target Word
                    </span>
                    <h2 className="text-3xl font-bold tracking-tight text-ink capitalize">
                      {currentFlashcard?.label}
                    </h2>
                    <p className="text-xs text-ink-muted pt-4">
                      Think of how to sign this in ASL, then tap to reveal video & verification.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-success font-mono">
                      Sign Verification
                    </span>
                    <h2 className="text-2xl font-bold text-ink capitalize">
                      {currentFlashcard?.label}
                    </h2>
                    <p className="text-xs text-ink-muted">
                      Check your handshape, movement, and orientation.
                    </p>

                    <div className="flex items-center gap-3 pt-3">
                      {currentFlashcard && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPracticeSign(currentFlashcard.index);
                          }}
                        >
                          <Play className="size-3.5" /> Practice with Camera
                        </Button>
                      )}
                      {currentFlashcard && (
                        <a
                          href={dictionaryUrl(currentFlashcard)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-medium"
                        >
                          <ExternalLink className="size-3.5" /> Reference Video
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Flashcard Controls */}
              <div className="flex items-center justify-between">
                <Button variant="secondary" size="sm" onClick={handlePrevFlashcard}>
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowAnswer(!showAnswer);
                  }}
                >
                  {showAnswer ? 'Hide Details' : 'Reveal Details'}
                </Button>
                <Button variant="primary" size="sm" onClick={handleNextFlashcard}>
                  Next Card
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
