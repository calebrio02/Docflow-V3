import { useState, useEffect, useCallback } from 'react';
import { X, Users, Mail, Trash2, Copy, Check, UserPlus, Shield, Clock } from 'lucide-react';
import { api } from '../../api';

export function UserDropdown({ user, onLogout, darkMode, onToggleDark }) {
  const [open, setOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-sm font-bold text-white hover:scale-105 transition-transform"
      >
        {user?.username?.charAt(0).toUpperCase()}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div
            className="absolute right-0 top-12 z-50 rounded-2xl shadow-2xl w-72 overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            {/* User info */}
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-base font-bold text-white">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>{user?.username}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                  {user?.isAdmin && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold mt-0.5" style={{ color: 'var(--primary)' }}>
                      <Shield size={11} /> Admin
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-2">
              <button
                onClick={() => { onToggleDark(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left"
                style={{ color: 'var(--text-main)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span style={{ color: 'var(--text-muted)' }}>{darkMode ? '☀️' : '🌙'}</span>
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>

              {user?.isAdmin && (
                <button
                  onClick={() => { setShowAdmin(true); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left"
                  style={{ color: 'var(--text-main)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Users size={16} style={{ color: 'var(--primary)' }} />
                  Manage Users
                </button>
              )}

              <div className="my-1 border-t" style={{ borderColor: 'var(--border-color)' }} />

              <button
                onClick={() => { onLogout(); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left text-red-500"
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span>↩</span> Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}

function AdminPanel({ onClose }) {
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [email, setEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState('users');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const [u, inv] = await Promise.all([api.adminUsers(), api.adminInvitations()]);
    if (u && !u.error) setUsers(u);
    if (inv && !inv.error) setInvitations(inv);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setLoading(true);
    const result = await api.adminInvite(email.trim());
    setLoading(false);
    if (result?.invitationLink) {
      setInviteLink(result.invitationLink);
      setEmail('');
      load();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    await api.adminDeleteUser(id);
    load();
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl flex flex-col"
        style={{
          width: '680px',
          maxWidth: '95vw',
          maxHeight: '85vh',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-main)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <Shield size={20} style={{ color: 'var(--primary)' }} />
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>Admin Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
          {['users', 'invite', 'invitations'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 text-sm font-bold rounded-t-lg transition-colors"
              style={{
                backgroundColor: tab === t ? 'var(--bg-main)' : 'transparent',
                color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
              }}
            >
              {t === 'users' ? `Users (${users.length})` : t === 'invite' ? 'Invite User' : `Invites (${invitations.length})`}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Users Tab */}
          {tab === 'users' && (
            <div className="space-y-2">
              {users.map(u => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                      {u.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>{u.username}</span>
                        {u.is_admin && (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(30,150,235,0.12)', color: 'var(--primary)' }}>
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </span>
                    {!u.is_admin && (
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-1.5 rounded-lg transition-colors hover:text-red-500"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Invite Tab */}
          {tab === 'invite' && (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-main)' }}>Invite a new user</p>
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                  Enter their email address. A unique signup link valid for 7 days will be generated.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    onKeyDown={e => e.key === 'Enter' && handleInvite()}
                    style={{
                      flex: 1,
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                  <button
                    onClick={handleInvite}
                    disabled={!email.trim() || loading}
                    className="px-4 py-2 text-sm font-bold text-white rounded-lg flex items-center gap-2 disabled:opacity-40"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >
                    <UserPlus size={16} />
                    {loading ? 'Generating...' : 'Generate Link'}
                  </button>
                </div>
              </div>

              {inviteLink && (
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <p className="text-sm font-bold text-green-500 mb-2 flex items-center gap-1">
                    <Check size={16} /> Invite link generated!
                  </p>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                    Share this link with the user. It expires in 7 days and can only be used once.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 text-xs rounded-lg px-3 py-2"
                      style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                    />
                    <button
                      onClick={handleCopy}
                      className="px-3 py-2 text-xs font-bold text-white rounded-lg flex items-center gap-1"
                      style={{ backgroundColor: copied ? '#22c55e' : 'var(--primary)' }}
                    >
                      <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Invitations Tab */}
          {tab === 'invitations' && (
            <div className="space-y-2">
              {invitations.length === 0 && (
                <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No invitations yet</p>
              )}
              {invitations.map(inv => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-hover)' }}>
                      <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>{inv.email}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        by {inv.created_by_name} · {new Date(inv.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-lg"
                    style={inv.used_at
                      ? { backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' }
                      : new Date(inv.expires_at) < new Date()
                        ? { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }
                        : { backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b' }
                    }
                  >
                    {inv.used_at ? 'Used' : new Date(inv.expires_at) < new Date() ? 'Expired' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
