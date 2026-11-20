import { Download, Lock } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import { profileStore, type PrimaryMode, type UserPersona } from '../lib/profile-store';
import { showToast } from '../lib/toast-store';
import { Button, Dialog } from './ui';

export function ProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const profile = useSyncExternalStore(profileStore.subscribe, profileStore.getSnapshot);

  const [name, setName] = useState(profile.name);
  const [persona, setPersona] = useState<UserPersona>(profile.persona);
  const [primaryMode, setPrimaryMode] = useState<PrimaryMode>(profile.primaryMode);
  const [notes, setNotes] = useState(profile.notes);

  const handleSave = () => {
    profileStore.update({
      name: name.trim() || 'M-ABLE User',
      persona,
      primaryMode,
      notes,
    });
    showToast('Profile preferences saved locally', 'success');
    onClose();
  };

  const handleExportData = () => {
    const dataStr = profileStore.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `m-able-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Full local data bundle exported', 'info');
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="User Profile & Persona"
      description="Tailor M-ABLE to your primary communication need. Everything is stored strictly in your browser."
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-xs">
        {/* Name Input */}
        <div>
          <label className="font-semibold uppercase tracking-wider text-ink-muted block mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            className="w-full rounded-md border border-line bg-surface p-2 text-sm text-ink focus:border-accent focus:outline-none"
            placeholder="e.g. Alex"
          />
        </div>

        {/* Primary Persona Selection */}
        <div>
          <label className="font-semibold uppercase tracking-wider text-ink-muted block mb-1">
            Primary Role / Persona
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['signer', 'Deaf / ASL Signer'],
                ['learner', 'Hearing Learner / Ally'],
                ['clinician', 'Educator / Clinician'],
                ['guest', 'Guest User'],
              ] as const
            ).map(([pVal, pLabel]) => (
              <button
                key={pVal}
                type="button"
                onClick={() => {
                  setPersona(pVal);
                }}
                className={`p-2 rounded-md border text-left transition-colors cursor-pointer ${
                  persona === pVal
                    ? 'border-accent bg-accent-soft text-accent font-semibold'
                    : 'border-line bg-surface text-ink hover:bg-surface-muted'
                }`}
              >
                {pLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Interaction Mode */}
        <div>
          <label className="font-semibold uppercase tracking-wider text-ink-muted block mb-1">
            Default Studio Layout
          </label>
          <select
            value={primaryMode}
            onChange={(e) => {
              setPrimaryMode(e.target.value as PrimaryMode);
            }}
            className="w-full rounded-md border border-line bg-surface p-2 text-xs text-ink focus:border-accent focus:outline-none"
          >
            <option value="two-way">Two-Way Studio (Split Signer & Partner)</option>
            <option value="sign-focused">Sign Focused (Camera & Recognition)</option>
            <option value="captions-focused">Captions Focused (Voice-to-Text)</option>
          </select>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="font-semibold uppercase tracking-wider text-ink-muted block mb-1">
            Accessibility Notes / Reminders
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
            }}
            placeholder="e.g. Left-hand dominant signer, prefers slow speech output rate"
            className="w-full rounded-md border border-line bg-surface p-2 text-xs text-ink focus:border-accent focus:outline-none resize-none"
          />
        </div>

        {/* Data Privacy & Export */}
        <div className="pt-2 border-t border-line/60 flex items-center justify-between">
          <Button variant="outline" size="xs" onClick={handleExportData}>
            <Download className="size-3" /> Export Backup (JSON)
          </Button>

          <div className="flex items-center gap-1 text-[11px] text-ink-muted">
            <Lock className="size-3 text-accent" />
            <span>Local Storage Only</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save Preferences
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
