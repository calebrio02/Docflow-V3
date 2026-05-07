import { Users, UserPlus, Trash2, GitCommit } from 'lucide-react';

export function MembersPanel({ members, userRole, onRemoveMember, onRoleChange, onInvite }) {
  const canManage = userRole === 'owner';

  return (
    <div className="bg-white border-l border-slate-200 w-72 flex flex-col h-full">
      <div className="p-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Users size={16} /> Members
          </h3>
          {canManage && (
            <button onClick={onInvite} className="p-1 hover:bg-slate-100 rounded-lg" title="Invite member">
              <UserPlus size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-slate-50">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{m.username}</p>
              <p className="text-xs text-slate-500 truncate">{m.email}</p>
            </div>
            <div className="flex items-center gap-1">
              <select
                value={m.role}
                disabled={!canManage}
                onChange={(e) => onRoleChange(m.id, e.target.value)}
                className={`text-xs border rounded px-1 py-0.5 ${canManage ? 'border-slate-300' : 'border-transparent bg-transparent'}`}
              >
                <option value="owner">Owner</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              {canManage && parseInt(m.id) !== 1 && (
                <button onClick={() => onRemoveMember(m.id)} className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-600">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReleasePanel({ releases, userRole, onViewRelease, onOpenPublish }) {
  return (
    <div className="bg-white border-l border-slate-200 w-72 flex flex-col h-full">
      <div className="p-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <GitCommit size={16} /> Releases
          </h3>
          {userRole && userRole !== 'viewer' && (
            <button onClick={onOpenPublish}
              className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1">
              <GitCommit size={12} /> Publish
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {releases.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400">
            <GitCommit size={24} className="mx-auto mb-2 opacity-50" />
            <p>No releases yet</p>
            <p className="text-xs">Publish your first release</p>
          </div>
        ) : (
          releases.map((r) => (
            <button key={r.id} onClick={() => onViewRelease(r)}
              className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-50 mb-1">
              <div className="flex items-center gap-2">
                <GitCommit size={14} className="text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{r.title}</p>
                  <p className="text-xs text-slate-500">v{r.version_number} · {r.author}</p>
                </div>
              </div>
              {r.description && (
                <p className="text-xs text-slate-500 mt-1 truncate">{r.description}</p>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
