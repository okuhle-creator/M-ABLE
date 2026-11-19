import { ExternalLink, GraduationCap, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { dictionaryUrl, type SignLabel } from '../ml/meta';
import { Badge, Card, Percent } from './ui';

export function SignDictionary({
  labels,
  onPracticeSign,
}: {
  labels: readonly SignLabel[];
  onPracticeSign?: (index: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string>('All');
  const [onlyShipped, setOnlyShipped] = useState(true);

  // Alphabet letters present in the vocabulary
  const alphabet = useMemo(() => {
    const letters = new Set<string>();
    for (const l of labels) {
      const first = l.label.charAt(0).toUpperCase();
      if (/[A-Z]/.test(first)) letters.add(first);
    }
    return ['All', ...Array.from(letters).sort()];
  }, [labels]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return labels.filter((item) => {
      if (onlyShipped && !item.shipped) return false;
      if (selectedLetter !== 'All') {
        if (!item.label.toUpperCase().startsWith(selectedLetter)) return false;
      }
      if (q) {
        return (
          item.label.toLowerCase().includes(q) ||
          item.sign.toLowerCase().includes(q) ||
          item.lookup.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [labels, query, selectedLetter, onlyShipped]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-ink">Sign Dictionary</h2>
          <span className="text-xs font-mono text-ink-muted">
            {filtered.length} of {labels.length} isolated ASL signs
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-muted max-w-2xl leading-relaxed">
          The complete verified vocabulary supported by M-ABLE’s on-device neural model, trained on
          the Google Isolated Sign Language Recognition corpus. Each sign links to verified external
          reference demonstrations.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-subtle pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            placeholder="Search sign vocabulary (e.g. hello, water, thank you)..."
            className="w-full rounded-md border border-line bg-surface pl-9 pr-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-accent focus:outline-none"
          />
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-ink-muted cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={onlyShipped}
            onChange={(e) => {
              setOnlyShipped(e.target.checked);
            }}
            className="rounded border-line accent-accent"
          />
          <span>Shipped models only</span>
        </label>
      </div>

      {/* Alphabet Quick Filter */}
      <div className="flex flex-wrap gap-1">
        {alphabet.map((letter) => (
          <button
            key={letter}
            type="button"
            onClick={() => {
              setSelectedLetter(letter);
            }}
            className={`cursor-pointer rounded px-2 py-1 text-xs font-mono font-medium transition-colors ${
              selectedLetter === letter
                ? 'bg-accent text-accent-ink'
                : 'bg-surface-muted text-ink-muted hover:bg-surface-hover'
            }`}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Signs Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line p-8 text-center text-sm text-ink-muted">
          No signs matched your search criteria. Try a different search term or letter.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <Card
              key={item.index}
              className="p-4 flex flex-col justify-between hover:border-accent-border transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold tracking-tight text-ink">{item.label}</h3>
                  <span className="text-xs font-mono text-ink-subtle">#{item.index}</span>
                </div>
                {item.heldOutTop1 !== null ? (
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge variant={item.heldOutTop1 >= 0.75 ? 'success' : 'neutral'}>
                      <Percent value={item.heldOutTop1} /> test accuracy
                    </Badge>
                  </div>
                ) : (
                  <div className="mt-1">
                    <Badge variant="neutral">Untrained benchmark</Badge>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-line/50 text-xs">
                <a
                  href={dictionaryUrl(item)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                >
                  Demonstration
                  <ExternalLink className="size-3" />
                </a>

                {onPracticeSign ? (
                  <button
                    type="button"
                    onClick={() => {
                      onPracticeSign(item.index);
                    }}
                    className="cursor-pointer inline-flex items-center gap-1 font-medium text-ink-muted hover:text-ink"
                  >
                    <GraduationCap className="size-3.5" />
                    Practise
                  </button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
