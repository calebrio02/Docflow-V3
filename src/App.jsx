import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from './extensions/imageResize';
import VideoExtension from './extensions/videoResize';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import Link from '@tiptap/extension-link';
import TaskItem from '@tiptap/extension-task-item';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  CodeXml,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Undo,
  Redo,
  FileText,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table as TableIcon,
  Trash2,
  Link2,
  Image as ImageIcon,
  Folder,
  FolderOpen,
  File,
  ChevronRight,
  ChevronDown,
  Plus,
  LogOut,
  Loader2,
  Video,
} from 'lucide-react';
import { api } from './api';

const initialContent = `
<h1>Welcome to Docflow</h1>
<p>This is a <strong>draft-mode</strong> editor powered by TipTap. Start writing your next idea here.</p>
<hr />
<h2>Quick Reference</h2>
<p>Use the toolbar above to format your content. Here are some examples of what you can create:</p>
<ul>
<li><strong>Bullet lists</strong> — for quick notes and checklists</li>
<li><strong>Numbered lists</strong> — for ordered steps and rankings</li>
<li><strong>Blockquotes</strong> — for citations and callouts</li>
<li><strong>Tables</strong> — for structured data</li>
<li><strong>Images</strong> — paste (Ctrl+V) or use the toolbar button. Drag the corner handle to resize.</li>
<li><strong>Dividers</strong> — to separate sections</li>
<li><strong>Todo Lists</strong> — for checkable items</li>
<li><strong>Videos</strong> — upload MP4/WEBM videos, they play inline</li>
</ul>
<ul data-type="taskList">
<li data-type="taskItem" data-checked="false"><p>Build editor with TipTap</p></li>
<li data-type="taskItem" data-checked="true"><p>Add tables and alignment</p></li>
<li data-type="taskItem" data-checked="true"><p>Add todo lists</p></li>
<li data-type="taskItem" data-checked="true"><p>Add images with resize</p></li>
<li data-type="taskItem" data-checked="false"><p>Connect backend (Fase 2)</p></li>
</ul>
<blockquote>
<p>This is a blockquote. Great for highlighting important thoughts.</p>
</blockquote>
<h3>Inline Formatting</h3>
<p>You can write <code>inline code</code> for technical references, or use a full code block:</p>
<pre><code>function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
</code></pre>
<h3>Table Example</h3>
<table>
<thead>
<tr>
<th>Feature</th>
<th>Status</th>
<th>Priority</th>
</tr>
</thead>
<tbody>
<tr>
<td>Editor</td>
<td>Done</td>
<td>High</td>
</tr>
<tr>
<td>Tables</td>
<td>Done</td>
<td>Medium</td>
</tr>
<tr>
<td>Backend</td>
<td>Pending</td>
<td>High</td>
</tr>
</tbody>
</table>
<hr />
<p>Keep drafting — your changes are saved automatically.</p>
`;

