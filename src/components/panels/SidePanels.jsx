import { useState, useEffect, useRef } from 'react';
import { Users, UserPlus, Trash2, GitCommit, X, Search, Check } from 'lucide-react';
import { api } from '../../api';

export function MembersPanel({ members, userRole, projectId, onRemoveMember, onRoleChange, onInvite, onClose }) {
  const canManage = userRole === 'owner';
  const [showAddUser, setShowAddUser] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [addingUserId, setAddingUserId] = useState(null);
  const [addRole, setAddRole] = useState('editor');
  const [addedIds, setAddedIds] = useState(new Set());
  const searchRef = useRef(null);

  // IDs already in the project
  const memberIds = new Set(members.map(m => m.id));

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await api.searchUsers(searchQuery);
        setSearchResults(results);
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddExisting = async (user) => {
    if (addingUserId) return;
    setAddingUserId(user.id);
    try {
      await api.addMember(projectId, user.id, addRole);
      setAddedIds(prev => new Set([...prev, user.id]));
      setSearchQuery('');
      setSearchResults([]);
      setShowAddUser(false);
      // Trigger member reload in parent via onRoleChange noop to refresh
      onRoleChange && onRoleChange(null, null); // parent re-fetches members
    } catch (e) {
      console.error(e);
    } finally {
      setAddingUserId(null);
    }
  };

  return (
    <div
      className="fixed right-0 top-14 bottom-0 w-80 flex flex-col z-30 shadow-2xl"
      style={{ backgroundColor: 'var(--bg-card)', borderLeft: '1px solid var(--border-color)', color: 'var(--text-main)' }}
    >
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
          <Users size={16} style={{ color: 'var(--primary)' }} /> Team Members
        </h3>
        <div className="flex items-center gap-1">
          {canManage && (
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: showAddUser ? 'var(--primary)' : 'var(--text-muted)' }}
              title="Add member"
            >
              <UserPlus size={16} />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Add member panel */}
      {canManage && showAddUser && (
        <div className="p-3 border-b flex-shrink-0 space-y-2" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
          <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Add existing user</p>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by username…"
              className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg outline-none"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--primary)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; }}
            />
          </div>
          {/* Role selector for new member */}
          <select
            value={addRole}
            onChange={e => setAddRole(e.target.value)}
            className="w-full text-xs px-2 py-1.5 rounded-lg"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
            }}
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
            <option value="owner">Owner</option>
          </select>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
              {searchResults.map(u => {
                const alreadyMember = memberIds.has(u.id) || addedIds.has(u.id);
                return (
                  <button
                    key={u.id}
                    disabled={alreadyMember || addingUserId === u.id}
                    onClick={() => handleAddExisting(u)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors disabled:opacity-50"
                    onMouseEnter={e => { if (!alreadyMember) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {u.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-main)' }}>{u.username}</p>
                        {u.email && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.email}</p>}
                      </div>
                    </div>
                    {alreadyMember
                      ? <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Member</span>
                      : <Check size={13} style={{ color: 'var(--primary)' }} className="flex-shrink-0" />
                    }
                  </button>
                );
              })}
            </div>
          )}

          {/* Divider + email invite option */}
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t" style={{ borderColor: 'var(--border-color)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
            <div className="flex-1 border-t" style={{ borderColor: 'var(--border-color)' }} />
          </div>
          <button
            onClick={() => { setShowAddUser(false); onInvite && onInvite(); }}
            className="w-full text-xs font-bold py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            style={{ backgroundColor: 'rgba(30,150,235,0.1)', color: 'var(--primary)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(30,150,235,0.18)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(30,150,235,0.1)'}
          >
            <UserPlus size={12} /> Invite via email link
          </button>
        </div>
      )}

      {/* Member list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors"
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
            <GitCommit size={11} /> Release
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {releases.length === 0 ? (
          <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
            <GitCommit size={28} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No releases yet</p>
            <p className="text-xs mt-1">Create your first Release</p>
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
