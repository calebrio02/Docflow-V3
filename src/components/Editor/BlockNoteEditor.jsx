import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useEffect, useState } from "react";

export function BlockNoteEditor({ initialContent, onChange, editable = true }) {
  const editor = useCreateBlockNote({
    initialContent: initialContent && initialContent.length > 0 ? initialContent : undefined,
  });

  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const handleEditorChange = () => {
    if (onChange) onChange(editor.document);
  };

  return (
    <div className="w-full bn-theme-wrapper">
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={handleEditorChange}
        theme={isDark ? "dark" : "light"}
      />
    </div>
  );
}