/* ─── Login Screen ─── */
function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.login(username, password);
      window.location.reload();
    } catch {
      setError('Invalid credentials');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="text-blue-600" size={32} strokeWidth={2} />
          <h1 className="text-2xl font-bold text-slate-800">Docflow</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Folder Modal ─── */
function FolderModal({ visible, onClose, onSubmit, folders }) {
  const [name, setName] = useState('');
  const [parentFolderId, setParentFolderId] = useState('');

  useEffect(() => {
    if (visible) {
      setName('');
      setParentFolderId('');
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 w-[400px]">
        <p className="text-sm font-medium text-slate-800 mb-3">New Folder</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Folder name"
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) onSubmit(name.trim(), parentFolderId || null);
          }}
        />
        <select
          value={parentFolderId}
          onChange={(e) => setParentFolderId(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
        >
          <option value="">Root level</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (name.trim()) {
                onSubmit(name.trim(), parentFolderId || null);
              }
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={!name.trim()}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Rename Modal ─── */
function RenameModal({ visible, title, initialValue, onClose, onSubmit }) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (visible) {
      setValue(initialValue || '');
    }
  }, [visible, initialValue]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 w-[400px]">
        <p className="text-sm font-medium text-slate-800 mb-3">{title}</p>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) onSubmit(value.trim());
          }}
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (value.trim()) {
                onSubmit(value.trim());
              }
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={!value.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Context Menu ─── */
function TableContextMenu({ visible, x, y, onClose, onAction }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!visible) return;

    const handler = (e) => {
      if (!e.target.closest('[data-table-menu]')) onClose();
    };
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };

    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onEsc);
    };
  }, [visible, onClose]);

  useEffect(() => {
    if (!visible || !menuRef.current) return;

    const el = menuRef.current;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const adjustedX = x + rect.width > vw ? x - (rect.width - (vw - x)) : x;
    const adjustedY = y + rect.height > vh ? y - (rect.height - (vh - y)) : y;

    el.style.left = `${Math.max(8, adjustedX)}px`;
    el.style.top = `${Math.max(8, adjustedY)}px`;
  }, [visible, x, y]);

  if (!visible) return null;

  const menuStyle = {
    position: 'fixed',
    top: `${y}px`,
    left: `${x}px`,
  };

  const itemClass =
    'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors text-left';
  const dangerClass =
    'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors text-left';
  const labelClass = 'px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400';

  return (
    <div
      ref={menuRef}
      data-table-menu
      style={menuStyle}
      className="fixed z-[100] min-w-[210px] bg-white rounded-xl shadow-xl border border-slate-200 py-1 animate-in"
    >
      <div className={labelClass}>Filas</div>
      <button type="button" className={itemClass} onClick={() => onAction('rowAbove')}>
        Insertar arriba
      </button>
      <button type="button" className={itemClass} onClick={() => onAction('rowBelow')}>
        Insertar abajo
      </button>
      <button type="button" className={dangerClass} onClick={() => onAction('deleteRow')}>
        <Trash2 size={14} />
        Eliminar fila
      </button>

      <div className="my-1 border-t border-slate-100" />

      <div className={labelClass}>Columnas</div>
      <button type="button" className={itemClass} onClick={() => onAction('colLeft')}>
        Insertar izquierda
      </button>
      <button type="button" className={itemClass} onClick={() => onAction('colRight')}>
        Insertar derecha
      </button>
      <button type="button" className={dangerClass} onClick={() => onAction('deleteCol')}>
        <Trash2 size={14} />
        Eliminar columna
      </button>

      <div className="my-1 border-t border-slate-100" />

      <button type="button" className={dangerClass} onClick={() => onAction('deleteTable')}>
        <Trash2 size={14} />
        Eliminar tabla
      </button>
    </div>
  );
}

