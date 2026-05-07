import { Users, UserPlus, Trash2, GitCommit } from 'lucide-react';

export function MembersPanel({ members, userRole, onRemoveMember, onRoleChange, onInvite }) {
  const canManage = userRole === 'owner';

  return (
    <div className="border-l w-72 flex flex-col h-full" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}>
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
          <Users size={16} style={{ color: 'var(--primary)' }} /> Team Members
        </h3>
        {canManage && (
          <button onClick={onInvite} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }} title="Invite member">
            <UserPlus size={16} />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors" style={{ ':hover': { backgroundColor: 'var(--bg-hover)' } }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {m.username?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-main)' }}>{m.username}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{m.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <select
                value={m.role}
                disabled={!canManage}
                onChange={(e) => onRoleChange(m.id, e.target.value)}
                className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                style={{ 
                  border: canManage ? '1px solid var(--border-color)' : 'none',
                  backgroundColor: 'var(--bg-hover)',
                  color: 'var(--text-muted)'
                }}
              >
                <option value="owner">Owner</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              {canManage && parseInt(m.id) !== 1 && (
                <button onClick={() => onRemoveMember(m.id)} className="p-1 rounded hover:text-red-500 transition-colors" style={{ color: 'var(--text-muted)' }}>
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No members yet</p>
        )}
      </div>
    </div>
  );
}

export function ReleasePanel({ releases, userRole, onViewRelease, onOpenPublish }) {
  return (
    <div className="border-l w-72 flex flex-col h-full" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}>
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
          <GitCommit size={16} style={{ color: 'var(--primary)' }} /> Changelog
        </h3>
        {userRole && userRole !== 'viewer' && (
          <button onClick={onOpenPublish}
            className="px-2.5 py-1 text-xs font-bold text-white rounded-lg flex items-center gap-1 transition-colors"
            style={{ backgroundColor: 'var(--primary)' }}>
            <GitCommit size={11} /> Commit
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {releases.length === 0 ? (
          <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
            <GitCommit size={28} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No releases yet</p>
            <p className="text-xs mt-1">Commit & Push to create your first</p>
          </div>
        ) : (
          <div className="space-y-1">
            {releases.map((r) => (
              <button key={r.id} onClick={() => onViewRelease(r)}
                className="w-full text-left px-3 py-3 rounded-xl mb-1 transition-colors group"
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(30, 150, 235, 0.15)' }}>
                    <GitCommit size={12} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-main)' }}>{r.title}</p>
                      <span className="text-xs font-mono ml-2 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>v{r.version_number}</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{r.author} · {new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {r.description && (
                  <p className="text-xs mt-2 pl-8 truncate" style={{ color: 'var(--text-muted)' }}>{r.description}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
