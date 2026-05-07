import { useState, useEffect, useCallback, useRef } from 'react';
import React from 'react';
import { Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import {
  FileText, Folder, Plus, Loader2,
  Users, GitCommit, Copy, Eye, Unlock, Lock, Clock,
  Check, Trash2, ChevronRight, Home, ChevronLeft, Moon, Sun
} from 'lucide-react';

import { api } from './api';
import { LoginScreen, RegisterScreen, InviteAcceptScreen } from './components/auth/AuthScreens';
import { 
  CreateProjectModal, ReleaseModal, ShareModal, 
  InviteModal, ReleaseViewModal, RenameModal, SubfolderModal 
} from './components/modals/DocModals';
import { MembersPanel, ReleasePanel } from './components/panels/SidePanels';
import { BlockNoteEditor } from './components/Editor/BlockNoteEditor';
import { UserDropdown } from './components/admin/AdminPanel';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('docflow-token'));
  const isLoggedIn = !!token;
  const [currentUser, setCurrentUser] = useState(null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('docflow-theme') === 'dark');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('docflow-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('docflow-theme', 'light');
    }
  }, [darkMode]);

  const loadUser = useCallback(async () => {
    try {
      const data = await api.me();
      if (data) setCurrentUser(data);
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadUser();
  }, [isLoggedIn, loadUser]);

  const handleLogin = async (username, password) => {
    const res = await api.login(username, password);
    if (res?.token) setToken(res.token);
  };
  const handleRegister = async (username, password, invitationToken) => {
    const res = await api.register(username, password, invitationToken);
    if (res?.token) setToken(res.token);
  };
  const handleLogout = () => {
    api.logout();
    setToken(null);
    window.location.href = '/';
  };

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/invite/:token" element={<InviteRoute onLogin={setToken} />} />
        <Route path="/share/:token" element={<ShareView />} />
        <Route path="*" element={<LoginScreen onLogin={handleLogin} />} />
      </Routes>
    );
  }

  return (
    <div className="h-screen flex flex-col font-sans transition-colors duration-300" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
      {/* Top Navigation */}
      <nav className="h-14 border-b flex items-center justify-between px-6 sticky top-0 z-40" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: 'var(--primary)' }}>
              <FileText size={16} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg tracking-tight">Docflow</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <UserDropdown
            user={currentUser}
            onLogout={handleLogout}
            darkMode={darkMode}
            onToggleDark={() => setDarkMode(!darkMode)}
          />
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Dashboard user={currentUser} onUserUpdate={loadUser} />} />
          <Route path="/project/:projectId" element={<Workspace />} />
          <Route path="/project/:projectId/folder/:folderId" element={<Workspace />} />
          <Route path="/document/:docId" element={<EditorView />} />
          <Route path="/share/:token" element={<ShareView />} />
          <Route path="/invite/:token" element={<InviteRoute onLogin={setToken} />} />
        </Routes>
      </div>
    </div>
  );
}

function InviteRoute({ onLogin }) {
  const { token } = useParams();
  const navigate = useNavigate();
  const handleAccept = async (t, username, email, password) => {
    const res = await api.acceptInvite(t, username, email, password);
    if (res?.token) {
      onLogin(res.token);
      navigate('/');
    }
  };
  return <InviteAcceptScreen token={token} onAccept={handleAccept} />;
}

