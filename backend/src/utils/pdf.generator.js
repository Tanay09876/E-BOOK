const PDFDocument = require("pdfkit");
const MarkdownIt = require("markdown-it");
const path = require("path");
const fs = require("fs");

const md = new MarkdownIt();

async function getImageBuffer(src) {
  try {
    if (!src) return null;
    
    // 1. If it's a local upload
    if (src.includes("/uploads/")) {
      const filename = src.split("/uploads/").pop();
      const localPath = path.join(__dirname, "../../uploads", filename);
      if (fs.existsSync(localPath)) {
        return fs.readFileSync(localPath);
      }
    }

    // 2. If it's a remote URL
    if (src.startsWith("http")) {
      const response = await fetch(src);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    
    // 3. Check if it is a relative path directly
    const relativePath = path.join(__dirname, "../../", src.replace(/^\//, ""));
    if (fs.existsSync(relativePath)) {
      return fs.readFileSync(relativePath);
    }
  } catch (error) {
    console.error(`Error loading image from ${src}:`, error.message);
  }
  return null;
}

function getAlignmentAndCleanText(text) {
  if (!text) return { alignment: "left", cleanText: "" };
  const match = text.match(/<(p|div)\s+align=["'](left|center|right|justify)["']\s*>([\s\S]*?)<\/\1>/i);
  if (match) {
    return {
      alignment: match[2].toLowerCase(),
      cleanText: match[3]
    };
  }
  return {
    alignment: "left",
    cleanText: text
  };
}

const PDF_CONFIG = {
  fonts: {
    heading: "Helvetica-Bold",
    body: "Helvetica",
    bodyBold: "Helvetica-Bold",
    bodyItalic: "Helvetica-Oblique",
    code: "Courier",
  },
  sizes: {
    title: 32,
    subtitle: 20,
    author: 16,
    chapterTitle: 24,
    h1: 18,
    h2: 16,
    h3: 14,
    body: 11,
    code: 9,
    pageNumber: 9,
  },
  colors: {
    title: "#1a202c",
    subtitle: "#4a5568",
    author: "#2d3748",
    chapterTitle: "#1a202c",
    heading: "#1a202c",
    body: "#000000",
    code: "#d63384",
    codeBlock: "#e2e8f0",
    codeBg: "#1e293b",
    pageNumber: "#64748b",
  },
  margins: {
    top: 72,
    bottom: 72,
    left: 72,
    right: 72,
  },
  spacing: {
    paragraphGap: 12,
    chapterGap: 40,
    headingGap: 20,
    listItemGap: 8,
    lineHeight: 1.5,
  },
  list: {
    bulletIndent: 20,
    textIndent: 35,
  },
};

function parseInlineMarkdown(text) {
  const segments = [];

  const patterns = [
    { regex: /`([^`]+)`/g, type: "code" },
    { regex: /<u>([\s\S]*?)<\/u>/g, type: "underline" },
    { regex: /<mark>([\s\S]*?)<\/mark>/g, type: "highlight" },
    { regex: /<span\s+style=["']color:\s*(#[a-fA-F0-9]{3,8}|[a-zA-Z]+)["']\s*>([\s\S]*?)<\/span>/g, type: "color" },
    { regex: /\*\*(.+?)\*\*/g, type: "bold" },
    { regex: /__(.+?)__/g, type: "bold" },
    { regex: /\*(.+?)\*/g, type: "italic" },
    { regex: /_(.+?)_/g, type: "italic" },
  ];

  const matches = [];

  patterns.forEach((pattern) => {
    let match;
    const regex = new RegExp(pattern.regex.source, "g");

    while ((match = regex.exec(text)) !== null) {
      if (pattern.type === "color") {
        matches.push({
          start: match.index,
          end: regex.lastIndex,
          text: match[2],
          color: match[1],
          type: pattern.type,
        });
      } else {
        matches.push({
          start: match.index,
          end: regex.lastIndex,
          text: match[1],
          type: pattern.type,
        });
      }
    }
  });

  matches.sort((a, b) => a.start - b.start);

  const filteredMatches = [];
  let lastEnd = 0;

  matches.forEach((match) => {
    if (match.start >= lastEnd) {
      filteredMatches.push(match);
      lastEnd = match.end;
    }
  });

  let processedUntil = 0;

  filteredMatches.forEach((match) => {
    if (match.start > processedUntil) {
      segments.push({
        text: text.substring(processedUntil, match.start),
        type: "plain",
      });
    }

    segments.push({
      text: match.text,
      type: match.type,
      ...(match.color && { color: match.color }),
    });

    processedUntil = match.end;
  });

  if (processedUntil < text.length) {
    segments.push({
      text: text.substring(processedUntil),
      type: "plain",
    });
  }

  return segments.length > 0 ? segments : [{ text, type: "plain" }];
}

function renderStyledText(
  doc,
  segments,
  startX = null,
  startY = null,
  options = {}
) {
  const defaultOptions = {
    width: doc.page.width - PDF_CONFIG.margins.left - PDF_CONFIG.margins.right,
    ...options,
  };

  let firstSegment = true;

  segments.forEach((segment, index) => {
    const runOptions = {
      ...defaultOptions,
      continued: index < segments.length - 1,
    };

    switch (segment.type) {
      case "code":
        doc
          .font(PDF_CONFIG.fonts.code)
          .fontSize(PDF_CONFIG.sizes.code)
          .fillColor(PDF_CONFIG.colors.code);
        break;
      case "bold":
        doc
          .font(PDF_CONFIG.fonts.bodyBold)
          .fontSize(PDF_CONFIG.sizes.body)
          .fillColor(PDF_CONFIG.colors.body);
        break;
      case "italic":
        doc
          .font(PDF_CONFIG.fonts.bodyItalic)
          .fontSize(PDF_CONFIG.sizes.body)
          .fillColor(PDF_CONFIG.colors.body);
        break;
      case "color":
        doc
          .font(PDF_CONFIG.fonts.body)
          .fontSize(PDF_CONFIG.sizes.body)
          .fillColor(segment.color || PDF_CONFIG.colors.body);
        break;
      case "underline":
        doc
          .font(PDF_CONFIG.fonts.body)
          .fontSize(PDF_CONFIG.sizes.body)
          .fillColor(PDF_CONFIG.colors.body);
        runOptions.underline = true;
        break;
      case "highlight":
        doc
          .font(PDF_CONFIG.fonts.body)
          .fontSize(PDF_CONFIG.sizes.body)
          .fillColor(PDF_CONFIG.colors.body);
        
        const textWidth = doc.widthOfString(segment.text);
        const textHeight = 14;
        doc.save().rect(doc.x, doc.y, textWidth, textHeight).fill("#fef08a").restore();
        break;
      default:
        doc
          .font(PDF_CONFIG.fonts.body)
          .fontSize(PDF_CONFIG.sizes.body)
          .fillColor(PDF_CONFIG.colors.body);
    }

    if (firstSegment && startX !== null && startY !== null) {
      doc.text(segment.text, startX, startY, runOptions);
      firstSegment = false;
    } else if (firstSegment && startX !== null) {
      doc.text(segment.text, startX, doc.y, runOptions);
      firstSegment = false;
    } else {
      doc.text(segment.text, runOptions);
    }
  });
}

// Process markdown content and render to PDF
async function processMdContentForPdf(doc, mdContent) {
  if (!mdContent || mdContent.trim() === "") {
    return;
  }

  const tokens = md.parse(mdContent, {});
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    try {
      // HANDLE ALIGNED HEADINGS
      if (token.type === "html_block" || token.type === "html_inline") {
        const headingMatch = token.content.match(/<h([1-6])\s+align=["'](left|center|right|justify)["']\s*>([\s\S]*?)<\/h\1>/i);
        if (headingMatch) {
          const level = parseInt(headingMatch[1]);
          const alignment = headingMatch[2].toLowerCase();
          const titleText = headingMatch[3];
          
          let fontSize = PDF_CONFIG.sizes.h3;
          if (level === 1) fontSize = PDF_CONFIG.sizes.h1;
          else if (level === 2) fontSize = PDF_CONFIG.sizes.h2;

          if (doc.y > doc.page.height - PDF_CONFIG.margins.bottom - 100) {
            doc.addPage();
          }
          doc.moveDown(1);
          doc
            .font(PDF_CONFIG.fonts.heading)
            .fontSize(fontSize)
            .fillColor(PDF_CONFIG.colors.heading)
            .text(titleText, { align: alignment });
          doc.moveDown(0.5);
          
          i++;
          continue;
        }
      }

      // HANDLE TABLES
      if (token.type === "table_open") {
        const tableTokens = [];
        let depth = 1;
        let j = i + 1;
        while (j < tokens.length && depth > 0) {
          if (tokens[j].type === "table_open") depth++;
          if (tokens[j].type === "table_close") depth--;
          tableTokens.push(tokens[j]);
          j++;
        }

        const headers = [];
        const rows = [];
        let currentRow = [];
        let inHeader = false;

        for (let t = 0; t < tableTokens.length; t++) {
          const tk = tableTokens[t];
          if (tk.type === "thead_open") {
            inHeader = true;
          } else if (tk.type === "thead_close") {
            inHeader = false;
          } else if (tk.type === "tr_open") {
            currentRow = [];
          } else if (tk.type === "tr_close") {
            if (currentRow.length > 0) {
              if (inHeader) {
                headers.push(...currentRow);
              } else {
                rows.push(currentRow);
              }
            }
          } else if (tk.type === "inline") {
            currentRow.push(tk.content);
          }
        }

        const availableWidth = doc.page.width - PDF_CONFIG.margins.left - PDF_CONFIG.margins.right;
        const colCount = Math.max(headers.length, ...rows.map(r => r.length));

        if (colCount > 0) {
          const colWidth = availableWidth / colCount;
          const estimatedHeight = (rows.length + 1) * 30 + 40;
          
          if (doc.y > doc.page.height - PDF_CONFIG.margins.bottom - estimatedHeight) {
            doc.addPage();
          }

          doc.moveDown(0.5);

          let startX = PDF_CONFIG.margins.left;
          let startY = doc.y;

          // Draw header background
          doc.rect(startX, startY, availableWidth, 24).fill("#f1f5f9");

          // Text color for header
          doc.font(PDF_CONFIG.fonts.bodyBold).fontSize(PDF_CONFIG.sizes.body).fillColor("#1e293b");

          for (let c = 0; c < colCount; c++) {
            const text = headers[c] || "";
            doc.text(text, startX + c * colWidth + 5, startY + 6, {
              width: colWidth - 10,
              height: 18,
              ellipsis: true
            });
          }

          doc.y = startY + 24;

          // Render rows
          rows.forEach((row, rIdx) => {
            startY = doc.y;
            const rowHeight = 24;

            if (rIdx % 2 === 1) {
              doc.rect(startX, startY, availableWidth, rowHeight).fill("#f8fafc");
            }

            doc.moveTo(startX, startY + rowHeight).lineTo(startX + availableWidth, startY + rowHeight).stroke("#e2e8f0");

            doc.font(PDF_CONFIG.fonts.body).fontSize(PDF_CONFIG.sizes.body).fillColor("#334155");
            for (let c = 0; c < colCount; c++) {
              const text = row[c] || "";
              doc.text(text, startX + c * colWidth + 5, startY + 6, {
                width: colWidth - 10,
                height: 18,
                ellipsis: true
              });
            }

            doc.y = startY + rowHeight;
          });

          // Outer table border
          doc.rect(startX, startY - (headers.length ? 24 : 0), availableWidth, doc.y - startY + (headers.length ? 24 : 0)).stroke("#cbd5e1");

          doc.moveDown(0.5);
        }

        i = j;
        continue;
      }

      // HANDLE HEADINGS
      if (token.type === "heading_open") {
        const level = parseInt(token.tag.slice(1), 10);
        const nextToken = tokens[i + 1];

        if (nextToken && nextToken.type === "inline") {
          let fontSize;

          switch (level) {
            case 1:
              fontSize = PDF_CONFIG.sizes.h1;
              break;
            case 2:
              fontSize = PDF_CONFIG.sizes.h2;
              break;
            case 3:
              fontSize = PDF_CONFIG.sizes.h3;
              break;
            default:
              fontSize = PDF_CONFIG.sizes.h3;
          }

          if (doc.y > doc.page.height - PDF_CONFIG.margins.bottom - 100) {
            doc.addPage();
          }

          doc.moveDown(1);
          doc
            .font(PDF_CONFIG.fonts.heading)
            .fontSize(fontSize)
            .fillColor(PDF_CONFIG.colors.heading)
            .text(nextToken.content, {
              align: "left",
            });

          doc.moveDown(0.5);

          i += 2;
          continue;
        }
      }

      // HANDLE CODE BLOCKS
      if (token.type === "fence" || token.type === "code_block") {
        const codeLines = token.content
          .split("\n")
          .filter((line) => line.trim());

        if (doc.y > doc.page.height - PDF_CONFIG.margins.bottom - 150) {
          doc.addPage();
        }

        doc.moveDown(0.5);

        if (token.info && token.info.trim()) {
          doc
            .font(PDF_CONFIG.fonts.body)
            .fontSize(8)
            .fillColor("#64748b")
            .text(
              `Language: ${token.info.trim()}`,
              PDF_CONFIG.margins.left + 20,
              doc.y,
              { lineBreak: false }
            );
          doc.moveDown(0.3);
        }

        codeLines.forEach((line) => {
          const lineHeight = PDF_CONFIG.sizes.code + 6;

          doc
            .rect(
              PDF_CONFIG.margins.left + 10,
              doc.y,
              doc.page.width -
                PDF_CONFIG.margins.left -
                PDF_CONFIG.margins.right -
                20,
              lineHeight
            )
            .fill(PDF_CONFIG.colors.codeBg);

          doc
            .font(PDF_CONFIG.fonts.code)
            .fontSize(PDF_CONFIG.sizes.code)
            .fillColor(PDF_CONFIG.colors.codeBlock)
            .text(line || " ", PDF_CONFIG.margins.left + 20, doc.y, {
              lineBreak: false,
            });

          doc.moveDown(0.3);
        });

        doc.moveDown(0.5);
        i++;
        continue;
      }

      // HANDLE PARAGRAPHS
      if (token.type === "paragraph_open") {
        const nextToken = tokens[i + 1];

        if (nextToken && nextToken.type === "inline" && nextToken.content) {
          // Detect Manual Page Break
          if (nextToken.content.includes("page-break") || nextToken.content.includes("pagebreak")) {
            doc.addPage();
            i += 2;
            continue;
          }

          // Detect Image
          const imgMatch = nextToken.content.match(/!\[(.*?)\]\((.*?)\)/);
          if (imgMatch) {
            const src = imgMatch[2];
            const buffer = await getImageBuffer(src);
            if (buffer) {
              if (doc.y > doc.page.height - PDF_CONFIG.margins.bottom - 260) {
                doc.addPage();
              }
              doc.moveDown(0.5);
              doc.image(buffer, {
                fit: [350, 250],
                align: "center"
              });
              doc.moveDown(1);
            }
            i += 2;
            continue;
          }

          if (doc.y > doc.page.height - PDF_CONFIG.margins.bottom - 100) {
            doc.addPage();
          }

          doc.moveDown(0.5);

          // Parse and render styled text using helper function (extracting alignment)
          const { alignment, cleanText } = getAlignmentAndCleanText(nextToken.content);
          if (alignment !== "left") {
            const plainText = cleanText.replace(/[\*_`~]/g, "");
            doc
              .font(PDF_CONFIG.fonts.body)
              .fontSize(PDF_CONFIG.sizes.body)
              .fillColor(PDF_CONFIG.colors.body)
              .text(plainText, { align: alignment });
          } else {
            const segments = parseInlineMarkdown(cleanText);
            renderStyledText(doc, segments, null, null, { align: alignment });
          }

          doc.moveDown(0.5);

          i += 2;
          continue;
        }
      }

      // HANDLE BULLET LISTS
      if (token.type === "bullet_list_open") {
        doc.moveDown(0.5);
        i++;

        while (i < tokens.length && tokens[i].type !== "bullet_list_close") {
          if (tokens[i].type === "list_item_open") {
            i++;

            if (tokens[i] && tokens[i].type === "paragraph_open") {
              i++;

              if (tokens[i] && tokens[i].type === "inline") {
                if (doc.y > doc.page.height - PDF_CONFIG.margins.bottom - 50) {
                  doc.addPage();
                }

                const currentY = doc.y;
                const bulletX =
                  PDF_CONFIG.margins.left + PDF_CONFIG.list.bulletIndent;
                const textX =
                  PDF_CONFIG.margins.left + PDF_CONFIG.list.textIndent;

                doc
                  .font(PDF_CONFIG.fonts.body)
                  .fontSize(PDF_CONFIG.sizes.body)
                  .fillColor(PDF_CONFIG.colors.body)
                  .text("•", bulletX, currentY, {
                    lineBreak: false,
                    width: 10,
                  });

                const segments = parseInlineMarkdown(tokens[i].content);

                renderStyledText(doc, segments, textX, currentY, {
                  width: doc.page.width - textX - PDF_CONFIG.margins.right,
                });

                doc.moveDown(0.4);
              }
            }
          }
          i++;
        }

        doc.moveDown(0.5);
        i++;
        continue;
      }

      // HANDLE ORDERED LISTS
      if (token.type === "ordered_list_open") {
        doc.moveDown(0.5);
        let listCounter = 1;
        i++;

        while (i < tokens.length && tokens[i].type !== "ordered_list_close") {
          if (tokens[i].type === "list_item_open") {
            i++;

            if (tokens[i] && tokens[i].type === "paragraph_open") {
              i++;

              if (tokens[i] && tokens[i].type === "inline") {
                if (doc.y > doc.page.height - PDF_CONFIG.margins.bottom - 50) {
                  doc.addPage();
                }

                const currentY = doc.y;
                const numberX =
                  PDF_CONFIG.margins.left + PDF_CONFIG.list.bulletIndent;
                const textX =
                  PDF_CONFIG.margins.left + PDF_CONFIG.list.textIndent;

                doc
                  .font(PDF_CONFIG.fonts.body)
                  .fontSize(PDF_CONFIG.sizes.body)
                  .fillColor(PDF_CONFIG.colors.body)
                  .text(`${listCounter}.`, numberX, currentY, {
                    lineBreak: false,
                    width: 15,
                  });

                const segments = parseInlineMarkdown(tokens[i].content);

                renderStyledText(doc, segments, textX, currentY, {
                  width: doc.page.width - textX - PDF_CONFIG.margins.right,
                });

                doc.moveDown(0.4);
                listCounter++;
              }
            }
          }
          i++;
        }

        doc.moveDown(0.5);
        i++;
        continue;
      }

      i++;
    } catch (error) {
      console.error("Error processing PDF token:", token, error);
      i++;
    }
  }
}

