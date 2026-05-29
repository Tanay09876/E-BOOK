const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} = require("docx");
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

const DOCX_CONFIG = {
  fonts: {
    heading: "Calibri",
    body: "Calibri",
    code: "Courier New",
  },
  sizes: {
    title: 32,
    subtitle: 20,
    author: 18,
    chapterTitle: 24,
    h1: 20,
    h2: 18,
    h3: 16,
    body: 11,
    code: 10,
  },
  colors: {
    title: "1a202c",
    subtitle: "4a5568",
    author: "2d3748",
    chapterTitle: "1a202c",
    heading: "1a202c",
    body: "000000",
    code: "d63384",
    codeBlock: "e2e8f0",
    codeBg: "1e293b",
    inlineCodeBg: "f1f5f9",
  },
  spacing: {
    paragraphBefore: 200,
    paragraphAfter: 200,
    chapterBefore: 400,
    chapterAfter: 300,
    headingBefore: 300,
    headingAfter: 150,
  },
};

function processInlineContent(content) {
  const textRuns = [];

  const patterns = [
    { regex: /`([^`]+)`/g, type: "code" }, // must be first
    { regex: /<u>([\s\S]*?)<\/u>/g, type: "underline" },
    { regex: /<mark>([\s\S]*?)<\/mark>/g, type: "highlight" },
    { regex: /<span\s+style=["']color:\s*(#[a-fA-F0-9]{3,8}|[a-zA-Z]+)["']\s*>([\s\S]*?)<\/span>/g, type: "color" },
    { regex: /\*\*(.+?)\*\*/g, type: "bold" },
    { regex: /\*(.+?)\*/g, type: "italic" },
    { regex: /__(.+?)__/g, type: "bold" },
    { regex: /_(.+?)_/g, type: "italic" },
  ];

  const matches = [];
  patterns.forEach((pattern) => {
    let match;
    const regex = new RegExp(pattern.regex.source, "g");
    while ((match = regex.exec(content)) !== null) {
      if (pattern.type === "color") {
        matches.push({
          start: match.index,
          end: regex.lastIndex,
          text: match[2],
          color: match[1],
          type: pattern.type,
          fullMatch: match[0],
        });
      } else {
        matches.push({
          start: match.index,
          end: regex.lastIndex,
          text: match[1],
          type: pattern.type,
          fullMatch: match[0],
        });
      }
    }
  });

  matches.sort((a, b) => a.start - b.start);

  let processedUntil = 0;
  matches.forEach((match) => {
    if (match.start > processedUntil) {
      const plainText = content.substring(processedUntil, match.start);
      if (plainText) {
        textRuns.push(
          new TextRun({
            text: plainText,
            font: DOCX_CONFIG.fonts.body,
            size: DOCX_CONFIG.sizes.body * 2,
          })
        );
      }
    }

    const runOptions = {
      text: match.text,
      size: DOCX_CONFIG.sizes.body * 2,
    };

    if (match.type === "bold") {
      runOptions.bold = true;
      runOptions.font = DOCX_CONFIG.fonts.body;
    } else if (match.type === "italic") {
      runOptions.italics = true;
      runOptions.font = DOCX_CONFIG.fonts.body;
    } else if (match.type === "code") {
      runOptions.font = DOCX_CONFIG.fonts.code;
      runOptions.size = DOCX_CONFIG.sizes.code * 2;
      runOptions.color = DOCX_CONFIG.colors.code;
      runOptions.shading = {
        fill: DOCX_CONFIG.colors.inlineCodeBg,
        type: "clear",
      };
    } else if (match.type === "underline") {
      runOptions.underline = {};
      runOptions.font = DOCX_CONFIG.fonts.body;
    } else if (match.type === "highlight") {
      runOptions.highlight = "yellow";
      runOptions.font = DOCX_CONFIG.fonts.body;
    } else if (match.type === "color") {
      const hexColor = match.color.startsWith("#") ? match.color.substring(1) : match.color;
      runOptions.color = hexColor;
      runOptions.font = DOCX_CONFIG.fonts.body;
    }

    textRuns.push(new TextRun(runOptions));
    processedUntil = match.end;
  });

  if (processedUntil < content.length) {
    const remainingText = content.substring(processedUntil);
    if (remainingText) {
      textRuns.push(
        new TextRun({
          text: remainingText,
          font: DOCX_CONFIG.fonts.body,
          size: DOCX_CONFIG.sizes.body * 2,
        })
      );
    }
  }

  return textRuns.length > 0
    ? textRuns
    : [
        new TextRun({
          text: content,
          font: DOCX_CONFIG.fonts.body,
          size: DOCX_CONFIG.sizes.body * 2,
        }),
      ];
}

async function processMdContent(mdContent) {
  if (!mdContent || mdContent.trim() === "") {
    return [];
  }

  const tokens = md.parse(mdContent, {});
  const paragraphs = [];
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
          
          let headingLevel = HeadingLevel.HEADING_3;
          if (level === 1) headingLevel = HeadingLevel.HEADING_1;
          else if (level === 2) headingLevel = HeadingLevel.HEADING_2;

          let docxAlignment = AlignmentType.LEFT;
          if (alignment === "center") docxAlignment = AlignmentType.CENTER;
          else if (alignment === "right") docxAlignment = AlignmentType.RIGHT;
          else if (alignment === "justify") docxAlignment = AlignmentType.JUSTIFY;

          paragraphs.push(
            new Paragraph({
              text: titleText,
              heading: headingLevel,
              spacing: {
                before: DOCX_CONFIG.spacing.headingBefore,
                after: DOCX_CONFIG.spacing.headingAfter,
              },
              alignment: docxAlignment,
            })
          );
          
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

        const tableRows = [];

        if (headers.length > 0) {
          tableRows.push(
            new TableRow({
              children: headers.map(
                (h) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: h,
                            bold: true,
                            font: DOCX_CONFIG.fonts.heading,
                          }),
                        ],
                      }),
                    ],
                    shading: {
                      fill: "F1F5F9",
                    },
                  })
              ),
            })
          );
        }

        rows.forEach((row, rIdx) => {
          tableRows.push(
            new TableRow({
              children: row.map(
                (cell) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: cell,
                            font: DOCX_CONFIG.fonts.body,
                          }),
                        ],
                      }),
                    ],
                    shading: rIdx % 2 === 1 ? { fill: "F8FAFC" } : undefined,
                  })
              ),
            })
          );
        });

        if (tableRows.length > 0) {
          paragraphs.push(
            new Table({
              rows: tableRows,
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
                left: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
                right: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
                insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
              },
            })
          );

          paragraphs.push(
            new Paragraph({
              text: "",
              spacing: { after: 200 },
            })
          );
        }

        i = j;
        continue;
      }

      // HANDLE HEADINGS
      if (token.type === "heading_open") {
        const level = parseInt(token.tag.slice(1), 10);
        const nextToken = tokens[i + 1];

        if (nextToken && nextToken.type === "inline") {
          let headingLevel, fontSize;

          switch (level) {
            case 1:
              headingLevel = HeadingLevel.HEADING_1;
              fontSize = DOCX_CONFIG.sizes.h1;
              break;
            case 2:
              headingLevel = HeadingLevel.HEADING_2;
              fontSize = DOCX_CONFIG.sizes.h2;
              break;
            case 3:
              headingLevel = HeadingLevel.HEADING_3;
              fontSize = DOCX_CONFIG.sizes.h3;
              break;
            default:
              headingLevel = HeadingLevel.HEADING_3;
              fontSize = DOCX_CONFIG.sizes.h3;
          }

          paragraphs.push(
            new Paragraph({
              text: nextToken.content,
              heading: headingLevel,
              spacing: {
                before: DOCX_CONFIG.spacing.headingBefore,
                after: DOCX_CONFIG.spacing.headingAfter,
              },
            })
          );

          i += 2;
          continue;
        }
      }

      // Handle code blocks
      if (token.type === "fence" || token.type === "code_block") {
        if (token.info && token.info.trim()) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Language: ${token.info.trim()}`,
                  font: DOCX_CONFIG.fonts.body,
                  size: 16,
                  color: "64748b",
                  italics: true,
                }),
              ],
              spacing: { before: 100, after: 50 },
            })
          );
        }

        const codeLines = token.content
          .split("\n")
          .filter((line) => line.trim());

        codeLines.forEach((line) => {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line || " ",
                  font: DOCX_CONFIG.fonts.code,
                  size: DOCX_CONFIG.sizes.code * 2,
                  color: DOCX_CONFIG.colors.codeBlock,
                }),
              ],
              spacing: {
                before: 50,
                after: 50,
                line: 276,
              },
              shading: {
                fill: DOCX_CONFIG.colors.codeBg,
                type: "clear",
              },
              indent: {
                left: 360,
              },
            })
          );
        });

        paragraphs.push(
          new Paragraph({
            text: "",
            spacing: { after: 200 },
          })
        );

        i++;
        continue;
      }

      // HANDLE PARAGRAPHS
      if (token.type === "paragraph_open") {
        const nextToken = tokens[i + 1];

        if (nextToken && nextToken.type === "inline" && nextToken.content) {
          // Detect Manual Page Break
          if (nextToken.content.includes("page-break") || nextToken.content.includes("pagebreak")) {
            paragraphs.push(
              new Paragraph({
                text: "",
                pageBreakBefore: true,
              })
            );
            i += 2;
            continue;
          }

          // Detect Image
          const imgMatch = nextToken.content.match(/!\[(.*?)\]\((.*?)\)/);
          if (imgMatch) {
            const src = imgMatch[2];
            const buffer = await getImageBuffer(src);
            if (buffer) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: buffer,
                      transformation: {
                        width: 350,
                        height: 250,
                      },
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 200, after: 200 },
                })
              );
            }
            i += 2;
            continue;
          }

          // Alignment support
          const { alignment, cleanText } = getAlignmentAndCleanText(nextToken.content);
          const textRuns = processInlineContent(cleanText);

          let docxAlignment = AlignmentType.LEFT;
          if (alignment === "center") docxAlignment = AlignmentType.CENTER;
          else if (alignment === "right") docxAlignment = AlignmentType.RIGHT;
          else if (alignment === "justify") docxAlignment = AlignmentType.JUSTIFY;

          if (textRuns.length > 0) {
            paragraphs.push(
              new Paragraph({
                children: textRuns,
                spacing: {
                  before: DOCX_CONFIG.spacing.paragraphBefore,
                  after: DOCX_CONFIG.spacing.paragraphAfter,
                  line: 360,
                },
                alignment: docxAlignment,
              })
            );
          }

          i += 2;
          continue;
        }
      }

      // HANDLE BULLET LISTS
      if (token.type === "bullet_list_open") {
        i++;

        while (i < tokens.length && tokens[i].type !== "bullet_list_close") {
          if (tokens[i].type === "list_item_open") {
            i++;

            if (tokens[i] && tokens[i].type === "paragraph_open") {
              i++;

              if (tokens[i] && tokens[i].type === "inline") {
                const textRuns = processInlineContent(tokens[i].content);

                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "• ",
                        bold: true,
                        font: DOCX_CONFIG.fonts.body,
                        size: DOCX_CONFIG.sizes.body * 2,
                      }),
                      ...textRuns,
                    ],
                    spacing: { before: 100, after: 100 },
                    indent: { left: 360 },
                  })
                );
              }
            }
          }
          i++;
        }

        paragraphs.push(new Paragraph({ text: "", spacing: { after: 200 } }));
        i++;
        continue;
      }

      // HANDLE ORDERED LISTS
      if (token.type === "ordered_list_open") {
        let listCounter = 1;
        i++;

        while (i < tokens.length && tokens[i].type !== "ordered_list_close") {
          if (tokens[i].type === "list_item_open") {
            i++;

            if (tokens[i] && tokens[i].type === "paragraph_open") {
              i++;

              if (tokens[i] && tokens[i].type === "inline") {
                const textRuns = processInlineContent(tokens[i].content);

                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${listCounter}. `,
                        bold: true,
                        font: DOCX_CONFIG.fonts.body,
                        size: DOCX_CONFIG.sizes.body * 2,
                      }),
                      ...textRuns,
                    ],
                    spacing: { before: 100, after: 100 },
                    indent: { left: 360 },
                  })
                );

                listCounter++;
              }
            }
          }
          i++;
        }

        paragraphs.push(new Paragraph({ text: "", spacing: { after: 200 } }));
        i++;
        continue;
      }

      i++;
    } catch (error) {
      console.error("Error processing token:", token, error);
      i++;
    }
  }

  return paragraphs;
}

// GENERATE COMPLETE DOCX FILE
async function generateDocx(book) {
  const sections = [];

  // COVER PAGE
  if (book.coverImage && !book.coverImage.includes("pravatar")) {
    const rel = book.coverImage.replace(/^\//, "");
    const imagePath = path.join(__dirname, "../../", rel);

    try {
      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);

        sections.push(new Paragraph({ text: "", spacing: { before: 1000 } }));

        sections.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: {
                  width: 400,
                  height: 550,
                },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 400 },
          })
        );

        sections.push(
          new Paragraph({
            text: "",
            pageBreakBefore: true,
          })
        );
      } else {
        console.warn(`DOCX cover image not found at path: ${imagePath}`);
      }
    } catch (imgErr) {
      console.error(`Could not embed cover image: ${imagePath}`, imgErr);
    }
  }

  // TITLE PAGE
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: book.title,
          color: DOCX_CONFIG.colors.title,
          font: DOCX_CONFIG.fonts.heading,
          size: DOCX_CONFIG.sizes.title * 2,
          bold: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 2000, after: 400 },
    })
  );

  if (book.subtitle && book.subtitle.trim()) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: book.subtitle,
            color: DOCX_CONFIG.colors.subtitle,
            font: DOCX_CONFIG.fonts.heading,
            size: DOCX_CONFIG.sizes.subtitle * 2,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
  }

  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `by ${book.author}`,
          color: DOCX_CONFIG.colors.author,
          font: DOCX_CONFIG.fonts.heading,
          size: DOCX_CONFIG.sizes.author * 2,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  sections.push(
    new Paragraph({
      text: "",
      border: {
        bottom: {
          color: "4f46e5",
          space: 1,
          style: "single",
          size: 12,
        },
      },
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
    })
  );

  // PROCESS CHAPTERS
  for (let index = 0; index < book.chapters.length; index++) {
    const chapter = book.chapters[index];
    try {
      if (index > 0) {
        sections.push(
          new Paragraph({
            text: "",
            pageBreakBefore: true,
          })
        );
      }

      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: chapter.title,
              color: DOCX_CONFIG.colors.chapterTitle,
              font: DOCX_CONFIG.fonts.heading,
              size: DOCX_CONFIG.sizes.chapterTitle * 2,
              bold: true,
            }),
          ],
          spacing: {
            before: DOCX_CONFIG.spacing.chapterBefore,
            after: DOCX_CONFIG.spacing.chapterAfter,
          },
        })
      );

      const contentParagraphs = await processMdContent(chapter.content || "");
      sections.push(...contentParagraphs);
    } catch (chapterErr) {
      console.error(`Error processing chapter ${index + 1}:`, chapterErr);
    }
  }

  // CREATE DOCUMENT
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: sections,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

module.exports = { generateDocx };
