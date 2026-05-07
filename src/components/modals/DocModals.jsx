import { useEffect, useState } from 'react';
import { GitCommit, Share2, Copy, X, UserPlus, Folder } from 'lucide-react';
import { BlockNoteEditor } from '../Editor/BlockNoteEditor';

/* ─── Shared modal shell ─── */
function ModalShell({ onClose, children, width = '460px' }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl w-full"
        style={{
          maxWidth: width,
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-main)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── Shared input/textarea styles ─── */
const inputStyle = {
  backgroundColor: 'var(--bg-main)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-main)',
  borderRadius: '8px',
  width: '100%',
  padding: '8px 12px',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'inherit',
};

function ModalInput(props) {
  return (
    <input
      {...props}
      style={inputStyle}
      onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 2px rgba(30,150,235,0.15)'; }}
      onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
    />
  );
}

function ModalTextarea(props) {
  return (
    <textarea
      {...props}
      style={{ ...inputStyle, resize: 'none' }}
      onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 2px rgba(30,150,235,0.15)'; }}
      onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
    />
  );
}

function ModalSelect(props) {
  return (
    <select
      {...props}
      style={{ ...inputStyle, cursor: 'pointer' }}
    />
  );
}

function ModalFooter({ onClose, onSubmit, submitLabel, disabled }) {
  return (
    <div className="flex gap-2 justify-end pt-2">
      <button
        onClick={onClose}
        className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        Cancel
      </button>
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors disabled:opacity-40"
        style={{ backgroundColor: 'var(--primary)' }}
        onMouseEnter={e => !disabled && (e.currentTarget.style.backgroundColor = 'var(--primary-hover)')}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--primary)'}
      >
        {submitLabel}
      </button>
    </div>
  );
}

/* ─── Create Project Modal ─── */
export function CreateProjectModal({ visible, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (visible) { setName(''); setDescription(''); }
  }, [visible]);

  if (!visible) return null;

  return (
    <ModalShell onClose={onClose}>
      <div className="p-6 space-y-4">
        <p className="text-base font-bold" style={{ color: 'var(--text-main)' }}>New Project</p>
        <ModalInput
          type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Project name"
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onCreate(name.trim(), description.trim()); }}
        />
        <ModalTextarea
          value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Description (optional)" rows={3}
        />
        <ModalFooter onClose={onClose} onSubmit={() => { if (name.trim()) onCreate(name.trim(), description.trim()); }} submitLabel="Create" disabled={!name.trim()} />
      </div>
    </ModalShell>
  );
}

/* ─── Commit & Push / Release Modal ─── */
export function ReleaseModal({ visible, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (visible) { setTitle(''); setDescription(''); }
  }, [visible]);

  if (!visible) return null;

  return (
    <ModalShell onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <GitCommit size={18} style={{ color: 'var(--primary)' }} />
          <p className="text-base font-bold" style={{ color: 'var(--text-main)' }}>Commit & Push Release</p>
        </div>
        <ModalInput
          type="text" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Release title (e.g. v1.0, Initial SOP)"
          onKeyDown={e => { if (e.key === 'Enter' && title.trim()) onSave(title.trim(), description.trim()); }}
        />
        <ModalTextarea
          value={description} onChange={e => setDescription(e.target.value)}
          placeholder="What changed? (changelog message)" rows={4}
        />
        <ModalFooter onClose={onClose} onSubmit={() => { if (title.trim()) onSave(title.trim(), description.trim()); }} submitLabel="Publish" disabled={!title.trim()} />
      </div>
    </ModalShell>
  );
}

