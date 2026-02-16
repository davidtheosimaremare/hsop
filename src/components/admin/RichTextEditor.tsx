"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Youtube from "@tiptap/extension-youtube";
import TextAlign from "@tiptap/extension-text-align";

import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Quote,
    Undo,
    Redo,
    Link as LinkIcon,
    Image as ImageIcon,
    Code,
    Loader2,
    Table as TableIcon,
    CheckSquare,
    Youtube as YoutubeIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    ChevronDown,
    Plus,
    Trash2,
    Columns,
    Rows,
    MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback, useRef, useState } from "react";
import { uploadNewsImage } from "@/app/actions/upload";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: "rounded-lg max-w-full my-4",
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-red-600 underline hover:text-red-700",
                },
            }),
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: "border-collapse table-auto w-full my-4",
                },
            }),
            TableRow,
            TableHeader,
            TableCell,
            TaskList.configure({
                HTMLAttributes: {
                    class: "not-prose pl-2",
                },
            }),
            TaskItem.configure({
                nested: true,
            }),
            Youtube.configure({
                width: 640,
                height: 480,
                HTMLAttributes: {
                    class: "w-full aspect-video rounded-lg my-4",
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content,
        immediatelyRender: false, // Fix for some hydration issues if needed
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose prose-sm md:prose-base max-w-none min-h-[400px] p-4 focus:outline-none",
            },
        },
    });

    const setLink = useCallback(() => {
        if (!editor) return;

        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("URL", previousUrl);

        if (url === null) return;
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }, [editor]);

    const addYoutube = useCallback(() => {
        if (!editor) return;
        const url = prompt('Enter YouTube URL');

        if (url) {
            editor.commands.setYoutubeVideo({
                src: url,
            });
        }
    }, [editor]);

    const insertTable = useCallback(() => {
        editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }, [editor]);

    // Simple Details/Summary handling using HTML insertion
    const insertDetails = useCallback(() => {
        editor?.chain().focus().insertContent(`
            <details class="my-4 p-4 bg-gray-50 rounded-lg border">
                <summary class="font-bold cursor-pointer text-gray-900">Judul Dropdown (Klik untuk edit)</summary>
                <div class="mt-2 text-gray-600">
                    <p>Isi konten dropdown disini...</p>
                </div>
            </details>
            <p></p>
        `).run();
    }, [editor]);

    // Handle local image upload
    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editor) return;

        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const result = await uploadNewsImage(formData);

            if (result.success && result.url) {
                editor.chain().focus().setImage({ src: result.url }).run();
            } else {
                alert("Gagal upload gambar");
            }
        } catch (error) {
            console.error(error);
            alert("Gagal upload gambar");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }, [editor]);

    const addImage = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    if (!editor) {
        return null;
    }

    return (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            {/* Hidden file input for image upload */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
            />

            {/* Toolbar */}
            <div className="border-b bg-gray-50/50 p-2 flex flex-wrap gap-1 sticky top-0 z-10 backdrop-blur-sm">

                {/* Basic Formatting */}
                <div className="flex items-center gap-1 border-r pr-2 mr-1">
                    <Button
                        type="button"
                        variant={editor.isActive("bold") ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        title="Bold"
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant={editor.isActive("italic") ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        title="Italic"
                    >
                        <Italic className="h-4 w-4" />
                    </Button>
                </div>

                {/* Alignment */}
                <div className="flex items-center gap-1 border-r pr-2 mr-1">
                    <Button
                        type="button"
                        variant={editor.isActive({ textAlign: 'left' }) ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        title="Align Left"
                    >
                        <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant={editor.isActive({ textAlign: 'center' }) ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        title="Align Center"
                    >
                        <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant={editor.isActive({ textAlign: 'right' }) ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        title="Align Right"
                    >
                        <AlignRight className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant={editor.isActive({ textAlign: 'justify' }) ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                        title="Justify"
                    >
                        <AlignJustify className="h-4 w-4" />
                    </Button>
                </div>

                {/* Headings */}
                <div className="flex items-center gap-1 border-r pr-2 mr-1">
                    <Button
                        type="button"
                        variant={editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        title="H1"
                    >
                        <Heading1 className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        title="H2"
                    >
                        <Heading2 className="h-4 w-4" />
                    </Button>
                </div>

                {/* Lists & Tasks */}
                <div className="flex items-center gap-1 border-r pr-2 mr-1">
                    <Button
                        type="button"
                        variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        title="Bullet List"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        title="Ordered List"
                    >
                        <ListOrdered className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant={editor.isActive("taskList") ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => editor.chain().focus().toggleTaskList().run()}
                        title="Task List"
                    >
                        <CheckSquare className="h-4 w-4" />
                    </Button>
                </div>

                {/* Media & Objects */}
                <div className="flex items-center gap-1 border-r pr-2 mr-1">
                    <Button
                        type="button"
                        variant={editor.isActive("link") ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={setLink}
                        title="Link"
                    >
                        <LinkIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={addImage}
                        disabled={isUploading}
                        title="Image"
                    >
                        {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ImageIcon className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant={editor.isActive("youtube") ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={addYoutube}
                        title="YouTube"
                    >
                        <YoutubeIcon className="h-4 w-4" />
                    </Button>
                </div>

                {/* Complex Objects (Table, Dropdown) */}
                <div className="flex items-center gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="sm" className="gap-1 px-2 h-8">
                                <TableIcon className="h-4 w-4" />
                                <ChevronDown className="h-3 w-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={insertTable}>
                                <Plus className="h-4 w-4 mr-2" /> Insert Table
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={!editor.can().addColumnAfter()}>
                                <Columns className="h-4 w-4 mr-2" /> Add Column
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()} disabled={!editor.can().deleteColumn()}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Column
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!editor.can().addRowAfter()}>
                                <Rows className="h-4 w-4 mr-2" /> Add Row
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()} disabled={!editor.can().deleteRow()}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Row
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()} disabled={!editor.can().deleteTable()}>
                                <Trash2 className="h-4 w-4 mr-2 text-red-600" /> Delete Table
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 px-2"
                        onClick={insertDetails}
                        title="Insert Dropdown/Details"
                    >
                        <ChevronDown className="h-4 w-4 p-0.5 border rounded" />
                        <span className="text-xs">Dropdown</span>
                    </Button>

                    <Button
                        type="button"
                        variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        title="Quote"
                    >
                        <Quote className="h-4 w-4" />
                    </Button>

                    <Button
                        type="button"
                        variant={editor.isActive("codeBlock") ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        title="Code"
                    >
                        <Code className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Editor Content */}
            <div className="rich-text-editor-content">
                <EditorContent editor={editor} />
            </div>

            {/* Styles for Table and TaskList not automatically handled by Tailwind Typography */}
            <style jsx global>{`
                .ProseMirror table {
                    border-collapse: collapse;
                    table-layout: fixed;
                    width: 100%;
                    margin: 0;
                    overflow: hidden;
                }
                .ProseMirror td,
                .ProseMirror th {
                    min-width: 1em;
                    border: 1px solid #ced4da;
                    padding: 8px 12px;
                    vertical-align: top;
                    box-sizing: border-box;
                    position: relative;
                }
                .ProseMirror th {
                    font-weight: bold;
                    text-align: left;
                    background-color: #f8f9fa;
                }
                .ProseMirror .selectedCell:after {
                    z-index: 2;
                    position: absolute;
                    content: "";
                    left: 0; right: 0; top: 0; bottom: 0;
                    background: rgba(200, 200, 255, 0.4);
                    pointer-events: none;
                }
                
                ul[data-type="taskList"] {
                    list-style: none;
                    padding: 0;
                }
                
                ul[data-type="taskList"] li {
                    display: flex;
                    align-items: flex-start;
                }
                
                ul[data-type="taskList"] li > label {
                    flex: 0 0 auto;
                    margin-right: 0.5rem;
                    user-select: none;
                }
                
                ul[data-type="taskList"] li > div {
                    flex: 1 1 auto;
                }
            `}</style>
        </div>
    );
}
