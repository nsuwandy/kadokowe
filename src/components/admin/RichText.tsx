"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Article body editor — FR-8.3, FR-10.8.
 *
 * FR-8.3 asks for headings, body copy, images and pull quotes; FR-10.8 asks
 * for no markup knowledge. TipTap gives both without a bespoke parser.
 *
 * The toolbar is deliberately short. Every extra control is another decision
 * an author has to make about an article, and an editor with thirty buttons
 * produces less consistent pages than one with six — the design already
 * decides how a heading or a quote looks.
 *
 * Content is stored as HTML in a plain column. That keeps the public renderer
 * trivial and the value readable in the database, at the cost of needing
 * sanitisation on render — which is handled where it is displayed, since only
 * an authenticated administrator can write here in the first place.
 */
export function RichText({
  name,
  defaultValue,
  label,
  hint,
}: {
  name: string;
  defaultValue?: string | null;
  label: string;
  hint?: string;
}) {
  const [html, setHtml] = useState(defaultValue ?? "");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // The design owns horizontal rules and code blocks; offering them
        // would let an article introduce styling the page has no answer for.
        horizontalRule: false,
        codeBlock: false,
      }),
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: defaultValue ?? "",
    editorProps: {
      attributes: {
        class:
          "prose-editor min-h-64 w-full border border-line border-t-0 bg-paper px-4 py-3 text-sm leading-relaxed outline-none focus:border-red",
      },
    },
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    // Rendered on the client only; server-rendering a contenteditable
    // produces a hydration mismatch.
    immediatelyRender: false,
  });

  // Keep the hidden input in step when the editor initialises.
  useEffect(() => {
    if (editor) setHtml(editor.getHTML());
  }, [editor]);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[0.6875rem] font-bold uppercase tracking-[0.14em]">
        {label}
      </span>
      <input type="hidden" name={name} value={html} />

      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />

      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const btn = (active: boolean) =>
    cn(
      "border-r border-line px-3 py-2 text-xs font-semibold transition-colors last:border-r-0",
      active ? "bg-ink text-paper" : "hover:bg-warm",
    );

  return (
    <div className="flex flex-wrap border border-line bg-paper">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btn(editor.isActive("heading", { level: 2 }))}
        title="Section heading"
      >
        Heading
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={btn(editor.isActive("heading", { level: 3 }))}
        title="Sub-heading"
      >
        Sub-heading
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btn(editor.isActive("bold"))}
      >
        Bold
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btn(editor.isActive("italic"))}
      >
        Italic
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btn(editor.isActive("bulletList"))}
      >
        List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btn(editor.isActive("blockquote"))}
        title="Pull quote — set larger and in the editorial face on the page"
      >
        Pull quote
      </button>
      <button
        type="button"
        onClick={() => {
          const url = window.prompt("Image URL or Cloudinary delivery URL");
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }}
        className={btn(false)}
      >
        Image
      </button>
    </div>
  );
}
