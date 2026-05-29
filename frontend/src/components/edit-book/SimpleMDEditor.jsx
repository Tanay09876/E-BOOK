import { useState, useEffect } from "react";
import {
  TypeOutline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Underline,
  Highlighter,
  Palette,
  Scissors,
  Image,
  Heading,
  Table
} from "lucide-react";
import MDEditor, { commands } from "@uiw/react-md-editor";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import axiosInstance from "../../lib/axios";
import toast from "react-hot-toast";

const customSanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    "u",
    "mark",
    "span",
    "div",
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6"
  ],
  attributes: {
    ...defaultSchema.attributes,
    span: [
      ...(defaultSchema.attributes?.span || []),
      ["style"]
    ],
    p: [
      ...(defaultSchema.attributes?.p || []),
      ["align"]
    ],
    div: [
      ...(defaultSchema.attributes?.div || []),
      ["align", "class"]
    ],
    h1: [["align"]],
    h2: [["align"]],
    h3: [["align"]],
    h4: [["align"]],
    h5: [["align"]],
    h6: [["align"]]
  }
};

const executeAlignment = (align, state, api) => {
  const text = state.text || "";
  const { start, end } = state.selection || { start: 0, end: 0 };
  
  // Find start of the first line
  let lineStart = start;
  while (lineStart > 0 && text[lineStart - 1] !== "\n") {
    lineStart--;
  }
  
  // Find end of the last line
  let lineEnd = end;
  while (lineEnd < text.length && text[lineEnd] !== "\n") {
    lineEnd++;
  }
  
  // Expand selection to cover the full line(s)
  const newState = api.setSelectionRange({ start: lineStart, end: lineEnd });
  const selectedText = newState.selectedText || "";
  
  // Clean any existing alignment wrapper first to avoid tag nesting
  const cleanText = selectedText
    .replace(/<(p|div)\s+align=["'](?:left|center|right|justify)["']\s*>([\s\S]*?)<\/\1>/gi, "$2")
    .replace(/<(h([1-6]))\s+align=["'](?:left|center|right|justify)["']\s*>([\s\S]*?)<\/\1>/gi, (m, tag, level, content) => {
      const hLevel = parseInt(level, 10);
      return `${"#".repeat(hLevel)} ${content}`;
    });

  if (align === "left") {
    // Left alignment is standard markdown, so we just remove the alignment HTML tags
    api.replaceSelection(cleanText);
    return;
  }

  // Format each line appropriately
  const lines = cleanText.split("\n").map(line => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    
    // If it starts with standard markdown heading, convert to aligned HTML heading tag
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      return `<h${level} align="${align}">${text}</h${level}>`;
    }
    
    return `<p align="${align}">${trimmed}</p>`;
  });
  
  api.replaceSelection(lines.join("\n"));
};

const alignLeft = {
  name: "align-left",
  keyCommand: "align-left",
  buttonProps: { "aria-label": "Align Left", title: "Align Left" },
  icon: <AlignLeft className="size-4" />,
  execute: (state, api) => executeAlignment("left", state, api),
};

const alignCenter = {
  name: "align-center",
  keyCommand: "align-center",
  buttonProps: { "aria-label": "Align Center", title: "Align Center" },
  icon: <AlignCenter className="size-4" />,
  execute: (state, api) => executeAlignment("center", state, api),
};

const alignRight = {
  name: "align-right",
  keyCommand: "align-right",
  buttonProps: { "aria-label": "Align Right", title: "Align Right" },
  icon: <AlignRight className="size-4" />,
  execute: (state, api) => executeAlignment("right", state, api),
};

const alignJustify = {
  name: "align-justify",
  keyCommand: "align-justify",
  buttonProps: { "aria-label": "Align Justify", title: "Align Justify" },
  icon: <AlignJustify className="size-4" />,
  execute: (state, api) => executeAlignment("justify", state, api),
};

