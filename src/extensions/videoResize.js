import { Node } from '@tiptap/core';

const Video = Node.create({
  name: 'video',
  inline: false,
  group: 'block',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: 640,
        parseHTML: (element) => {
          const w = element.getAttribute('width');
          return w ? parseInt(w, 10) : 640;
        },
      },
      height: {
        default: 360,
        parseHTML: (element) => {
          const h = element.getAttribute('height');
          return h ? parseInt(h, 10) : 360;
        },
      },
      controls: {
        default: true,
        parseHTML: (element) => element.getAttribute('controls') !== null,
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

  parseHTML() {
    return [{ tag: 'video' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', { ...this.options.HTMLAttributes, ...HTMLAttributes }];
  },

  addCommands() {
    return {
      insertVideo: (attrs) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            src: attrs.src || null,
            width: attrs.width || 640,
            height: attrs.height || 360,
            controls: true,
            align: attrs.align || null,
          },
        });
      },
      setVideoAlign:
        (align) =>
        ({ commands }) => {
          return commands.updateAttributes('video', { align });
        },
    };
  },

  addNodeView() {
    return ({ node: currentNode, getPos, editor }) => {
      const pos = getPos();
      const wrapper = document.createElement('div');
      wrapper.contentEditable = 'false';

      const applyVideoAlign = (align) => {
        if (align === 'center') {
          wrapper.style.cssText = 'display: block; margin: 8px auto; position: relative;';
        } else if (align === 'right') {
          wrapper.style.cssText = 'display: block; margin: 8px 0 8px auto; position: relative;';
        } else {
          wrapper.style.cssText = 'display: block; margin: 8px 0; position: relative;';
        }
      };

      applyVideoAlign(currentNode.attrs.align);

      const currentWidth = currentNode.attrs.width || 640;
      const currentHeight = currentNode.attrs.height || 360;

      const video = document.createElement('video');
      video.src = currentNode.attrs.src;
      video.width = currentWidth;
      video.height = currentHeight;
      video.controls = currentNode.attrs.controls !== false;
      video.style.width = `${currentWidth}px`;
      video.style.height = `${currentHeight}px`;
      video.style.maxWidth = '100%';
      video.style.borderRadius = '8px';
      video.style.display = 'block';

      const handle = document.createElement('div');
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

      wrapper.appendChild(video);
      wrapper.appendChild(handle);

      let isResizing = false;
      let startMouseX = 0;
      let startMouseY = 0;
      let startWidth = currentWidth;
      let startHeight = currentHeight;
      let destroyed = false;

      const onResizeMouseDown = (e) => {
        if (destroyed) return;
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        startMouseX = e.clientX;
        startMouseY = e.clientY;
        startWidth = video.clientWidth || currentNode.attrs.width || 200;
        startHeight = video.clientHeight || currentNode.attrs.height || 112;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'se-resize';
        handle.style.opacity = '1';
      };

      const onResizeMouseMove = (e) => {
        if (!isResizing || destroyed) return;
        e.preventDefault();
        const dx = e.clientX - startMouseX;
        const dy = e.clientY - startMouseY;
        const delta = Math.max(dx, dy);
        const newWidth = Math.max(200, startWidth + delta);
        const ratio = startWidth / startHeight;
        const newHeight = Math.max(112, newWidth / ratio);
        video.style.width = `${newWidth}px`;
        video.style.height = `${newHeight}px`;
      };

      const onResizeMouseUp = (e) => {
        if (!isResizing || destroyed) return;
        isResizing = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        handle.style.opacity = '0';
        const finalWidth = Math.round(video.clientWidth);
        const finalHeight = Math.round(video.clientHeight);
        const p = getPos();
        if (p != null) {
          editor.view.dispatch(
            editor.view.state.tr.setNodeMarkup(p, undefined, {
              ...currentNode.attrs,
              width: finalWidth,
              height: finalHeight,
            })
          );
        }
      };

      const onMouseEnter = () => {
        if (!isResizing) handle.style.opacity = '1';
      };

      const onMouseLeave = () => {
        if (!isResizing) handle.style.opacity = '0';
      };

      handle.addEventListener('mousedown', onResizeMouseDown);
      document.addEventListener('mousemove', onResizeMouseMove);
      document.addEventListener('mouseup', onResizeMouseUp);
      wrapper.addEventListener('mouseenter', onMouseEnter);
      wrapper.addEventListener('mouseleave', onMouseLeave);

      return {
        dom: wrapper,
        contentDOM: null,

        update: (updatedNode) => {
          if (updatedNode.type.name !== 'video') return false;
          currentNode = updatedNode;
          video.src = updatedNode.attrs.src;
          video.width = updatedNode.attrs.width || 640;
          video.height = updatedNode.attrs.height || 360;
          video.style.width = `${updatedNode.attrs.width || 640}px`;
          video.style.height = `${updatedNode.attrs.height || 360}px`;
          applyVideoAlign(updatedNode.attrs.align);
          return true;
        },

        destroy: () => {
          destroyed = true;
          isResizing = false;
          handle.removeEventListener('mousedown', onResizeMouseDown);
          document.removeEventListener('mousemove', onResizeMouseMove);
          document.removeEventListener('mouseup', onResizeMouseUp);
          wrapper.removeEventListener('mouseenter', onMouseEnter);
          wrapper.removeEventListener('mouseleave', onMouseLeave);
        },
      };
    };
  },
});

export default Video;