/* ─── Share Modal ─── */
export function ShareModal({ visible, onClose, isPublic, onToggleShare, shareUrl }) {
  const [copied, setCopied] = useState(false);
  if (!visible) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 size={18} style={{ color: 'var(--primary)' }} />
            <p className="text-base font-bold" style={{ color: 'var(--text-main)' }}>Share Document</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>{isPublic ? 'Public link active' : 'Not shared'}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{isPublic ? 'Anyone with the link can view' : 'Only team members can access'}</p>
          </div>
          <button
            onClick={() => onToggleShare(!isPublic)}
            className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors"
            style={isPublic
              ? { backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }
              : { backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e' }}
          >
            {isPublic ? 'Disable' : 'Enable'}
          </button>
        </div>

        {isPublic && (
          <div>
            <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>Share link</p>
            <div className="flex gap-2">
              <input type="text" value={shareUrl} readOnly
                style={{ ...inputStyle, fontSize: '12px', flex: 1 }} />
              <button onClick={handleCopy}
                className="px-3 py-2 text-xs font-bold text-white rounded-lg flex items-center gap-1.5 transition-colors"
                style={{ backgroundColor: copied ? '#22c55e' : 'var(--primary)', whiteSpace: 'nowrap' }}>
                <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

/* ─── Invite Modal ─── */
export function InviteModal({ visible, onClose, onInvite }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');

  useEffect(() => {
    if (visible) { setEmail(''); setRole('editor'); }
  }, [visible]);

  if (!visible) return null;

  return (
    <ModalShell onClose={onClose} width="420px">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus size={18} style={{ color: 'var(--primary)' }} />
          <p className="text-base font-bold" style={{ color: 'var(--text-main)' }}>Invite Member</p>
        </div>
        <ModalInput type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" />
        <ModalSelect value={role} onChange={e => setRole(e.target.value)}>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </ModalSelect>
        <ModalFooter onClose={onClose} onSubmit={() => { if (email.trim()) onInvite(email.trim(), role); }} submitLabel="Send Invite" disabled={!email.trim()} />
      </div>
    </ModalShell>
  );
}

/* ─── Release View Modal (snapshot) ─── */
export function ReleaseViewModal({ release, visible, onClose }) {
  if (!visible || !release) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl flex flex-col"
        style={{
          width: '900px',
          maxWidth: '95vw',
          maxHeight: '88vh',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-main)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b flex items-start justify-between flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GitCommit size={16} style={{ color: 'var(--primary)' }} />
              <h3 className="text-base font-bold" style={{ color: 'var(--text-main)' }}>{release.title}</h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md font-bold" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)' }}>v{release.version_number}</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>by {release.author} · {new Date(release.created_at).toLocaleString()}</p>
            {release.description && (
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>{release.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors flex-shrink-0 ml-4"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-10 py-8" style={{ backgroundColor: 'var(--bg-main)' }}>
          <BlockNoteEditor initialContent={release.content} editable={false} />
        </div>
      </div>
    </div>
  );
}

/* ─── Rename Modal ─── */
export function RenameModal({ visible, title, initialValue, onClose, onSubmit }) {
  const [value, setValue] = useState('');
  useEffect(() => {
    if (visible) setValue(initialValue || '');
  }, [visible, initialValue]);
  if (!visible) return null;

  return (
    <ModalShell onClose={onClose} width="420px">
      <div className="p-6 space-y-4">
        <p className="text-base font-bold" style={{ color: 'var(--text-main)' }}>{title}</p>
        <ModalInput
          type="text" value={value} onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && value.trim()) onSubmit(value.trim()); }}
        />
        <ModalFooter onClose={onClose} onSubmit={() => { if (value.trim()) onSubmit(value.trim()); }} submitLabel="Save" disabled={!value.trim()} />
      </div>
    </ModalShell>
  );
}

/* ─── Subfolder Modal ─── */
export function SubfolderModal({ visible, onClose, onSubmit, parentId }) {
  const [name, setName] = useState('');
  useEffect(() => { if (visible) setName(''); }, [visible]);
  if (!visible) return null;

  return (
    <ModalShell onClose={onClose} width="420px">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Folder size={18} style={{ color: 'var(--primary)' }} />
          <p className="text-base font-bold" style={{ color: 'var(--text-main)' }}>New Folder</p>
        </div>
        <ModalInput
          type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Folder name"
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onSubmit(name.trim(), parentId); }}
        />
        <ModalFooter onClose={onClose} onSubmit={() => { if (name.trim()) onSubmit(name.trim(), parentId); }} submitLabel="Create" disabled={!name.trim()} />
      </div>
    </ModalShell>
  );
}