// MAIN PDF GENERATION FUNCTION
async function generatePdf(book, res) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: PDF_CONFIG.margins,
      });

      doc.pipe(res);

      doc.on("error", (err) => {
        console.error("PDF generation error:", err);
        reject(err);
      });

      // PAGE 1: COVER PAGE
      if (book.coverImage && !book.coverImage.includes("pravatar")) {
        const rel = book.coverImage.replace(/^\//, "");
        const imagePath = path.join(__dirname, "../../", rel);

        try {
          if (fs.existsSync(imagePath)) {
            doc.image(imagePath, {
              fit: [400, 550],
              align: "center",
              valign: "center",
            });

            doc.addPage();
          } else {
            console.warn(`PDF cover image not found at path: ${imagePath}`);
          }
        } catch (imgErr) {
          console.error(`Could not embed cover image: ${imagePath}`, imgErr);
        }
      }

      // PAGE 2: TITLE PAGE
      doc.moveDown(8);

      doc
        .font(PDF_CONFIG.fonts.heading)
        .fontSize(PDF_CONFIG.sizes.title)
        .fillColor(PDF_CONFIG.colors.title)
        .text(book.title, {
          align: "center",
        });

      doc.moveDown(2);

      if (book.subtitle && book.subtitle.trim()) {
        doc
          .fontSize(PDF_CONFIG.sizes.subtitle)
          .fillColor(PDF_CONFIG.colors.subtitle)
          .text(book.subtitle, {
            align: "center",
          });

        doc.moveDown(2);
      }

      doc
        .fontSize(PDF_CONFIG.sizes.author)
        .fillColor(PDF_CONFIG.colors.author)
        .text(`by ${book.author}`, {
          align: "center",
        });

      doc.moveDown(2);

      doc
        .moveTo(doc.page.width / 2 - 100, doc.y)
        .lineTo(doc.page.width / 2 + 100, doc.y)
        .stroke("#4f46e5");

      // PROCESS CHAPTERS (starts on page 3+)
      const run = async () => {
        for (let index = 0; index < (book?.chapters || []).length; index++) {
          const chapter = book.chapters[index];
          try {
            doc.addPage();

            doc
              .font(PDF_CONFIG.fonts.heading)
              .fontSize(PDF_CONFIG.sizes.chapterTitle)
              .fillColor(PDF_CONFIG.colors.chapterTitle)
              .text(chapter.title, {
                align: "left",
              });

            doc.moveDown(2);

            await processMdContentForPdf(doc, chapter.content || "");
          } catch (chapterErr) {
            console.error(
              `Error processing chapter ${index + 1} for PDF:`,
              chapterErr
            );
          }
        }
        
        doc.end();
      };
      
      run().catch(reject);

      doc.on("end", () => {
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generatePdf };
