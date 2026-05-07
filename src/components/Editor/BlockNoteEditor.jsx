import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useEffect } from "react";

export function BlockNoteEditor({ initialContent, onChange, editable = true }) {
  const editor = useCreateBlockNote({
    initialContent: initialContent && initialContent.length > 0 ? initialContent : undefined,
  });

  useEffect(() => {
    if (editor && initialContent) {
      // Logic to handle content updates if needed
    }
  }, [initialContent, editor]);

  const handleEditorChange = () => {
    if (onChange) {
      onChange(editor.document);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto">
      <BlockNoteView 
        editor={editor} 
        editable={editable}
        onChange={handleEditorChange}
        theme="light"
      />
    </div>
  );
}
