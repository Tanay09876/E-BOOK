import { API_BASE_URL } from "./api-endpoints";

function escapeHtml(text) {
  if (!text) return "";

  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderTableHelper(lines) {
  if (lines.length < 2) return lines.join("\n");
  
  const headers = lines[0]
    .split("|")
    .map(s => s.trim())
    .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

  const separatorRow = lines[1];
  const isSeparator = /^[|\s:-]+$/.test(separatorRow);
  if (!isSeparator) {
    return lines.join("\n");
  }

  let html = '<div class="overflow-x-auto my-6"><table class="min-w-full border border-slate-200 text-sm border-collapse">';
  html += '<thead class="bg-slate-50 border-b border-slate-200">';
  html += '<tr>';
  headers.forEach(h => {
    html += `<th class="border border-slate-200 px-4 py-2.5 text-left font-semibold text-slate-700">${h}</th>`;
  });
  html += '</tr>';
  html += '</thead>';

  html += '<tbody>';
  const bodyRows = lines.slice(2);
  bodyRows.forEach(row => {
    const cells = row
      .split("|")
      .map(s => s.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    
    html += '<tr class="hover:bg-slate-50 even:bg-slate-50/50 border-b border-slate-100">';
    cells.forEach(c => {
      html += `<td class="border border-slate-200 px-4 py-2 text-slate-600">${c}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody>';
  html += '</table></div>';
  
  return html;
}

function parseMarkdownTables(text) {
  const lines = text.split("\n");
  let inTable = false;
  let tableLines = [];
  const newLines = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (!inTable) {
        inTable = true;
        tableLines = [trimmed];
      } else {
        tableLines.push(trimmed);
      }
    } else {
      if (inTable) {
        newLines.push(renderTableHelper(tableLines));
        inTable = false;
        tableLines = [];
      }
      newLines.push(line);
    }
  }
  if (inTable) {
    newLines.push(renderTableHelper(tableLines));
  }
  return newLines.join("\n");
}

export function validateName(name) {
  if (!name || typeof name !== "string") {
    return "Name is required";
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return "Name must be at least 2 characters";
  }

  if (trimmed.length > 50) {
    return "Name cannot exceed 50 characters";
  }

  return "";
}

export function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return "Email is required";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }

  return "";
}

export function validatePassword(password) {
  if (!password || typeof password !== "string") {
    return "Password is required";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }

  const strengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  if (!strengthRegex.test(password)) {
    return "Password must contain at least one uppercase letter, one lowercase letter, and one number";
  }

  return "";
}

export function formatMdContent(content) {
  // 1. Escape HTML first to prevent XSS
  const safeContent = escapeHtml(content);

  // 2. Parse Markdown Tables
  const contentWithTables = parseMarkdownTables(safeContent);

  return (
    contentWithTables
      // Code blocks (must come before inline code)
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const language = lang || "text";
        return `<pre class="bg-slate-900 text-slate-100 rounded-lg p-4 my-4 overflow-x-auto"><code class="language-${language} text-sm font-mono">${code.trim()}</code></pre>`;
      })
      // Inline code
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
      )
      // Headings
      .replace(
        /^### (.*$)/gm,
        "<h3 class='text-xl font-bold mt-6 mb-4 text-slate-900'>$1</h3>"
      )
      .replace(
        /^## (.*$)/gm,
        "<h2 class='text-2xl font-bold mt-8 mb-4 text-slate-900'>$1</h2>"
      )
      .replace(
        /^# (.*$)/gm,
        "<h1 class='text-3xl font-bold mt-8 mb-6 text-slate-900'>$1</h1>"
      )
      // Bold and italic
      .replace(
        /\*\*(.*?)\*\*/g,
        "<strong class='font-semibold text-slate-900'>$1</strong>"
      )
      .replace(/\*(.*?)\*/g, "<em class='italic text-slate-700'>$1</em>")
      // Blockquote
      .replace(
        /^> (.*$)/gm,
        "<blockquote class='text-slate-700 italic border-l-4 border-violet-500 pl-4 my-4 bg-violet-50/50 py-2 rounded-r'>$1</blockquote>"
      )
      // Underline (un-escape <u> tags)
      .replace(
        /&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/gi,
        "<u>$1</u>"
      )
      // Highlight (un-escape <mark> tags)
      .replace(
        /&lt;mark&gt;([\s\S]*?)&lt;\/mark&gt;/gi,
        '<mark class="bg-yellow-200 text-slate-900 px-1 py-0.5 rounded font-medium">$1</mark>'
      )
      // Color spans (un-escape style="color: ...")
      .replace(
        /&lt;span style=&quot;color:\s*(#[a-fA-F0-9]{3,8}|[a-zA-Z]+)&quot;&gt;([\s\S]*?)&lt;\/span&gt;/gi,
        '<span style="color: $1">$2</span>'
      )
      // Alignments (un-escape <p/div align="...">)
      .replace(
        /&lt;(p|div) align=&quot;(left|center|right|justify)&quot;&gt;([\s\S]*?)&lt;\/\1&gt;/gi,
        '<$1 class="text-$2" style="text-align: $2">$3</$1>'
      )
      // Heading alignments (un-escape <h1-6 align="...">)
      .replace(
        /&lt;(h[1-6]) align=&quot;(left|center|right|justify)&quot;&gt;([\s\S]*?)&lt;\/\1&gt;/gi,
        (match, tag, align, body) => {
          const headingClasses = {
            h1: "text-3xl font-bold mt-8 mb-6 text-slate-900",
            h2: "text-2xl font-bold mt-8 mb-4 text-slate-900",
            h3: "text-xl font-bold mt-6 mb-4 text-slate-900",
            h4: "text-lg font-bold mt-4 mb-2 text-slate-900",
            h5: "text-base font-bold mt-4 mb-2 text-slate-900",
            h6: "text-sm font-bold mt-4 mb-2 text-slate-900",
          };
          const classes = headingClasses[tag] || "font-bold text-slate-900";
          return `<${tag} class="${classes} text-${align}" style="text-align: ${align}">${body}</${tag}>`;
        }
      )
      // Page break indicators
      .replace(
        /&lt;div class=&quot;page-?break&quot;&gt;&lt;\/div&gt;/gi,
        '<div class="my-8 border-t-2 border-dashed border-slate-300 relative"><span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs font-semibold text-slate-400 select-none">Page Break</span></div>'
      )
      // Markdown Images
      .replace(
        /!\[(.*?)\]\((.*?)\)/g,
        (match, alt, src) => {
          const absoluteSrc = src.startsWith("/") ? `${API_BASE_URL}${src}` : src;
          return `<div class="my-6 text-center"><img src="${absoluteSrc}" alt="${alt}" class="max-w-full sm:max-w-md md:max-w-lg h-auto rounded-lg shadow-md mx-auto inline-block border border-slate-200" /><p class="text-xs text-slate-400 mt-2 italic">${alt || "Image"}</p></div>`;
        }
      )
      // 2. LIST LOGIC
      .replace(
        /^ (.*$)/gm,
        "<li class='ml-6 mb-2 text-slate-700 ul-item'>$1</li>"
      )
      .replace(
        /^\d+\. (.*$)/gm,
        "<li class='ml-6 mb-2 text-slate-700 ol-item'>$1</li>"
      )
      .replace(
        /((?:<li [^>]*class="[^"]*ul-item"[^>]*>.*?<\/li>(?:\n|$))+)/g,
        "<ul class='list-disc my-4'>$1</ul>"
      )
      .replace(
        /((?:<li [^>]*class="[^"]*ol-item"[^>]*>.*?<\/li>(?:\n|$))+)/g,
        "<ol class='list-decimal my-4'>$1</ol>"
      )
      // Paragraph
      .split("\n\n")
      .map((paragraph) => {
        paragraph = paragraph.trim();
        if (!paragraph) return "";

        // If it starts with a tag (like <h1, <ul, <pre, <div), don't wrap in <p>
        if (paragraph.startsWith("<")) return paragraph;

        return `<p class="text-slate-700 leading-relaxed mb-4">${paragraph}</p>`;
      })
      .join("")
  );
}
