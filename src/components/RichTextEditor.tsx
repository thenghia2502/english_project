"use client";
import { useEffect, useRef, useState } from "react";
import "quill/dist/quill.snow.css";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  className = "",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quillInstanceRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !editorRef.current) return;

    // Dynamic import Quill
    const initQuill = async () => {
      const Quill = (await import("quill")).default;

      if (quillInstanceRef.current) {
        quillInstanceRef.current = null;
      }

      const quill = new Quill(editorRef.current!, {
        theme: "snow",
        placeholder,
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ color: [] }, { background: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            ["clean"],
          ],
        },
      });

      // Set initial value
      if (value) {
        quill.clipboard.dangerouslyPasteHTML(value);
      }

      // Listen for changes
      quill.on("text-change", () => {
        const html = quill.root.innerHTML;
        onChange(html);
      });

      quillInstanceRef.current = quill;
    };

    initQuill();

    return () => {
      if (quillInstanceRef.current) {
        quillInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  // Update content when value changes externally
  useEffect(() => {
    if (!quillInstanceRef.current) return;

    const currentContent = quillInstanceRef.current.root.innerHTML;
    if (currentContent !== value) {
      const selection = quillInstanceRef.current.getSelection();
      quillInstanceRef.current.clipboard.dangerouslyPasteHTML(value);
      if (selection) {
        quillInstanceRef.current.setSelection(selection);
      }
    }
  }, [value]);

  if (!isClient) {
    return (
      <div className={`border rounded-lg p-4 bg-gray-100 ${className}`}>
        <p className="text-gray-500">{placeholder}</p>
      </div>
    );
  }

  return (
    <div className={`rich-text-editor ${className}`}>
      <div ref={editorRef} />
    </div>
  );
}
