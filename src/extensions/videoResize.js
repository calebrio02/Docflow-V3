import { Node } from '@tiptap/core';

const Video = Node.create({
  name: 'video',
  inline: false,
  group: 'block',
  draggable: true,

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
          },
        });
      },
    };
  },
});

export default Video;