function Dashboard({ user, onUserUpdate }) {
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (name, desc) => {
    await api.createProject(name, desc);
    setShowCreate(false);
    onUserUpdate();
  };

  const handleDelete = async (e, projectId) => {
    e.stopPropagation();
    if (window.confirm("Delete project and all its contents? This cannot be undone.")) {
      await api.deleteProject(projectId);
      onUserUpdate();
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold">My Workspace</h1>
        </div>
        
        {(!user?.projects || user.projects.length === 0) ? (
          <div className="text-center p-20 affine-card">
            <div className="w-24 h-24 bg-blue-50/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Folder size={48} />
            </div>
            <h2 className="text-2xl font-bold mb-2">No projects yet</h2>
            <p className="mb-8 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>Create your first project workspace to start organizing your SOPs.</p>
            <button onClick={() => setShowCreate(true)} className="affine-button px-8 py-3 flex mx-auto items-center gap-2">
              <Plus size={20} /> Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <button onClick={() => setShowCreate(true)} 
              className="group flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-2xl transition-all hover:border-blue-500" style={{ borderColor: 'var(--border-color)' }}>
              <Plus size={32} className="mb-3" style={{ color: 'var(--text-muted)' }} />
              <span className="font-bold" style={{ color: 'var(--text-muted)' }}>New Project</span>
            </button>
            {user.projects.map(p => (
              <div key={p.project_id} className="relative group cursor-pointer" onClick={() => navigate(`/project/${p.project_id}`)}>
                <div className="flex flex-col h-48 affine-card p-6 text-left">
                  <div className="flex justify-between items-start mb-auto">
                    <Folder size={48} style={{ color: 'var(--primary)' }} className="group-hover:scale-105 transition-transform" />
                    <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)' }}>{p.role}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg truncate mb-1">{p.name}</h3>
                    <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{p.description || 'Workspace'}</p>
                  </div>
                </div>
                {p.role === 'owner' && (
                  <button onClick={(e) => handleDelete(e, p.project_id)} 
                    className="absolute top-4 right-4 p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all" style={{ backgroundColor: 'var(--bg-hover)' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <CreateProjectModal visible={showCreate} onClose={() => setShowCreate(false)} onCreate={handleCreate} />
    </main>
  );
}

function Workspace() {
  const { projectId, folderId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [folders, setFolders] = useState([]);
  const [docs, setDocs] = useState([]);
  const [folderPath, setFolderPath] = useState([]); // This would ideally be fetched from API, but we'll infer it or keep it simple
  
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [members, setMembers] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const p = await api.getProject(projectId);
      setProject(p);

      if (folderId) {
        const flds = await api.subfolders(folderId);
        const d = await api.projectDocuments(projectId, folderId);
        setFolders(flds);
        setDocs(d);
      } else {
        const flds = await api.projectFolders(projectId);
        const d = await api.projectDocuments(projectId);
        setFolders(flds);
        setDocs(d);
        setFolderPath([]);
      }

      const m = await api.projectMembers(projectId);
      setMembers(m);
    } catch (err) { console.error(err); }
  }, [projectId, folderId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateFolder = async (name) => {
    await api.createFolder(name, projectId, folderId);
    setShowFolderModal(false);
    loadData();
  };

  const handleCreateDoc = async (title) => {
    const doc = await api.createDocument(title, projectId, folderId);
    setShowDocModal(false);
    navigate(`/document/${doc.id}`);
  };

  const handleDeleteDoc = async (e, id) => {
    e.stopPropagation();
    if(window.confirm('Delete document?')) { await api.deleteDocument(id); loadData(); }
  };

  const handleDeleteFolder = async (e, id) => {
    e.stopPropagation();
    if(window.confirm('Delete folder?')) { await api.deleteFolder(id); loadData(); }
  };

  const handleRemoveMember = async (userId) => {
    await api.removeMember(projectId, userId);
    const m = await api.projectMembers(projectId);
    setMembers(m);
  };

  const handleRoleChange = async (userId, role) => {
    // null userId is a reload-only signal sent by MembersPanel after adding a user directly
    if (userId !== null) {
      await api.updateMemberRole(projectId, userId, role);
    }
    const m = await api.projectMembers(projectId);
    setMembers(m);
  };

  const handleInviteMember = async (email, role) => {
    const result = await api.createInvite(projectId, email, role);
    setShowInvite(false);
    if (result?.invitationLink) {
      const fullLink = `${window.location.origin}${result.invitationLink}`;
      prompt('Share this invite link with the user:', fullLink);
    }
  };

  if (!project) return null;

  const canEdit = project.role === 'owner' || project.role === 'editor';
  const isOwner = project.role === 'owner';

  return (
    <main className="flex-1 overflow-y-auto p-10 relative">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-6 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          <Link to="/" className="hover:text-blue-500"><Home size={16} /></Link>
          <ChevronRight size={16} />
          <Link to={`/project/${projectId}`} className="hover:text-blue-500 font-bold" style={{ color: !folderId ? 'var(--text-main)' : '' }}>{project.name}</Link>
          {folderId && (
            <>
              <ChevronRight size={16} />
              <span style={{ color: 'var(--text-main)' }}>Subfolder</span>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-extrabold">{folderId ? 'Folder Contents' : project.name}</h1>
          {canEdit && (
            <div className="flex gap-3">
              <button onClick={() => setShowMembers(!showMembers)} className={`affine-button-outline px-4 py-2 flex items-center gap-2 ${showMembers ? 'border-blue-500 text-blue-500' : ''}`}>
                <Users size={18} /> Team
              </button>
              <button onClick={() => setShowFolderModal(true)} className="affine-button-outline px-4 py-2 flex items-center gap-2">
                <Folder size={18} /> New Folder
              </button>
              <button onClick={() => setShowDocModal(true)} className="affine-button px-4 py-2 flex items-center gap-2">
                <FileText size={18} /> New Document
              </button>
            </div>
          )}
        </div>

        {folders.length === 0 && docs.length === 0 ? (
          <div className="text-center p-20 border-2 border-dashed rounded-2xl" style={{ borderColor: 'var(--border-color)' }}>
             <p style={{ color: 'var(--text-muted)' }}>This folder is empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {folders.map(f => (
              <div key={f.id} className="relative group cursor-pointer" onClick={() => {
                setFolderPath([...folderPath, f]);
                navigate(`/project/${projectId}/folder/${f.id}`);
              }}>
                <div className="flex flex-col h-40 affine-card p-6 text-left">
                  <Folder size={40} style={{ color: '#60a5fa' }} className="mb-auto group-hover:scale-105 transition-transform" />
                  <h3 className="font-bold truncate">{f.name}</h3>
                </div>
                {canEdit && (
                  <button onClick={(e) => handleDeleteFolder(e, f.id)} 
                    className="absolute top-4 right-4 p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all" style={{ backgroundColor: 'var(--bg-hover)' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            {docs.map(d => (
              <div key={d.id} className="relative group cursor-pointer" onClick={() => navigate(`/document/${d.id}`)}>
                <div className="flex flex-col h-40 affine-card p-6 text-left">
                  <div className="flex justify-between items-start mb-auto">
                    <FileText size={40} style={{ color: '#818cf8' }} className="group-hover:scale-105 transition-transform" />
                    {d.is_public && <Eye size={16} className="text-green-500" title="Publically Shared" />}
                  </div>
                  <div>
                    <h3 className="font-bold truncate mb-1">{d.title}</h3>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Updated {new Date(d.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {canEdit && (
                  <button onClick={(e) => handleDeleteDoc(e, d.id)} 
                    className="absolute top-4 right-4 p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all" style={{ backgroundColor: 'var(--bg-hover)' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <SubfolderModal visible={showFolderModal} onClose={() => setShowFolderModal(false)} onSubmit={handleCreateFolder} parentId={folderId} />
      <RenameModal visible={showDocModal} title="New Document Title" initialValue="" onClose={() => setShowDocModal(false)} onSubmit={handleCreateDoc} />
      {showMembers && (
        <MembersPanel
          members={members}
          userRole={project.role}
          projectId={projectId}
          onRemoveMember={handleRemoveMember}
          onRoleChange={handleRoleChange}
          onInvite={() => setShowInvite(true)}
          onClose={() => setShowMembers(false)}
        />
      )}
      <InviteModal visible={showInvite} onClose={() => setShowInvite(false)} onInvite={handleInviteMember} />
    </main>
  );
}

function EditorView() {
  const { docId } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [project, setProject] = useState(null);
  const [releases, setReleases] = useState([]);
  
  const [draftContent, setDraftContent] = useState([]);
  const [saveState, setSaveState] = useState(false);
  const saveTimeoutRef = useRef(null);

  const [showReleases, setShowReleases] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [activeRelease, setActiveRelease] = useState(null);
  const [showReleaseView, setShowReleaseView] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const d = await api.getDocument(docId);
      setDoc(d);
      setDraftContent(d.content || []);
      
      const p = await api.getProject(d.project_id);
      setProject(p);
      
      const r = await api.getDocumentReleases(docId);
      setReleases(r);
    } catch (err) { console.error(err); }
  }, [docId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleEditorChange = useCallback(async (content) => {
    if (!doc) return;
    setDraftContent(content);
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      setSaveState(true);
      try {
        await api.updateDocument(doc.id, { content });
        setDoc(prev => ({ ...prev, updated_at: new Date().toISOString() }));
        setTimeout(() => setSaveState(false), 2000);
      } catch (err) { setSaveState(false); }
    }, 1500);
  }, [doc]);

  const handlePublishRelease = async (title, desc) => {
    await api.createRelease(doc.id, title, desc);
    setShowReleaseModal(false);
    const r = await api.getDocumentReleases(docId);
    setReleases(r);
    // Reload doc to get updated public_token if it was set
    const updatedDoc = await api.getDocument(docId);
    setDoc(updatedDoc);
    alert('Release published successfully!');
  };

  const handleToggleShare = async (isPublic) => {
    const updated = await api.shareDocument(doc.id, isPublic);
    // update is_public and public_token from the result
    setDoc(prev => ({ ...prev, is_public: updated.is_public, public_token: updated.public_token }));
    setShowShare(false);
  };

  if (!doc || !project) return null;

  const canEdit = project.role === 'owner' || project.role === 'editor';
  const isOwner = project.role === 'owner';

  return (
    <>
      <main className="flex-1 flex flex-col overflow-hidden relative" style={{ backgroundColor: 'var(--bg-main)' }}>
        <header className="px-8 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(doc.folder_id ? `/project/${doc.project_id}/folder/${doc.folder_id}` : `/project/${doc.project_id}`)} 
              className="p-2 rounded-xl transition-colors" style={{ color: 'var(--text-muted)' }}>
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold leading-none mb-1">{doc.title}</h1>
              <div className="flex items-center gap-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1"><Clock size={12} /> Draft updated {new Date(doc.updated_at).toLocaleTimeString()}</span>
                {saveState && <span className="text-blue-500 flex items-center gap-1 font-bold animate-pulse"><Loader2 size={12} className="animate-spin" /> Saving...</span>}
                {!saveState && <span className="text-green-500 flex items-center gap-1 font-bold"><Check size={12} /> Saved to cloud</span>}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 rounded-lg p-1 mr-2" style={{ backgroundColor: 'var(--bg-hover)' }}>
                <button onClick={() => { setShowReleases(!showReleases); }}
                  className="px-3 py-1.5 text-sm font-bold rounded-md transition-all flex items-center gap-2"
                  style={{ 
                    backgroundColor: showReleases ? 'var(--bg-card)' : 'transparent',
                    color: showReleases ? 'var(--primary)' : 'var(--text-muted)',
                    boxShadow: showReleases ? 'var(--shadow-sm)' : 'none'
                  }}>
                  <GitCommit size={16} /> Changelog
                </button>
              </div>

            {isOwner && (
              <button onClick={() => setShowShare(true)}
                className={`affine-button-outline px-4 py-2 text-sm flex items-center gap-2 ${
                  doc.is_public ? 'border-green-500 text-green-600' : ''
                }`}>
                {doc.is_public ? <><Unlock size={16} /> Shared</> : <><Lock size={16} /> Share</>}
              </button>
            )}
            {canEdit && (
              <button onClick={() => setShowReleaseModal(true)} className="affine-button px-5 py-2 text-sm flex items-center gap-2">
                <GitCommit size={16} /> Release
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-main)' }}>
          <div className="max-w-4xl mx-auto px-12 pt-6 pb-16">
            <div className="border px-4 py-3 rounded-xl mb-8 flex items-center gap-3 text-sm font-medium" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)', color: '#d97706' }}>
              <FileText size={18} />
              You are editing the Draft version. Public viewers will not see these changes until you "Release".
            </div>
            <div className="rounded-2xl px-10 py-10" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <BlockNoteEditor 
                initialContent={draftContent} 
                onChange={handleEditorChange}
                editable={canEdit}
              />
            </div>
          </div>
        </div>
      </main>

      {showReleases && (
        <ReleasePanel releases={releases} userRole={project.role} onViewRelease={(r) => { setActiveRelease(r); setShowReleaseView(true); }} onOpenPublish={() => setShowReleaseModal(true)} />
      )}

      <ReleaseModal visible={showReleaseModal} onClose={() => setShowReleaseModal(false)} onSave={handlePublishRelease} />
      <ShareModal visible={showShare} onClose={() => setShowShare(false)} isPublic={doc.is_public} onToggleShare={handleToggleShare} shareUrl={doc ? `${window.location.origin}/share/${doc.public_token}` : ''} />
      <ReleaseViewModal release={activeRelease} visible={showReleaseView} onClose={() => setShowReleaseView(false)} />
    </>
  );
}

function ShareView() {
  const { token } = useParams();
  const [doc, setDoc] = useState(null);
  const [releases, setReleases] = useState([]);
  const [selectedRelease, setSelectedRelease] = useState(null); // null = latest published
  const [darkMode, setDarkMode] = useState(localStorage.getItem('docflow-theme') === 'dark');

  useEffect(() => {
    if (darkMode) { document.documentElement.classList.add('dark'); } 
    else { document.documentElement.classList.remove('dark'); }
  }, [darkMode]);

  useEffect(() => {
    fetch(`/api/share/${token}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setDoc(data);
          setReleases(data.releases || []);
        }
      });
  }, [token]);

  if (!doc) return <div className="p-10 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</div>;

  // The content shown is either a specific release snapshot or the latest published content
  const displayContent = selectedRelease
    ? (typeof selectedRelease.content === 'string' ? JSON.parse(selectedRelease.content) : selectedRelease.content)
    : doc.content;
  const displayTitle = doc.title;

  return (
    <div className="h-screen flex flex-col w-full" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
      {/* Top bar */}
      <div className="h-14 border-b flex items-center px-6 gap-3 sticky top-0 z-40 flex-shrink-0" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: 'var(--primary)' }}>
          <FileText size={16} strokeWidth={2.5} />
        </div>
        <span className="font-bold text-lg">Docflow</span>
        {selectedRelease && (
          <span className="ml-2 text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#d97706' }}>
            Viewing: {selectedRelease.title} (v{selectedRelease.version_number})
          </span>
        )}
        <button onClick={() => setDarkMode(!darkMode)} className="ml-auto p-2 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <span className="text-xs font-bold px-2 py-1 rounded flex items-center gap-1" style={{ backgroundColor: 'rgba(30,150,235,0.1)', color: 'var(--primary)' }}>
          <Eye size={14} /> SOP View
        </span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Document */}
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-main)' }}>
          <div className="max-w-4xl mx-auto px-8 py-10">
            <div className="rounded-2xl px-10 py-10" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <h1 className="text-4xl font-extrabold mb-4" style={{ color: 'var(--text-main)' }}>{displayTitle}</h1>
              <div className="text-sm font-medium mb-8 pb-6 border-b flex flex-wrap items-center gap-2" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
                <span>Published by {doc.author_name}</span>
                <span>·</span>
                <span>Last updated {new Date(doc.updated_at).toLocaleDateString()}</span>
                {selectedRelease && (
                  <>
                    <span>·</span>
                    <span className="font-bold" style={{ color: '#d97706' }}>Snapshot: {selectedRelease.title}</span>
                    <button
                      onClick={() => setSelectedRelease(null)}
                      className="ml-2 text-xs px-2 py-0.5 rounded-lg font-bold"
                      style={{ backgroundColor: 'rgba(30,150,235,0.1)', color: 'var(--primary)' }}
                    >
                      View Latest
                    </button>
                  </>
                )}
              </div>
              <BlockNoteEditor initialContent={displayContent} editable={false} key={selectedRelease?.id || 'latest'} />
            </div>
          </div>
        </div>

        {/* Changelog sidebar */}
        <div className="w-80 border-l flex flex-col flex-shrink-0" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="px-5 pt-5 pb-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <GitCommit size={16} style={{ color: 'var(--primary)' }} /> Changelog History
            </h2>
            {selectedRelease && (
              <button onClick={() => setSelectedRelease(null)} className="mt-2 text-xs font-bold" style={{ color: 'var(--primary)' }}>
                ← Back to latest
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-2">
            {/* Latest / current entry */}
            <button
              onClick={() => setSelectedRelease(null)}
              className="w-full text-left px-3 py-3 rounded-xl transition-colors"
              style={{
                backgroundColor: !selectedRelease ? 'rgba(30,150,235,0.1)' : 'transparent',
                border: !selectedRelease ? '1px solid rgba(30,150,235,0.2)' : '1px solid transparent',
              }}
              onMouseEnter={e => { if (selectedRelease) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
              onMouseLeave={e => { if (selectedRelease) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: !selectedRelease ? 'var(--primary)' : 'var(--text-muted)' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>Latest Published</span>
              </div>
            </button>

            {/* Divider */}
            {releases.length > 0 && (
              <p className="text-xs font-bold pt-2 pb-1" style={{ color: 'var(--text-muted)' }}>Previous versions</p>
            )}

            {releases.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRelease(r)}
                className="w-full text-left px-3 py-3 rounded-xl transition-colors"
                style={{
                  backgroundColor: selectedRelease?.id === r.id ? 'rgba(30,150,235,0.1)' : 'transparent',
                  border: selectedRelease?.id === r.id ? '1px solid rgba(30,150,235,0.2)' : '1px solid transparent',
                }}
                onMouseEnter={e => { if (selectedRelease?.id !== r.id) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (selectedRelease?.id !== r.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: selectedRelease?.id === r.id ? 'var(--primary)' : 'var(--text-muted)' }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-bold truncate" style={{ color: 'var(--text-main)' }}>{r.title}</span>
                      <span className="text-xs font-mono ml-2 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>v{r.version_number}</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{r.author} · {new Date(r.created_at).toLocaleDateString()}</p>
                    {r.description && (
                      <p className="text-xs mt-1.5 truncate" style={{ color: 'var(--text-muted)' }}>{r.description}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}

            {releases.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No previous versions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
