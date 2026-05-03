import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from './extensions/imageResize';
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
} from 'lucide-react';

const STORAGE_KEY = 'docflow-draft-content';

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
<p>Keep drafting — your changes are local only in this <em>Draft Mode</em>.</p>
`;

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

/* ─── Toolbar ─── */
function Toolbar({ editor, onOpenLinkModal, onInsertImage, selectedImagePos, selectedImage }) {
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
          if (pos !== null) {
            const { schema, doc } = editor.view.state;
            const node = doc.nodeAt(pos);
            if (node) {
              const newNode = schema.nodes.image.create({ ...node.attrs, align: 'left' });
              editor.view.dispatch(
                editor.view.state.tr.replaceWith(pos, pos + 1, newNode)
              );
            }
          } else {
            editor.chain().focus().setTextAlign('left').run();
          }
        }}
        icon={AlignLeft}
        active={getSelectedImageAlign() === 'left' || editor.isActive({ textAlign: 'left' })}
      />
      <Btn
        pred={() => {
          const pos = selectedImagePos.current;
          if (pos !== null) {
            const { schema, doc } = editor.view.state;
            const node = doc.nodeAt(pos);
            if (node) {
              const newNode = schema.nodes.image.create({ ...node.attrs, align: 'center' });
              editor.view.dispatch(
                editor.view.state.tr.replaceWith(pos, pos + 1, newNode)
              );
            }
          } else {
            editor.chain().focus().setTextAlign('center').run();
          }
        }}
        icon={AlignCenter}
        active={getSelectedImageAlign() === 'center' || editor.isActive({ textAlign: 'center' })}
      />
      <Btn
        pred={() => {
          const pos = selectedImagePos.current;
          if (pos !== null) {
            const { schema, doc } = editor.view.state;
            const node = doc.nodeAt(pos);
            if (node) {
              const newNode = schema.nodes.image.create({ ...node.attrs, align: 'right' });
              editor.view.dispatch(
                editor.view.state.tr.replaceWith(pos, pos + 1, newNode)
              );
            }
          } else {
            editor.chain().focus().setTextAlign('right').run();
          }
        }}
        icon={AlignRight}
        active={getSelectedImageAlign() === 'right' || editor.isActive({ textAlign: 'right' })}
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
    </div>
  );
}

/* ─── App ─── */
export default function App() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [currentLinkUrl, setCurrentLinkUrl] = useState('');
 const fileInputRef = useRef(null);
  const selectedImagePos = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [saveState, setSaveState] = useState(false);
  const saveTimerRef = useRef(null);

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
    content: localStorage.getItem(STORAGE_KEY) || initialContent,
    onUpdate: ({ editor }) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, editor.getHTML());
        setSaveState(true);
        setTimeout(() => setSaveState(false), 2000);
      }, 500);
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

              const reader = new FileReader();
              reader.onload = (e) => {
                const result = e.target?.result;
                if (result && typeof result === 'string') {
                  const domImage = new window.Image();
                  domImage.onload = () => {
                    editor.commands.setImage({
                      src: result,
                      alt: file.name,
                      title: file.name,
                      width: domImage.naturalWidth,
                    });
                  };
                  domImage.src = result;
                }
              };
              reader.readAsDataURL(file);
              return true;
            }
          }
          return false;
        },
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const handleClick = (e) => {
      const wrapper = e.target.closest('[data-image-pos]');
      if (!wrapper) {
        if (selectedImagePos.current !== null) {
          selectedImagePos.current = null;
          setSelectedImage(null);
        }
        return;
      }
      const pos = parseInt(wrapper.getAttribute('data-image-pos'), 10);
      if (selectedImagePos.current !== pos) {
        selectedImagePos.current = pos;
        setSelectedImage(pos);
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

  const handleInsertImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result;
        if (result && typeof result === 'string') {
          const domImage = new window.Image();
          domImage.onload = () => {
            editor.commands.setImage({
              src: result,
              alt: file.name,
              title: file.name,
              width: domImage.naturalWidth,
            });
          };
          domImage.src = result;
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [editor],
  );

  const handleClearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setSaveState(false);
    if (editor) {
      editor.commands.setContent(initialContent);
    }
  }, [editor]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 shadow-sm">
        <FileText className="text-blue-600" size={24} strokeWidth={2} />
        <h1 className="text-lg font-semibold text-slate-800">Docflow</h1>
        <span className="ml-2 px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
          Draft Mode
        </span>
        <button
          type="button"
          onClick={handleClearDraft}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={14} />
          Limpiar Borrador
        </button>
        {saveState && (
          <span className="px-2.5 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full animate-in">
            Guardado
          </span>
        )}
      </header>

      <div className="sticky top-[48px] z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4">
          <Toolbar
            editor={editor}
            onOpenLinkModal={(href) => { setCurrentLinkUrl(href || ''); setLinkModalOpen(true); }}
            onInsertImage={handleInsertImage}
            selectedImagePos={selectedImagePos}
            selectedImage={selectedImage}
          />
        </div>
      </div>

      <main className="flex-1 flex justify-center pt-8 pb-8 px-4">
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg shadow-slate-200/60">
          <div className="px-8 py-6">
            <EditorContent editor={editor} />
          </div>
        </div>
      </main>

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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
