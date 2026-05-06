import Image from '@tiptap/extension-image';

const ImageWithResize = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const w = element.getAttribute('width');
          return w ? parseInt(w, 10) : null;
        },
      },
      align: {
        default: null,
        parseHTML: (element) => {
          const align = element.getAttribute('data-align');
          return align || null;
        },
        renderHTML: (attrs) => {
          if (!attrs.align) return {};
          return { 'data-align': attrs.align };
        },
      },
    };
  },

  addCommands() {
    const parent = this.parent?.();
    return {
      ...parent,
      setImageAlign:
        (align) =>
        ({ commands }) => {
          return commands.updateAttributes('image', { align });
        },
    };
  },

  addNodeView() {
    return ({ node: currentNode, getPos, editor }) => {
      const pos = getPos();
      const wrapper = document.createElement('div');
      wrapper.contentEditable = 'false';
      wrapper.setAttribute('data-image-pos', String(pos));

      const applyAlign = (align, wrapperEl) => {
        if (align) {
          wrapperEl.setAttribute('data-align', align);
        } else {
          wrapperEl.removeAttribute('data-align');
        }

        // Use display:block so margin auto works for centering
        if (align === 'center') {
          wrapperEl.style.cssText = 'display: block; position: relative; width: fit-content; margin: 0 auto;';
        } else if (align === 'right') {
          wrapperEl.style.cssText = 'display: block; position: relative; width: fit-content; margin-left: auto; margin-right: 0;';
        } else {
          // left or default
          wrapperEl.style.cssText = 'display: block; position: relative; width: fit-content; margin-right: auto; margin-left: 0;';
        }
      };

      applyAlign(currentNode.attrs.align, wrapper);

      const img = document.createElement('img');
      img.src = currentNode.attrs.src;
      img.alt = currentNode.attrs.alt || '';
      img.className = 'max-w-full rounded-lg cursor-default';
      img.style.height = 'auto';
      if (currentNode.attrs.width) {
        img.style.width = `${currentNode.attrs.width}px`;
      }

      const handle = document.createElement('div');
      handle.setAttribute('data-image-resize-handle', 'true');
      handle.contentEditable = 'false';
      handle.style.cssText = `
        position: absolute;
        bottom: -4px;
        right: -4px;
        width: 16px;
        height: 16px;
        background: #fff;
        border: 2px solid #3b82f6;
        border-radius: 50%;
        cursor: se-resize;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        opacity: 0;
        transition: opacity 0.15s;
        z-index: 10;
      `;

      wrapper.addEventListener('mouseenter', () => {
        handle.style.opacity = '1';
      });
      wrapper.addEventListener('mouseleave', () => {
        if (!isResizing) handle.style.opacity = '0';
      });

      wrapper.appendChild(img);
      wrapper.appendChild(handle);

      let isResizing = false;
      let startMouseX = 0;
      let startWidth = 0;
      let destroyed = false;

      const onResizeMouseDown = (e) => {
        if (destroyed) return;
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        startMouseX = e.clientX;
        startWidth = img.clientWidth || currentNode.attrs.width || 200;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'se-resize';
        handle.style.opacity = '1';
      };

      const onResizeMouseMove = (e) => {
        if (!isResizing || destroyed) return;
        e.preventDefault();
        const dx = e.clientX - startMouseX;
        let newWidth = Math.max(50, startWidth + dx);

        const container = wrapper.parentElement;
        const maxWidth = container ? container.clientWidth : 800;
        newWidth = Math.min(newWidth, maxWidth);

        img.style.width = `${newWidth}px`;
        img.style.height = 'auto';
      };

      const onResizeMouseUp = (e) => {
        if (!isResizing || destroyed) return;
        isResizing = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        handle.style.opacity = '0';

        const finalWidth = Math.round(img.clientWidth);
        const pos = getPos();
        if (pos != null) {
          const { schema } = editor.view.state;
          const newNode = schema.nodes.image.create({
            src: currentNode.attrs.src,
            alt: currentNode.attrs.alt,
            title: currentNode.attrs.title,
            width: finalWidth,
            align: currentNode.attrs.align, // preserve alignment on resize
          });

          editor.view.dispatch(
            editor.view.state.tr.replaceWith(pos, pos + 1, newNode)
          );
        }
      };

      handle.addEventListener('mousedown', onResizeMouseDown);
      document.addEventListener('mousemove', onResizeMouseMove);
      document.addEventListener('mouseup', onResizeMouseUp);

      return {
        dom: wrapper,
        contentDOM: null,

        update: (updatedNode) => {
          if (updatedNode.type.name !== 'image') return false;

          currentNode = updatedNode;
          img.src = updatedNode.attrs.src;
          img.alt = updatedNode.attrs.alt || '';
          if (updatedNode.attrs.width) {
            img.style.width = `${updatedNode.attrs.width}px`;
          } else {
            img.style.width = '';
          }
          img.style.height = 'auto';

          applyAlign(updatedNode.attrs.align, wrapper);
          return true;
        },

        destroy: () => {
          destroyed = true;
          isResizing = false;
          handle.removeEventListener('mousedown', onResizeMouseDown);
          document.removeEventListener('mousemove', onResizeMouseMove);
          document.removeEventListener('mouseup', onResizeMouseUp);
        },
      };
    };
  },
});

export default ImageWithResize;
