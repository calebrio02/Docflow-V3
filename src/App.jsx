import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText, Folder, Plus, LogOut, Loader2,
  Users, GitCommit, Copy, Eye, Unlock, Lock, Clock,
  Check, Trash2, ChevronDown, FolderOpen,
  Undo, Redo, Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Quote, AlignLeft, AlignCenter, AlignRight,
  Minus, Table as TableIcon, Image as ImageIcon, Video
} from 'lucide-react';

import { api } from './api';
import { LoginScreen, RegisterScreen, InviteAcceptScreen } from './components/auth/AuthScreens';
import { 
  CreateProjectModal, ReleaseModal, ShareModal, 
  InviteModal, ReleaseViewModal, RenameModal, SubfolderModal 
} from './components/modals/DocModals';
import { MembersPanel, ReleasePanel } from './components/panels/SidePanels';
import { BlockNoteEditor } from './components/Editor/BlockNoteEditor';

export default function App() {
  const token = localStorage.getItem('docflow-token');
  const isLoggedIn = !!token;

  const [currentView, setCurrentView] = useState('app'); // app | invite-accept | share
  const [inviteToken, setInviteToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showReleases, setShowReleases] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showRelease, setShowRelease] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [activeRelease, setActiveRelease] = useState(null);
  const [showReleaseView, setShowReleaseView] = useState(false);
  const [showSubfolderModal, setShowSubfolderModal] = useState(false);
  const [subfolderParentId, setSubfolderParentId] = useState(null);
  const [renameDocModal, setRenameDocModal] = useState(false);
  const [renameDocTitle, setRenameDocTitle] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draftContent, setDraftContent] = useState([]);

  // ─── Public Share View State ───
  const [shareDoc, setShareDoc] = useState(null);
  const [shareReleases, setShareReleases] = useState([]);

  useEffect(() => {
    const init = async () => {
      const path = window.location.pathname;
      if (path.startsWith('/invite/')) {
        setInviteToken(path.replace('/invite/', ''));
        setCurrentView('invite-accept');
      } else if (path.startsWith('/share/')) {
        const shareToken = path.replace('/share/', '');
        try {
          const res = await fetch(`/api/share/${shareToken}`);
          if (res.ok) {
            const data = await res.json();
            setShareDoc(data);
            setShareReleases(data.releases || []);
            setCurrentView('share');
          }
        } catch (err) {
          console.error('Failed to load shared document:', err);
        }
      }
    };
    init();
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const data = await api.me();
      if (data) {
        setCurrentUser(data);
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  }, []);

  const loadDocuments = useCallback(async (projectId) => {
    try {
      const data = await api.projectDocuments(projectId);
      if (data) setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  }, []);

  const loadMembers = useCallback(async (projectId) => {
    try {
      const data = await api.projectMembers(projectId);
      if (data) setMembers(data);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadUser();
  }, [isLoggedIn, loadUser]);

  useEffect(() => {
    if (activeProject) {
      loadDocuments(activeProject.project_id);
      loadMembers(activeProject.project_id);
    }
  }, [activeProject, loadDocuments, loadMembers]);

  const handleLogin = async (username, password) => {
    await api.login(username, password);
  };

  const handleRegister = async (username, password, invitationToken) => {
    await api.register(username, password, invitationToken);
  };

  const handleInviteAccept = async (token, username, email, password) => {
    await api.acceptInvite(token, username, email, password);
  };

  const handleLogout = () => {
    api.logout();
    window.location.reload();
  };

  const handleCreateProject = async (name, description) => {
    try {
      await api.createProject(name, description);
      await loadUser();
      setShowCreateProject(false);
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const handleCreateDocument = async () => {
    if (!activeProject) return;
    try {
      const doc = await api.createDocument(`Untitled Document`, activeProject.project_id);
      await loadDocuments(activeProject.project_id);
      setActiveDoc(doc);
      setDraftContent([]);
    } catch (err) {
      console.error('Failed to create document:', err);
    }
  };

  const handleDocSelect = async (doc) => {
    setLoading(true);
    try {
      const data = await api.getDocument(doc.id);
      if (data) {
        setActiveDoc(data);
        setDraftContent(data.content || []);
      }
    } catch (err) {
      console.error('Failed to load document:', err);
    }
    setLoading(false);
  };

  const handleRenameDocument = async (newTitle) => {
    if (!activeDoc) return;
    try {
      await api.updateDocument(activeDoc.id, { title: newTitle });
      setActiveDoc(prev => ({ ...prev, title: newTitle }));
      await loadDocuments(activeProject.project_id);
      setRenameDocModal(false);
    } catch (err) {
      console.error('Failed to rename document:', err);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.deleteDocument(docId);
      await loadDocuments(activeProject.project_id);
      if (activeDoc?.id === docId) {
        setActiveDoc(null);
        setDraftContent([]);
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const handleCreateSubfolder = async (name, parentId) => {
    if (!activeProject) return;
    try {
      await api.createFolder(name, activeProject.project_id, parentId || null);
      setShowSubfolderModal(false);
      setSubfolderParentId(null);
      await loadDocuments(activeProject.project_id);
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  };

  const handleEditorChange = useCallback(async (content) => {
    if (!activeDoc) return;
    setDraftContent(content);
    // Debounced save logic could go here, but for now we'll just store in state
    // and maybe save on blur or button click if auto-save is too aggressive
  }, [activeDoc]);

  const handleManualSave = async () => {
    if (!activeDoc) return;
    setSaveState(true);
    try {
      await api.updateDocument(activeDoc.id, { content: draftContent });
      setTimeout(() => setSaveState(false), 2000);
    } catch (err) {
      console.error('Failed to save document:', err);
      setSaveState(false);
    }
  };

  const handlePublish = async (title, description) => {
    if (!activeDoc) return;
    try {
      await api.createRelease(activeDoc.id, title, description);
      setShowRelease(false);
      // Optional: reload releases if panel is open
    } catch (err) {
      console.error('Failed to publish release:', err);
    }
  };

  const handleToggleShare = async (isPublic) => {
    if (!activeDoc) return;
    try {
      await api.shareDocument(activeDoc.id, isPublic);
      setActiveDoc(prev => ({ ...prev, is_public: isPublic }));
      setShowShare(false);
    } catch (err) {
      console.error('Failed to toggle share:', err);
    }
  };

  const handleInviteMember = async (email, role) => {
    if (!activeProject) return;
    try {
      await api.createInvite(activeProject.project_id, email, role);
      setShowInvite(false);
      alert('Invitation sent!');
    } catch (err) {
      console.error('Failed to create invite:', err);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!activeProject) return;
    try {
      await api.removeMember(activeProject.project_id, userId);
      await loadMembers(activeProject.project_id);
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  const handleRoleChange = async (userId, role) => {
    if (!activeProject) return;
    try {
      await api.updateMemberRole(activeProject.project_id, userId, role);
      await loadMembers(activeProject.project_id);
    } catch (err) {
      console.error('Failed to change role:', err);
    }
  };

  const handleViewRelease = async (release) => {
    try {
      const fullRelease = await api.getRelease(activeDoc.id, release.id);
      setActiveRelease(fullRelease);
      setShowReleaseView(true);
    } catch (err) {
      console.error('Failed to load release:', err);
    }
  };

  const handleCopyDocument = async () => {
    if (!activeDoc || !activeProject) return;
    try {
      const newDoc = await api.copyDocument(activeDoc.id, activeProject.project_id);
      await loadDocuments(activeProject.project_id);
      setActiveDoc(newDoc);
    } catch (err) {
      console.error('Failed to copy document:', err);
    }
  };

  // ─── Render Logic ───

  if (currentView === 'invite-accept') return <InviteAcceptScreen token={inviteToken} onAccept={handleInviteAccept} />;
  if (!isLoggedIn) return <LoginScreen onLogin={handleLogin} />;
  
  if (currentView === 'share' && shareDoc) {
    return (
      <div className="h-screen flex flex-col bg-white">
        <div className="h-12 border-b flex items-center px-4 gap-3">
          <FileText size={20} className="text-blue-600" />
          <span className="font-semibold">Docflow</span>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded ml-auto">Public View</span>
        </div>
        <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
          <h1 className="text-4xl font-bold mb-2">{shareDoc.title}</h1>
          <div className="text-sm text-slate-500 mb-8 border-b pb-4">
             By {shareDoc.author_name} · Updated {new Date(shareDoc.updated_at).toLocaleDateString()}
          </div>
          <BlockNoteEditor initialContent={shareDoc.content} editable={false} />
          
          <div className="mt-12 pt-8 border-t">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><GitCommit /> Releases</h2>
            <div className="space-y-4">
              {shareReleases.map(r => (
                <div key={r.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold">{r.title} <span className="text-xs font-normal text-slate-500 ml-2">v{r.version_number}</span></div>
                  <div className="text-xs text-slate-500 mb-2">{new Date(r.created_at).toLocaleString()}</div>
                  {r.description && <div className="text-sm text-slate-600">{r.description}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!activeProject && projects.length === 0) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
            <Folder size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Docflow</h1>
          <p className="text-slate-500 mb-8">Ready to streamline your documentation? Create your first project to begin.</p>
          <button onClick={() => setShowCreateProject(true)}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
            <Plus size={20} /> Create New Project
          </button>
        </div>
        <CreateProjectModal visible={showCreateProject} onClose={() => setShowCreateProject(false)} onCreate={handleCreateProject} />
      </div>
    );
  }

  const userRole = activeProject?.role;
  const canEdit = userRole === 'owner' || userRole === 'editor';
  const isOwner = userRole === 'owner';

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      {/* Top Navigation */}
      <nav className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-100">
              <FileText size={18} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg tracking-tight">Docflow</span>
          </div>
          
          <div className="h-6 w-px bg-slate-200" />
          
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1 border border-slate-100">
            <select
              value={activeProject?.project_id || ''}
              onChange={(e) => {
                const proj = projects.find(p => p.project_id === e.target.value);
                if (proj) { setActiveProject(proj); setActiveDoc(null); setDraftContent([]); }
              }}
              className="bg-transparent px-3 py-1 text-sm font-semibold focus:outline-none cursor-pointer"
            >
              {projects.map(p => (
                <option key={p.project_id} value={p.project_id}>{p.name}</option>
              ))}
            </select>
            <button onClick={() => setShowCreateProject(true)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500 hover:text-blue-600" title="New Project">
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeDoc && (
            <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-100 mr-2">
              <button onClick={() => { setShowMembers(!showMembers); setShowReleases(false); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  showMembers ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}>
                <Users size={14} /> <span className="hidden sm:inline">Members</span>
              </button>
              <button onClick={() => { setShowReleases(!showReleases); setShowMembers(false); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  showReleases ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}>
                <GitCommit size={14} /> <span className="hidden sm:inline">Releases</span>
              </button>
            </div>
          )}
          <div className="h-8 w-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 border border-white shadow-sm cursor-pointer hover:ring-2 hover:ring-blue-100 transition-all">
            {currentUser?.username?.charAt(0).toUpperCase()}
          </div>
          <button onClick={handleLogout} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors text-slate-400" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-slate-100 flex flex-col flex-shrink-0 shadow-sm z-30">
          <div className="p-4 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Workspace</h2>
            <div className="flex gap-1">
              <button onClick={handleCreateDocument} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-all" title="New Document">
                <Plus size={16} />
              </button>
              <button onClick={() => setShowSubfolderModal(true)} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-all" title="New Folder">
                <Folder size={16} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {documents.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <p className="text-sm">No documents found.</p>
              </div>
            ) : (
              <>
                {documents.filter(d => !d.folder_id).map(doc => (
                  <div key={doc.id}
                    onClick={() => handleDocSelect(doc)}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all border border-transparent ${
                      activeDoc?.id === doc.id 
                        ? 'bg-blue-50 border-blue-100 text-blue-700 font-semibold shadow-sm' 
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}>
                    <FileText size={18} className={activeDoc?.id === doc.id ? 'text-blue-600' : 'text-slate-400'} />
                    <span className="flex-1 truncate text-sm">{doc.title}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc.id); }}
                        className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </aside>

        {/* Editor Area */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
          {activeDoc ? (
            <>
              <header className="px-8 pt-8 pb-4 flex items-center justify-between">
                <div className="flex-1 max-w-3xl">
                  <input
                    type="text"
                    value={activeDoc.title}
                    onChange={(e) => setActiveDoc({ ...activeDoc, title: e.target.value })}
                    onBlur={() => handleRenameDocument(activeDoc.title)}
                    className="text-4xl font-extrabold text-slate-900 bg-transparent border-none focus:outline-none w-full placeholder:text-slate-200"
                    placeholder="Document Title"
                  />
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><Eye size={12} /> {activeDoc.author_name}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> Updated {new Date(activeDoc.updated_at).toLocaleDateString()}</span>
                    {saveState && <span className="text-green-600 flex items-center gap-1 font-bold animate-pulse"><Check size={12} /> Auto-saved</span>}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button onClick={handleManualSave} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2">
                    Save Changes
                  </button>
                  {isOwner && (
                    <button onClick={() => setShowShare(true)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        activeDoc.is_public ? 'bg-green-50 border-green-200 text-green-600 shadow-sm shadow-green-100' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                      }`}>
                      {activeDoc.is_public ? <Unlock size={18} /> : <Lock size={18} />}
                    </button>
                  )}
                  <button onClick={handleCopyDocument} className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
                    <Copy size={18} />
                  </button>
                </div>
              </header>

              <div className="flex-1 px-8 py-4 overflow-y-auto">
                <div className="max-w-4xl mx-auto h-full">
                  <BlockNoteEditor 
                    initialContent={draftContent} 
                    onChange={handleEditorChange}
                    editable={canEdit}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-12">
              <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-slate-100 shadow-inner">
                <FileText size={64} strokeWidth={1} />
              </div>
              <h3 className="text-xl font-bold text-slate-400 mb-2">No Document Selected</h3>
              <p className="text-sm text-slate-400 max-w-xs text-center">Pick a document from the sidebar or create a new one to start working on your flow.</p>
              <button onClick={handleCreateDocument} className="mt-8 px-6 py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold hover:border-blue-200 hover:text-blue-600 transition-all flex items-center gap-2 shadow-sm">
                <Plus size={18} /> Create New Document
              </button>
            </div>
          )}
        </main>

        {/* Right Panels */}
        {showMembers && (
          <MembersPanel
            members={members}
            userRole={userRole}
            onRemoveMember={handleRemoveMember}
            onRoleChange={handleRoleChange}
            onInvite={() => setShowInvite(true)}
          />
        )}
        {showReleases && activeDoc && (
          <ReleasePanel
            releases={[]} // Need to implement fetchReleases
            userRole={userRole}
            onViewRelease={handleViewRelease}
            onOpenPublish={() => setShowRelease(true)}
          />
        )}
      </div>

      {/* Modals */}
      <CreateProjectModal visible={showCreateProject} onClose={() => setShowCreateProject(false)} onCreate={handleCreateProject} />
      <ReleaseModal visible={showRelease} onClose={() => setShowRelease(false)} onSave={handlePublish} />
      <ShareModal visible={showShare} onClose={() => setShowShare(false)} 
        isPublic={activeDoc?.is_public} onToggleShare={handleToggleShare}
        shareUrl={activeDoc ? `${window.location.origin}/share/${activeDoc.public_token}` : ''} />
      <InviteModal visible={showInvite} onClose={() => setShowInvite(false)} onInvite={handleInviteMember} />
      <RenameModal visible={renameDocModal} title="Rename Document" initialValue={renameDocTitle} onClose={() => setRenameDocModal(false)} onSubmit={handleRenameDocument} />
      <SubfolderModal visible={showSubfolderModal} onClose={() => setShowSubfolderModal(false)} onSubmit={handleCreateSubfolder} parentId={subfolderParentId} />
      <ReleaseViewModal release={activeRelease} onClose={() => setShowReleaseView(false)} />
    </div>
  );
}