// Helpers to clean formatting tags and prevent double nesting
const cleanColorTags = (text) => {
  return text.replace(/<span\s+style=["']color:\s*(#[a-fA-F0-9]{3,8}|[a-zA-Z]+)["']\s*>([\s\S]*?)<\/span>/gi, "$2");
};

const cleanUnderlineTags = (text) => {
  return text.replace(/<u>([\s\S]*?)<\/u>/gi, "$1");
};

const cleanHighlightTags = (text) => {
  return text.replace(/<mark>([\s\S]*?)<\/mark>/gi, "$1");
};

const underline = {
  name: "underline",
  keyCommand: "underline",
  buttonProps: { "aria-label": "Underline Text", title: "Underline Text" },
  icon: <Underline className="size-4" />,
  execute: (state, api) => {
    const selected = (state.selectedText || "").trim();
    const match = selected.match(/^<u>([\s\S]*?)<\/u>$/i);
    if (match) {
      api.replaceSelection(match[1]);
    } else {
      const cleaned = cleanUnderlineTags(state.selectedText || "Text");
      api.replaceSelection(`<u>${cleaned}</u>`);
    }
  },
};

const highlight = {
  name: "highlight",
  keyCommand: "highlight",
  buttonProps: { "aria-label": "Highlight Text", title: "Highlight Text" },
  icon: <Highlighter className="size-4" />,
  execute: (state, api) => {
    const selected = (state.selectedText || "").trim();
    const match = selected.match(/^<mark>([\s\S]*?)<\/mark>$/i);
    if (match) {
      api.replaceSelection(match[1]);
    } else {
      const cleaned = cleanHighlightTags(state.selectedText || "Text");
      api.replaceSelection(`<mark>${cleaned}</mark>`);
    }
  },
};

const textColor = {
  name: "text-color",
  keyCommand: "text-color",
  buttonProps: { "aria-label": "Text Color", title: "Choose Text Color" },
  icon: <Palette className="size-4" />,
  execute: (state, api) => {
    const selected = (state.selectedText || "").trim();
    const match = selected.match(/^<span\s+style=["']color:\s*(#[a-fA-F0-9]{3,8}|[a-zA-Z]+)["']\s*>([\s\S]*?)<\/span>$/i);
    
    // Clean any existing color spans inside the selected text first to prevent nesting colors
    const cleaned = cleanColorTags(state.selectedText || "Text");
    
    const picker = document.createElement("input");
    picker.type = "color";
    picker.value = match ? match[1] : "#ef4444";
    picker.onchange = (e) => {
      const color = e.target.value;
      api.replaceSelection(`<span style="color: ${color}">${cleaned}</span>`);
    };
    picker.click();
  },
};

const pageBreak = {
  name: "page-break",
  keyCommand: "page-break",
  buttonProps: { "aria-label": "Insert Page Break", title: "Insert Page Break" },
  icon: <Scissors className="size-4" />,
  execute: (state, api) => {
    api.replaceSelection(`\n\n<div class="page-break"></div>\n\n`);
  },
};

function TablePickerPanel({ close, textApi }) {
  const [hoveredGrid, setHoveredGrid] = useState({ r: 0, c: 0 });
  const maxRows = 8;
  const maxCols = 8;

  const handleSelect = (r, c) => {
    const cols = c + 1;
    const rows = r + 1;

    const headerRow = "|" + Array(cols).fill(" Header ").join("|") + "|\n";
    const separatorRow = "|" + Array(cols).fill(" --- ").join("|") + "|\n";
    let bodyRows = "";
    for (let r = 0; r < rows; r++) {
      bodyRows += "|" + Array(cols).fill(" Cell ").join("|") + "|\n";
    }

    textApi.replaceSelection(`\n\n${headerRow}${separatorRow}${bodyRows}\n`);
    close();
  };

  return (
    <div className="p-3 bg-white rounded-lg shadow-xl border border-slate-200 flex flex-col gap-2 min-w-[170px] select-none text-slate-800">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 border-b border-slate-100 pb-1.5">
        <span>Insert Table</span>
        <span className="text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded font-mono font-bold">
          {hoveredGrid.r > 0 && hoveredGrid.c > 0
            ? `${hoveredGrid.r} × ${hoveredGrid.c}`
            : "0 × 0"}
        </span>
      </div>

      <div
        className="grid gap-1 p-0.5 bg-slate-50/50 rounded border border-slate-100"
        style={{
          gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))`,
        }}
        onMouseLeave={() => setHoveredGrid({ r: 0, c: 0 })}
      >
        {Array.from({ length: maxRows }).map((_, rIdx) =>
          Array.from({ length: maxCols }).map((_, cIdx) => {
            const isHighlighted =
              hoveredGrid.r > 0 &&
              hoveredGrid.c > 0 &&
              rIdx < hoveredGrid.r &&
              cIdx < hoveredGrid.c;
            return (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`size-3.5 border rounded-[3px] transition-all duration-75 cursor-pointer ${
                  isHighlighted
                    ? "bg-violet-500 border-violet-600 shadow-xs"
                    : "bg-white border-slate-200 hover:border-slate-400"
                }`}
                onMouseEnter={() =>
                  setHoveredGrid({ r: rIdx + 1, c: cIdx + 1 })
                }
                onClick={() => handleSelect(rIdx, cIdx)}
              />
            );
          })
        )}
      </div>

      <div className="text-[10px] text-slate-400 text-center font-medium">
        Hover to select grid, click to insert
      </div>
    </div>
  );
}

const customTable = {
  name: "custom-table",
  groupName: "custom-table",
  keyCommand: "group",
  buttonProps: { "aria-label": "Insert Table", title: "Insert Table" },
  icon: <Table className="size-4" />,
  children: ({ close, textApi }) => {
    return <TablePickerPanel close={close} textApi={textApi} />;
  },
};

const makeHeadingCommand = (level) => ({
  name: `title${level}`,
  keyCommand: `title${level}`,
  buttonProps: {
    "aria-label": `Heading ${level}`,
    title: `Heading ${level}`,
  },
  icon: <span className="font-bold text-xs">H{level}</span>,
  execute: (state, api) => {
    const text = state.text || "";
    const { start, end } = state.selection || { start: 0, end: 0 };
    
    // Find start of the first line
    let lineStart = start;
    while (lineStart > 0 && text[lineStart - 1] !== "\n") {
      lineStart--;
    }
    
    // Find end of the last line
    let lineEnd = end;
    while (lineEnd < text.length && text[lineEnd] !== "\n") {
      lineEnd++;
    }
    
    // Expand selection to cover the full line
    const newState = api.setSelectionRange({ start: lineStart, end: lineEnd });
    const selectedText = newState.selectedText || "";
    
    let alignment = "left";
    let content = selectedText;
    
    // Check for existing HTML block wrappers
    const alignTagMatch = selectedText.match(/^<(p|div|h([1-6]))\s+align=["'](left|center|right|justify)["']\s*>([\s\S]*?)<\/\1>$/i);
    if (alignTagMatch) {
      alignment = alignTagMatch[3];
      content = alignTagMatch[4];
    } else {
      // Check for markdown heading
      const mdHeadingMatch = selectedText.match(/^(#{1,6})\s+(.*)$/);
      if (mdHeadingMatch) {
        content = mdHeadingMatch[2];
      }
    }
    
    content = content.trim();
    
    // Check if we are toggling the exact same heading level off
    let alreadyHasSameHeading = false;
    if (alignment === "left") {
      const mdHeadingMatch = selectedText.match(/^(#{1,6})\s+(.*)$/);
      if (mdHeadingMatch && mdHeadingMatch[1].length === level) {
        alreadyHasSameHeading = true;
      }
    } else {
      const alignTagMatch = selectedText.match(/^<(h([1-6]))\s+align=["'](left|center|right|justify)["']\s*>([\s\S]*?)<\/\1>$/i);
      if (alignTagMatch && parseInt(alignTagMatch[2], 10) === level) {
        alreadyHasSameHeading = true;
      }
    }
    
    if (alreadyHasSameHeading) {
      // Revert to paragraph
      if (alignment === "left") {
        api.replaceSelection(content);
      } else {
        api.replaceSelection(`<p align="${alignment}">${content}</p>`);
      }
    } else {
      // Apply new heading level
      if (alignment === "left") {
        api.replaceSelection(`${"#".repeat(level)} ${content}`);
      } else {
        api.replaceSelection(`<h${level} align="${alignment}">${content}</h${level}>`);
      }
    }
  }
});

const headingDropdown = commands.group(
  [
    makeHeadingCommand(1),
    makeHeadingCommand(2),
    makeHeadingCommand(3),
    makeHeadingCommand(4),
    makeHeadingCommand(5),
    makeHeadingCommand(6),
  ],
  {
    name: "title",
    groupName: "title",
    buttonProps: { "aria-label": "Select Heading", title: "Select Heading" },
    icon: <Heading className="size-4" />,
  }
);

const imageUpload = {
  name: "image-upload",
  keyCommand: "image-upload",
  buttonProps: { "aria-label": "Upload & Insert Image", title: "Upload & Insert Image" },
  icon: <Image className="size-4" />,
  execute: (state, api) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("image", file);

      const loadingToast = toast.loading("Uploading image...");

      try {
        const { data } = await axiosInstance.post(
          "/api/books/upload-image",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        toast.dismiss(loadingToast);
        toast.success("Image uploaded successfully!");

        const absoluteUrl = data.imageUrl.startsWith("http")
          ? data.imageUrl
          : `${axiosInstance.defaults.baseURL || ""}${data.imageUrl}`;

        api.replaceSelection(`![${file.name.split(".")[0] || "Image"}](${absoluteUrl})`);
      } catch (error) {
        console.error("Error uploading editor image:", error);
        toast.dismiss(loadingToast);
        toast.error(error.response?.data?.error || "Failed to upload image!");
      }
    };
    input.click();
  },
};

function SimpleMDEditor({ value, onChange, options }) {
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    checkScreenSize();

    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const editorMode = isLargeScreen ? "live" : "edit";

  return (
    <div
      className="border border-slate-200 rounded-lg shadow-sm overflow-hidden h-full flex flex-col"
      data-color-mode="light"
    >
      <header className="bg-slate-50 border-b border-slate-200 px-3 sm:px-4 py-2.5 shrink-0">
        <div className="text-slate-600 text-xs sm:text-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-1">
            <TypeOutline className="size-3 sm:size-3.5" />
            <span className="font-medium">Markdown Editor</span>
          </div>

          <span className="text-[10px] sm:text-xs text-slate-400">
            Supports rich formatting, alignments, tables, page breaks & image uploads
          </span>
        </div>
      </header>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <MDEditor
          value={value}
          onChange={onChange}
          height="100%"
          preview={editorMode}
          {...options}
          previewOptions={{
            rehypePlugins: [[rehypeSanitize, customSanitizeSchema]],
          }}
          commands={[
            commands.bold,
            commands.italic,
            commands.strikethrough,
            underline,
            highlight,
            textColor,
            commands.hr,
            pageBreak,
            headingDropdown,
            commands.divider,
            commands.link,
            commands.code,
            commands.codeBlock,
            imageUpload,
            customTable,
            commands.divider,
            alignLeft,
            alignCenter,
            alignRight,
            alignJustify,
            commands.divider,
            commands.unorderedListCommand,
            commands.orderedListCommand,
            commands.checkedListCommand,
          ]}
          textareaProps={{
            placeholder:
              "Start writing your chapter content here...\n\nUse the toolbar icons to insert tables, align text, upload images, colorize/highlight text, or add page breaks.",
          }}
        />
      </div>
    </div>
  );
}

export default SimpleMDEditor;