/* ─── Link Modal ─── */
function LinkModal({ visible, currentUrl, onClose, onSetLink, onUnlink }) {
  const [url, setUrl] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setUrl(currentUrl || '');
      if (inputRef.current) {
        setTimeout(() => inputRef.current.focus(), 50);
      }
    }
  }, [visible, currentUrl]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && url.trim()) handleConfirm();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible, url, onClose, onSetLink]);

  const handleConfirm = () => {
    if (!url.trim()) return;
    onSetLink(url.trim());
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 w-[380px]">
        <p className="text-sm font-medium text-slate-800 mb-3">
          {currentUrl ? 'Editar hipervínculo' : 'Añadir hipervínculo'}
        </p>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {currentUrl && (
            <button
              type="button"
              onClick={() => { onUnlink(); onClose(); }}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sidebar ─── */
function Sidebar({
  folders,
  documents,
  activeFolderId,
  activeDocId,
  onFolderSelect,
  onDocSelect,
  onCreateFolder,
  onCreateDocument,
  onRenameFolder,
  onRenameDocument,
  onDeleteFolder,
  onDeleteDocument,
}) {
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  useEffect(() => {
    if (activeFolderId) {
      setExpandedFolders((prev) => new Set(prev).add(activeFolderId));
    }
  }, [activeFolderId]);

  const toggleFolder = (folderId) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const getChildren = (parentId) => {
    return folders
      .filter((f) => f.parent_folder_id === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const getDocsInFolder = (folderId) => {
    return documents
      .filter((d) => d.folder_id === folderId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  function renderFolderTree(parentId, depth = 0) {
    const children = getChildren(parentId);
    return children.map((folder) => {
      const hasChildren = getChildren(folder.id).length > 0;
      const isExpanded = expandedFolders.has(folder.id);
      const folderDocs = getDocsInFolder(folder.id);
      const hasDocs = folderDocs.length > 0;

      return (
        <div key={folder.id}>
          <div
            className={`group flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-lg cursor-pointer transition-colors ${
              activeFolderId === folder.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
            }`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => onFolderSelect(folder.id)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="flex-shrink-0 p-0.5 hover:bg-slate-200 rounded"
            >
              {hasChildren || hasDocs ? (
                isExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )
              ) : (
                <span className="w-3.5" />
              )}
            </button>
            {isExpanded ? <FolderOpen size={16} className="text-blue-500 flex-shrink-0" /> : <Folder size={16} className="text-amber-500 flex-shrink-0" />}
            <span className="flex-1 truncate">{folder.name}</span>
            <div className="flex items-center gap-1 opacity-0 hover:opacity-100 group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRenameFolder(folder.id, folder.name);
                }}
                className="p-1 hover:bg-slate-200 rounded"
              >
                <span className="text-xs">✏️</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFolder(folder.id);
                }}
                className="p-1 hover:bg-red-100 rounded"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          {isExpanded && (
            <>
              {folderDocs.map((doc) => (
                <div
                  key={doc.id}
                  className={`group flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-lg cursor-pointer transition-colors ${
                    activeDocId === doc.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  style={{ paddingLeft: `${(depth + 1) * 16 + 24}px` }}
                  onClick={() => onDocSelect(doc)}
                >
                  <File size={14} className="flex-shrink-0" />
                  <span className="flex-1 truncate">{doc.name}</span>
                  <div className="flex items-center gap-1 opacity-0 hover:opacity-100 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRenameDocument(doc.id, doc.name);
                      }}
                      className="p-1 hover:bg-slate-200 rounded"
                    >
                      <span className="text-xs">✏️</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDocument(doc.id);
                      }}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {isExpanded && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateDocument(folder.id);
                  }}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ml-6"
                >
                  <Plus size={12} />
                  New Document
                </button>
              )}
            </>
          )}
          {renderFolderTree(folder.id, depth + 1)}
        </div>
      );
    });
  }

  const topLevelFolders = getChildren(null);

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="p-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Workspace</h2>
          <button
            onClick={() => onCreateFolder()}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
            title="New Folder"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {topLevelFolders.length === 0 && documents.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400">
            <Folder size={32} className="mx-auto mb-2 opacity-50" />
            <p>No folders yet</p>
            <button
              onClick={() => onCreateFolder()}
              className="mt-2 text-blue-600 hover:underline text-xs"
            >
              Create your first folder
            </button>
          </div>
        ) : (
          <>
            {renderFolderTree(null)}
            {documents.filter((d) => !d.folder_id).length > 0 && (
              <>
                <div className="mt-3 mb-2 px-2 text-xs font-semibold text-slate-400 uppercase">
                  Root Documents
                </div>
                {documents
                  .filter((d) => !d.folder_id)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className={`group flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-lg cursor-pointer transition-colors ${
                        activeDocId === doc.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                      onClick={() => onDocSelect(doc)}
                    >
                      <File size={14} className="flex-shrink-0" />
                      <span className="flex-1 truncate">{doc.name}</span>
                      <div className="flex items-center gap-1 opacity-0 hover:opacity-100 group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRenameDocument(doc.id, doc.name);
                          }}
                          className="p-1 hover:bg-slate-200 rounded"
                        >
                          <span className="text-xs">✏️</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDocument(doc.id);
                          }}
                          className="p-1 hover:bg-red-100 rounded"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Toolbar ─── */
function Toolbar({ editor, onOpenLinkModal, onInsertImage, onInsertVideo, selectedImagePos, selectedImage, selectedVideoPos, selectedVideo }) {
  const currentLink = editor?.isActive('link') ? editor.getAttributes('link').href : null;
  if (!editor) return null;

  const getSelectedImageAlign = () => {
    if (selectedImage === null) return null;
    try {
      const node = editor.view.state.doc.nodeAt(selectedImage);
      if (node && node.type.name === 'image') {
        return node.attrs.align || null;
      }
      return null;
    } catch {
      return null;
    }
  };

  const getSelectedVideoAlign = () => {
    if (selectedVideo === null) return null;
    try {
      const node = editor.view.state.doc.nodeAt(selectedVideo);
      if (node && node.type.name === 'video') {
        return node.attrs.align || null;
      }
      return null;
    } catch {
      return null;
    }
  };

  const buttonClass =
    'inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors';
  const activeClass =
    'inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors';
  const dividerClass = 'w-px h-6 bg-slate-300 mx-1 self-center';

  const Btn = ({ pred, icon: Icon, active }) => (
    <button
      type="button"
      className={active ? activeClass : buttonClass}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => pred()}
    >
      <Icon size={18} strokeWidth={2} />
    </button>
  );

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 bg-white flex-wrap">
      <button
        type="button"
        className={buttonClass}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo size={18} strokeWidth={2} />
      </button>
      <button
        type="button"
        className={buttonClass}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo size={18} strokeWidth={2} />
      </button>

      <div className={dividerClass} />

      <Btn
        pred={() => editor.chain().focus().toggleBold().run()}
        icon={Bold}
        active={editor.isActive('bold')}
      />
      <Btn
        pred={() => editor.chain().focus().toggleItalic().run()}
        icon={Italic}
        active={editor.isActive('italic')}
      />
      <Btn
        pred={() => editor.chain().focus().toggleStrike().run()}
        icon={Strikethrough}
        active={editor.isActive('strike')}
      />
      <Btn
        pred={() => editor.chain().focus().toggleCode().run()}
        icon={Code}
        active={editor.isActive('code')}
      />
      <button
        type="button"
        className={editor.isActive('link') ? activeClass : buttonClass}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onOpenLinkModal(currentLink)}
      >
        <Link2 size={18} strokeWidth={2} />
      </button>

      <div className={dividerClass} />

      <Btn
        pred={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        icon={Heading1}
        active={editor.isActive('heading', { level: 1 })}
      />
      <Btn
        pred={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        icon={Heading2}
        active={editor.isActive('heading', { level: 2 })}
      />
      <Btn
        pred={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        icon={Heading3}
        active={editor.isActive('heading', { level: 3 })}
      />

      <div className={dividerClass} />

      <Btn
         pred={() => {
           const pos = selectedImagePos.current;
           const vPos = selectedVideoPos.current;
           if (pos !== null) {
             const { schema, doc } = editor.view.state;
             const node = doc.nodeAt(pos);
             if (node) {
               const newNode = schema.nodes.image.create({ ...node.attrs, align: 'left' });
               editor.view.dispatch(
                 editor.view.state.tr.replaceWith(pos, pos + 1, newNode)
               );
             }
           } else if (vPos !== null) {
             const { schema, doc } = editor.view.state;
             const node = doc.nodeAt(vPos);
             if (node) {
               const newNode = schema.nodes.video.create({ ...node.attrs, align: 'left' });
               editor.view.dispatch(
                 editor.view.state.tr.replaceWith(vPos, vPos + 1, newNode)
               );
             }
           } else {
             editor.chain().focus().setTextAlign('left').run();
           }
         }}
         icon={AlignLeft}
         active={getSelectedImageAlign() === 'left' || getSelectedVideoAlign() === 'left' || editor.isActive({ textAlign: 'left' })}
       />
       <Btn
         pred={() => {
           const pos = selectedImagePos.current;
           const vPos = selectedVideoPos.current;
           if (pos !== null) {
             const { schema, doc } = editor.view.state;
             const node = doc.nodeAt(pos);
             if (node) {
               const newNode = schema.nodes.image.create({ ...node.attrs, align: 'center' });
               editor.view.dispatch(
                 editor.view.state.tr.replaceWith(pos, pos + 1, newNode)
               );
             }
           } else if (vPos !== null) {
             const { schema, doc } = editor.view.state;
             const node = doc.nodeAt(vPos);
             if (node) {
               const newNode = schema.nodes.video.create({ ...node.attrs, align: 'center' });
               editor.view.dispatch(
                 editor.view.state.tr.replaceWith(vPos, vPos + 1, newNode)
               );
             }
           } else {
             editor.chain().focus().setTextAlign('center').run();
           }
         }}
         icon={AlignCenter}
         active={getSelectedImageAlign() === 'center' || getSelectedVideoAlign() === 'center' || editor.isActive({ textAlign: 'center' })}
       />
       <Btn
         pred={() => {
           const pos = selectedImagePos.current;
           const vPos = selectedVideoPos.current;
           if (pos !== null) {
             const { schema, doc } = editor.view.state;
             const node = doc.nodeAt(pos);
             if (node) {
               const newNode = schema.nodes.image.create({ ...node.attrs, align: 'right' });
               editor.view.dispatch(
                 editor.view.state.tr.replaceWith(pos, pos + 1, newNode)
               );
             }
           } else if (vPos !== null) {
             const { schema, doc } = editor.view.state;
             const node = doc.nodeAt(vPos);
             if (node) {
               const newNode = schema.nodes.video.create({ ...node.attrs, align: 'right' });
               editor.view.dispatch(
                 editor.view.state.tr.replaceWith(vPos, vPos + 1, newNode)
               );
             }
           } else {
             editor.chain().focus().setTextAlign('right').run();
           }
         }}
         icon={AlignRight}
         active={getSelectedImageAlign() === 'right' || getSelectedVideoAlign() === 'right' || editor.isActive({ textAlign: 'right' })}
       />

      <div className={dividerClass} />

      <Btn
        pred={() => editor.chain().focus().toggleBulletList().run()}
        icon={List}
        active={editor.isActive('bulletList')}
      />
      <Btn
        pred={() => editor.chain().focus().toggleOrderedList().run()}
        icon={ListOrdered}
        active={editor.isActive('orderedList')}
      />
      <Btn
        pred={() => editor.chain().focus().toggleTaskList().run()}
        icon={CheckSquare}
        active={editor.isActive('taskList')}
      />
      <Btn
        pred={() => editor.chain().focus().toggleBlockquote().run()}
        icon={Quote}
        active={editor.isActive('blockquote')}
      />
      <Btn
        pred={() => editor.chain().focus().toggleCodeBlock().run()}
        icon={CodeXml}
        active={editor.isActive('codeBlock')}
      />

      <div className={dividerClass} />

      <Btn
        pred={() => editor.chain().focus().setHorizontalRule().run()}
        icon={Minus}
      />

      <div className={dividerClass} />

      <Btn
        pred={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        icon={TableIcon}
      />

      <div className={dividerClass} />

      <button
        type="button"
        className={buttonClass}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onInsertImage()}
      >
        <ImageIcon size={18} strokeWidth={2} />
      </button>

      <div className={dividerClass} />

      <button
        type="button"
        className={buttonClass}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onInsertVideo()}
      >
        <Video size={18} strokeWidth={2} />
      </button>
    </div>
  );
}

/* ─── App ─── */
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('docflow-token'));
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [activeDoc, setActiveDoc] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [currentLinkUrl, setCurrentLinkUrl] = useState('');
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameType, setRenameType] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState(false);
  const saveTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
const selectedImagePos = useRef(null);
   const editorRef = useRef(null);

   const [selectedImage, setSelectedImage] = useState(null);

   const selectedVideoPos = useRef(null);

  const [selectedVideo, setSelectedVideo] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const handler = () => setIsLoggedIn(false);
    window.addEventListener('docflow:auth-required', handler);
    return () => window.removeEventListener('docflow:auth-required', handler);
  }, []);

  const loadFolders = useCallback(async () => {
    try {
      const data = await api.folders();
      if (data) setFolders(data);
    } catch (err) {
      console.error('Failed to load folders:', err);
    }
  }, []);

  const loadDocuments = useCallback(
    async (folderId) => {
      try {
        const data = await api.documents(folderId);
        if (data) setDocuments(data);
      } catch (err) {
        console.error('Failed to load documents:', err);
      }
    },
    [],
  );

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadFolders();
      await loadDocuments(activeFolderId);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (folders.length > 0 && !activeFolderId) {
      setActiveFolderId(folders[0].id);
      loadDocuments(folders[0].id);
    }
  }, [folders]);

  useEffect(() => {
    if (activeFolderId) {
      loadDocuments(activeFolderId);
    }
  }, [activeFolderId]);

  const handleFolderSelect = async (folderId) => {
    setActiveFolderId(folderId);
    setActiveDoc(null);
  };

  const handleDocSelect = async (doc) => {
    setLoading(true);
    try {
      const data = await api.getDocument(doc.id);
      if (data) {
        setActiveDoc(data);
        if (editorRef.current) {
          editorRef.current.commands.setContent(data.content || '');
        }
      }
    } catch (err) {
      console.error('Failed to load document:', err);
    }
    setLoading(false);
  };

  const handleCreateFolder = async (name, parentFolderId) => {
    try {
      await api.createFolder(name, parentFolderId);
      await loadFolders();
      setFolderModalOpen(false);
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  };

  const handleCreateDocument = async (folderId) => {
    const docNum = documents.filter((d) => d.folder_id === folderId).length + 1;
    const name = `Documento sin tM-CM--tulo ${docNum > 1 ? docNum : ''}`.trim();
    try {
      const data = await api.createDocument(name, folderId);
      if (data) {
        await loadDocuments(folderId);
        setActiveDoc(data);
        if (editorRef.current) {
          editorRef.current.commands.setContent(data.content || '');
        }
      }
    } catch (err) {
      console.error('Failed to create document:', err);
    }
  };

  const handleRenameFolder = async (newName) => {
    try {
      await api.updateFolder(renameTarget, { name: newName });
      await loadFolders();
      setRenameModalOpen(false);
    } catch (err) {
      console.error('Failed to rename folder:', err);
    }
  };

  const handleRenameDocument = async (newName) => {
    try {
      await api.updateDocument(renameTarget, { name: newName });
      await loadDocuments(activeFolderId);
      if (activeDoc && activeDoc.id === renameTarget) {
        setActiveDoc({ ...activeDoc, name: newName });
      }
      setRenameModalOpen(false);
    } catch (err) {
      console.error('Failed to rename document:', err);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm('Delete this folder and all its documents?')) return;
    try {
      await api.deleteFolder(folderId);
      await loadFolders();
      if (activeFolderId === folderId) {
        setActiveFolderId(null);
        setActiveDoc(null);
        await loadDocuments(null);
      }
    } catch (err) {
      console.error('Failed to delete folder:', err);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await api.deleteDocument(docId);
      await loadDocuments(activeFolderId);
      if (activeDoc && activeDoc.id === docId) {
        setActiveDoc(null);
        if (editorRef.current) {
          editorRef.current.commands.setContent(initialContent);
        }
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const handleLogout = () => {
    api.logout();
    setIsLoggedIn(false);
  };

  const handleInsertImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInsertVideo = useCallback(() => {
    videoInputRef.current?.click();
  }, []);

  const processFile = useCallback(async (file, editor) => {
    if (!editor) return;
    setUploading(true);
    try {
      const result = await api.uploadFile(file);
      if (result.type === 'image') {
        editor.commands.setImage({ src: result.url, alt: file.name, title: file.name });
      } else if (result.type === 'video') {
        editor.commands.insertVideo({ src: result.url });
      }
    } catch (err) {
      console.error('Failed to upload file:', err);
    }
    setUploading(false);
  }, []);

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file || !editorRef.current) return;
      processFile(file, editorRef.current);
      e.target.value = '';
    },
    [processFile],
  );

  const handleVideoChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file || !editorRef.current) return;
      processFile(file, editorRef.current);
      e.target.value = '';
    },
    [processFile],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
      Image.configure({
        inline: false,
        HTMLAttributes: {
          class: 'max-w-full rounded-lg',
        },
        allowBase64: true,
      }),
      VideoExtension,
      Table.configure({
        resizable: true,
        lastColumnResizable: true,
        allowTableInSelection: true,
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-slate-300 p-2 min-w-[120px]',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-slate-300 p-2 min-w-[120px] bg-slate-100 font-semibold text-slate-900',
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'not-prose pl-2',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex items-start gap-2 -ml-4 py-0.5',
        },
      }),
      Link.configure({
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800 transition-colors',
        },
      }),
    ],
    content: activeDoc?.content || initialContent,
    onUpdate: ({ editor }) => {
      if (!activeDoc || !editor) return;

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(async () => {
        try {
          await api.updateDocument(activeDoc.id, { content: editor.getHTML() });
          setSaveState(true);
          setTimeout(() => setSaveState(false), 2000);
        } catch (err) {
          console.error('Failed to save document:', err);
        }
      }, 2000);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[600px] px-2',
      },
      handleDOMEvents: {
        contextmenu: (_, event) => {
          const target = event.target;
          if (target.closest('table')) {
            event.preventDefault();
            setMenuPos({ x: event.clientX, y: event.clientY });
            setMenuVisible(true);
            return true;
          }
          return false;
        },
        paste: (view, event) => {
          const items = event.clipboardData?.items;
          if (!items) return false;

          for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
              event.preventDefault();
              const file = item.getAsFile();
              if (!file) return true;

              processFile(file, editorRef.current);
              return true;
            }
          }
          return false;
        },
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const handleClick = (e) => {
      const videoWrapper = e.target.closest('[data-video-pos]');
      const imageWrapper = e.target.closest('[data-image-pos]');
      if (videoWrapper) {
        const pos = parseInt(videoWrapper.getAttribute('data-video-pos'), 10);
        if (selectedVideoPos.current !== pos) {
          selectedVideoPos.current = pos;
          setSelectedVideo(pos);
        }
        if (selectedImagePos.current !== null) {
          selectedImagePos.current = null;
          setSelectedImage(null);
        }
        return;
      }
      if (imageWrapper) {
        const pos = parseInt(imageWrapper.getAttribute('data-image-pos'), 10);
        if (selectedImagePos.current !== pos) {
          selectedImagePos.current = pos;
          setSelectedImage(pos);
        }
        if (selectedVideoPos.current !== null) {
          selectedVideoPos.current = null;
          setSelectedVideo(null);
        }
        return;
      }
      if (selectedImagePos.current !== null) {
        selectedImagePos.current = null;
        setSelectedImage(null);
      }
      if (selectedVideoPos.current !== null) {
        selectedVideoPos.current = null;
        setSelectedVideo(null);
      }
    };
    dom.addEventListener('click', handleClick);
    return () => dom.removeEventListener('click', handleClick);
  }, [editor]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const handleClick = (e) => {
      const videoWrapper = e.target.closest('[data-video-pos]');
      const imageWrapper = e.target.closest('[data-image-pos]');
      if (videoWrapper) {
        const pos = parseInt(videoWrapper.getAttribute('data-video-pos'), 10);
        if (selectedVideoPos.current !== pos) {
          selectedVideoPos.current = pos;
          setSelectedVideo(pos);
        }
        if (selectedImagePos.current !== null) {
          selectedImagePos.current = null;
          setSelectedImage(null);
        }
        return;
      }
      if (imageWrapper) {
        const pos = parseInt(imageWrapper.getAttribute('data-image-pos'), 10);
        if (selectedImagePos.current !== pos) {
          selectedImagePos.current = pos;
          setSelectedImage(pos);
        }
        if (selectedVideoPos.current !== null) {
          selectedVideoPos.current = null;
          setSelectedVideo(null);
        }
        return;
      }
      if (selectedImagePos.current !== null) {
        selectedImagePos.current = null;
        setSelectedImage(null);
      }
      if (selectedVideoPos.current !== null) {
        selectedVideoPos.current = null;
        setSelectedVideo(null);
      }
    };
    dom.addEventListener('click', handleClick);
    return () => dom.removeEventListener('click', handleClick);
  }, [editor]);

  const handleMenuAction = useCallback(
    (action) => {
      if (!editor) return;
      const chain = editor.chain().focus();

      switch (action) {
        case 'rowAbove':
          chain.addRowBefore().run();
          break;
        case 'rowBelow':
          chain.addRowAfter().run();
          break;
        case 'deleteRow':
          chain.deleteRow().run();
          break;
        case 'colLeft':
          chain.addColumnBefore().run();
          break;
        case 'colRight':
          chain.addColumnAfter().run();
          break;
        case 'deleteCol':
          chain.deleteColumn().run();
          break;
        case 'deleteTable':
          chain.deleteTable().run();
          break;
      }
      setMenuVisible(false);
    },
    [editor],
  );

  const handleSetLink = useCallback(
    (url) => {
      if (!editor) return;
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    },
    [editor],
  );

  const handleUnlink = useCallback(
    () => {
      if (!editor) return;
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    },
    [editor],
  );

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 shadow-sm">
        <FileText className="text-blue-600" size={24} strokeWidth={2} />
        <h1 className="text-lg font-semibold text-slate-800">Docflow</h1>
        <span className="ml-2 px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
          Connected
        </span>
        {saveState && (
          <span className="px-2.5 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full animate-in">
            Saved
          </span>
        )}
        {uploading && (
          <span className="px-2.5 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-full animate-in flex items-center gap-1">
            <Loader2 size={12} className="animate-spin" /> Uploading
          </span>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={14} />
          Logout
        </button>
      </header>

      <div className="sticky top-[48px] z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          <Toolbar
            editor={editor}
            onOpenLinkModal={(href) => { setCurrentLinkUrl(href || ''); setLinkModalOpen(true); }}
            onInsertImage={handleInsertImage}
            onInsertVideo={handleInsertVideo}
            selectedImagePos={selectedImagePos}
             selectedImage={selectedImage}
             selectedVideoPos={selectedVideoPos}
             selectedVideo={selectedVideo}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          folders={folders}
          documents={documents}
          activeFolderId={activeFolderId}
          activeDocId={activeDoc?.id}
          onFolderSelect={handleFolderSelect}
          onDocSelect={handleDocSelect}
          onCreateFolder={() => setFolderModalOpen(true)}
          onCreateDocument={handleCreateDocument}
          onRenameFolder={(id, name) => {
            setRenameTarget(id);
            setRenameType('folder');
            setRenameModalOpen(true);
          }}
          onRenameDocument={(id, name) => {
            setRenameTarget(id);
            setRenameType('document');
            setRenameModalOpen(true);
          }}
          onDeleteFolder={handleDeleteFolder}
          onDeleteDocument={handleDeleteDocument}
        />

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
          ) : activeDoc ? (
            <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg shadow-slate-200/60 mt-8 mb-8">
              <div className="px-8 py-6">
                <EditorContent editor={editor} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-slate-400">
              <FileText size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a document to start editing</p>
              <p className="text-sm mt-1">Or create a new one from the sidebar</p>
            </div>
          )}
        </div>
      </div>

      <TableContextMenu
        visible={menuVisible}
        x={menuPos.x}
        y={menuPos.y}
        onClose={() => setMenuVisible(false)}
        onAction={handleMenuAction}
      />

      <LinkModal
        visible={linkModalOpen}
        currentUrl={currentLinkUrl}
        onClose={() => setLinkModalOpen(false)}
        onSetLink={handleSetLink}
        onUnlink={handleUnlink}
      />

      <FolderModal
        visible={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        onSubmit={handleCreateFolder}
        folders={folders}
      />

      <RenameModal
        visible={renameModalOpen}
        title={renameType === 'folder' ? 'Rename Folder' : 'Rename Document'}
        initialValue={renameTarget ? (renameType === 'folder' ? folders.find((f) => f.id === renameTarget)?.name : documents.find((d) => d.id === renameTarget)?.name) : ''}
        onClose={() => setRenameModalOpen(false)}
        onSubmit={renameType === 'folder' ? handleRenameFolder : handleRenameDocument}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleVideoChange}
      />
    </div>
  );
}
