import {
  Activity,
  Bookmark,
  BookOpen,
  Camera,
  Code2,
  GraduationCap,
  History,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Settings,
  User,
  X,
} from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import type { ModelState } from '../app/session';
import { profileStore } from '../lib/profile-store';
import { APP_NAME, APP_TAGLINE, REPO_URL } from '../links';
import { ProfileModal } from './ProfileModal';

export type ActiveView =
  | 'overview'
  | 'studio'
  | 'live'
  | 'learn'
  | 'vocabulary'
  | 'dictionary'
  | 'analytics'
  | 'history'
  | 'settings';

interface NavItem {
  id: ActiveView;
  label: string;
  icon: typeof Camera;
}

const PRIMARY_NAV: readonly NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'studio', label: 'Two-Way Studio', icon: MessageSquare },
  { id: 'live', label: 'Recognition', icon: Camera },
  { id: 'learn', label: 'Learn ASL', icon: GraduationCap },
  { id: 'vocabulary', label: 'Vocabulary', icon: Bookmark },
  { id: 'dictionary', label: 'Dictionary', icon: BookOpen },
  { id: 'analytics', label: 'Analytics', icon: Activity },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function SiteHeader({
  activeView,
  onChangeView,
  modelState,
}: {
  activeView: ActiveView;
  onChangeView: (view: ActiveView) => void;
  modelState: ModelState;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const profile = useSyncExternalStore(profileStore.subscribe, profileStore.getSnapshot);

  const modelStatusBadge = () => {
    if (modelState.status === 'ready') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted font-mono">
          <span className="size-2 rounded-full bg-emerald-600 inline-block" />
          Model Ready
        </span>
      );
    }
    if (modelState.status === 'loading') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted font-mono">
          <span className="size-2 rounded-full bg-warn pulse-dot inline-block" />
          Loading AI…
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-danger font-mono">
        <span className="size-2 rounded-full bg-danger inline-block" />
        Model Offline
      </span>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex h-15 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Logo & Product Identity */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onChangeView('overview');
              }}
              className="flex items-center gap-2.5 cursor-pointer text-left focus-visible:outline-none"
            >
              <div className="grid size-8 place-items-center rounded-md bg-accent text-accent-ink font-bold font-mono text-sm shadow-sm">
                M
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-ink block leading-none">
                  {APP_NAME}
                </span>
                <span className="text-[10px] text-ink-muted tracking-wide uppercase font-semibold hidden sm:inline">
                  {APP_TAGLINE}
                </span>
              </div>
            </button>

            <span className="hidden xl:inline-block h-4 w-px bg-line" />
            <div className="hidden xl:block">{modelStatusBadge()}</div>
          </div>

          {/* Desktop Navigation */}
          <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-0.5">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChangeView(item.id);
                  }}
                  className={`cursor-pointer inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-surface-muted text-ink font-semibold shadow-xs border border-line'
                      : 'text-ink-muted hover:bg-surface-muted/60 hover:text-ink'
                  }`}
                >
                  <Icon className={`size-3.5 ${active ? 'text-accent' : 'text-ink-muted'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons: Profile & GitHub */}
          <div className="flex items-center gap-2">
            {/* User Persona Profile Button */}
            <button
              type="button"
              onClick={() => {
                setProfileModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:bg-surface-muted transition-colors shadow-xs cursor-pointer"
              title="Configure User Persona and Local Privacy"
            >
              <User className="size-3.5 text-accent" />
              <span className="hidden sm:inline capitalize">{profile.persona}</span>
            </button>

            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:bg-surface-muted transition-colors shadow-xs"
              title="View M-ABLE on GitHub"
            >
              <Code2 className="size-3.5 text-ink-muted" />
              <span>GitHub</span>
            </a>

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen((o) => !o);
              }}
              className="lg:hidden cursor-pointer inline-flex p-1.5 rounded-md border border-line bg-surface text-ink hover:bg-surface-muted"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-line bg-paper px-4 py-3 space-y-1 shadow-lg">
            <div className="pb-2 mb-2 border-b border-line flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Navigation
              </span>
              {modelStatusBadge()}
            </div>
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChangeView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors text-left ${
                    active
                      ? 'bg-accent text-accent-ink font-semibold'
                      : 'text-ink hover:bg-surface-muted'
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* User Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => {
          setProfileModalOpen(false);
        }}
      />
    </>
  );
}
