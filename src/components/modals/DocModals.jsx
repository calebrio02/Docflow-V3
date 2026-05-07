import { useEffect, useState } from 'react';
import { GitCommit, Share2, Copy, X, UserPlus } from 'lucide-react';

export function CreateProjectModal({ visible, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (visible) { setName(''); setDescription(''); }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 w-[450px]">
        <p className="text-sm font-medium text-slate-800 mb-3">New Project</p>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Project name" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onCreate(name.trim(), description.trim()); }} />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)" rows={3}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 resize-none" />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={() => { if (name.trim()) onCreate(name.trim(), description.trim()); }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={!name.trim()}>Create</button>
        </div>
      </div>
    </div>
  );
}

export function ReleaseModal({ visible, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (visible) { setTitle(''); setDescription(''); }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 w-[450px]">
        <div className="flex items-center gap-2 mb-3">
          <GitCommit size={18} className="text-blue-600" />
          <p className="text-sm font-medium text-slate-800">Publish Release</p>
        </div>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Release title (e.g. v1, Feature update)"
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
          onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) onSave(title.trim(), description.trim()); }} />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="What changed? (optional)" rows={3}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 resize-none" />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={() => { if (title.trim()) onSave(title.trim(), description.trim()); }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={!title.trim()}>Publish</button>
        </div>
      </div>
    </div>
  );
}

export function ShareModal({ visible, onClose, isPublic, onToggleShare, shareUrl }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 w-[450px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-blue-600" />
            <p className="text-sm font-medium text-slate-800">Share Document</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X size={16} />
          </button>
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg mb-4">
          <span className="text-sm text-slate-700">{isPublic ? 'Public link active' : 'Not shared'}</span>
          <button
            onClick={() => onToggleShare(!isPublic)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isPublic ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isPublic ? 'Disable' : 'Enable'}
          </button>
        </div>
        {isPublic && (
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1">Share link</p>
            <div className="flex gap-2">
              <input type="text" value={shareUrl} readOnly
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg" />
              <button onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
                <Copy size={12} /> Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function InviteModal({ visible, onClose, onInvite }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');

  useEffect(() => {
    if (visible) { setEmail(''); setRole('editor'); }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 w-[400px]">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus size={18} className="text-blue-600" />
          <p className="text-sm font-medium text-slate-800">Invite Member</p>
        </div>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3" />
        <select value={role} onChange={(e) => setRole(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4">
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={() => { if (email.trim()) { onInvite(email.trim(), role); } }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={!email.trim()}>Send Invite</button>
        </div>
      </div>
    </div>
  );
}

export function ReleaseViewModal({ release, onClose }) {
  if (!release) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-[800px] max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{release.title}</h3>
            <p className="text-xs text-slate-500">v{release.version_number} · by {release.author} · {new Date(release.created_at).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: '' }} />
          <p className="text-sm text-slate-500 italic">This is a snapshot of the document at release time. BlockNote renders this in read-only mode.</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Rename Modal (reusable) ─── */
export function RenameModal({ visible, title, initialValue, onClose, onSubmit }) {
  const [value, setValue] = useState('');
  useEffect(() => {
    if (visible) setValue(initialValue || '');
  }, [visible, initialValue]);
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 w-[400px]">
        <p className="text-sm font-medium text-slate-800 mb-3">{title}</p>
        <input type="text" value={value} onChange={(e) => setValue(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
          onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) onSubmit(value.trim()); }} />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={() => { if (value.trim()) onSubmit(value.trim()); }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={!value.trim()}>Save</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Subfolder Modal ─── */
export function SubfolderModal({ visible, onClose, onSubmit, parentId }) {
  const [name, setName] = useState('');
  useEffect(() => { if (visible) setName(''); }, [visible]);
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 w-[400px]">
        <p className="text-sm font-medium text-slate-800 mb-3">New Folder</p>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Folder name" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onSubmit(name.trim(), parentId); }} />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={() => { if (name.trim()) onSubmit(name.trim(), parentId); }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={!name.trim()}>Create</button>
        </div>
      </div>
    </div>
  );
}
