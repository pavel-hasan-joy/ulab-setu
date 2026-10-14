import fs from "fs";
import path from "path";
import { chromium } from "playwright-core";

async function generatePdf() {
  const mdPath = path.resolve(process.cwd(), "PROJECT_SUMMARY.md");
  const pdfPath = path.resolve(process.cwd(), "PROJECT_SUMMARY.pdf");

  if (!fs.existsSync(mdPath)) {
    console.error("PROJECT_SUMMARY.md not found!");
    process.exit(1);
  }

  const markdownContent = fs.readFileSync(mdPath, "utf-8");

  console.log("Launching headless browser to render PDF...");
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  const page = await browser.newPage();

  // Create an HTML template that renders Markdown via Marked
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ULAB Setu — Project Summary</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    @page {
      size: A4;
      margin: 18mm 14mm 18mm 14mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.6;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    h1 {
      font-size: 20pt;
      font-weight: 800;
      color: #003366;
      border-bottom: 2.5px solid #003366;
      padding-bottom: 6px;
      margin-top: 0;
      margin-bottom: 12px;
      page-break-after: avoid;
    }
    h2 {
      font-size: 14pt;
      font-weight: 700;
      color: #003366;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 4px;
      margin-top: 20px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }
    h3 {
      font-size: 11.5pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 16px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }
    h4 {
      font-size: 10.5pt;
      font-weight: 700;
      color: #334155;
      margin-top: 12px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }
    p {
      margin-top: 0;
      margin-bottom: 8px;
    }
    blockquote {
      margin: 12px 0;
      padding: 8px 14px;
      background-color: #f8fafc;
      border-left: 4px solid #003366;
      border-radius: 0 6px 6px 0;
      color: #475569;
      font-size: 10pt;
    }
    blockquote p {
      margin: 0;
    }
    ul, ol {
      margin-top: 0;
      margin-bottom: 10px;
      padding-left: 22px;
    }
    li {
      margin-bottom: 4px;
    }
    hr {
      border: 0;
      height: 1px;
      background: #e2e8f0;
      margin: 18px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      text-align: left;
    }
    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 10px 14px;
      border-radius: 6px;
      overflow-x: auto;
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 8.5pt;
      line-height: 1.45;
      margin: 12px 0;
      page-break-inside: avoid;
    }
    code {
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 9pt;
      background: #f1f5f9;
      color: #0f172a;
      padding: 2px 5px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      border: none;
      font-size: 8.5pt;
    }
    a {
      color: #003366;
      text-decoration: underline;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      font-size: 8pt;
      font-weight: 700;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div id="content"></div>
  <script>
    const markdown = ${JSON.stringify(markdownContent)};
    document.getElementById('content').innerHTML = marked.parse(markdown);
  </script>
</body>
</html>
`;

  await page.setContent(htmlTemplate, { waitUntil: "networkidle" });

  console.log("Generating PDF file...");
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: {
      top: "18mm",
      bottom: "18mm",
      left: "14mm",
      right: "14mm",
    },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-family: sans-serif; font-size: 8pt; color: #94a3b8; width: 100%; padding: 0 14mm; display: flex; justify-content: space-between;">
        <span>ULAB Setu — System Architecture & Project Blueprint</span>
        <span>Version 2.5</span>
      </div>
    `,
    footerTemplate: `
      <div style="font-family: sans-serif; font-size: 8pt; color: #94a3b8; width: 100%; padding: 0 14mm; display: flex; justify-content: space-between;">
        <span>University of Liberal Arts Bangladesh</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `,
  });

  await browser.close();
  console.log(`✅ PROJECT_SUMMARY.pdf successfully generated at: ${pdfPath}`);
}

generatePdf().catch((err) => {
  console.error("PDF generation failed:", err);
  process.exit(1);
});
