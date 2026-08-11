import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const sourceRoots = ["app", "components", "lib"];
const sourceExtensions = new Set([".js", ".jsx", ".ts", ".tsx", ".css"]);
const globalTokenFile = path.normalize("app/globals.css");

const checks = [
  {
    name: "direct hex color",
    pattern: /#[0-9a-fA-F]{3,4}\b|#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?\b/g,
    message: "Use a semantic token from globals.css instead of a direct hex color."
  },
  {
    name: "direct color function",
    pattern: /\b(?:rgb|rgba|hsl|hsla)\((?!\s*var\(--)/g,
    message: "Use a semantic CSS variable. Token-driven rgb(var(--token)) is allowed."
  },
  {
    name: "Tailwind palette utility",
    pattern: /\b(?:bg|text|border|ring|from|via|to|fill|stroke|outline|shadow|divide|placeholder|decoration|caret|accent)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}(?:\/[0-9]{1,3})?\b/g,
    message: "Use a semantic Tailwind utility such as bg-primary, text-foreground, or border-border."
  },
  {
    name: "absolute white/black utility",
    pattern: /\b(?:bg|text|border|ring|from|via|to|fill|stroke|outline|shadow|divide|placeholder|decoration|caret|accent)-(?:white|black)(?:\/[0-9]{1,3})?\b/g,
    message: "Use surface, inverse-foreground, overlay, or another semantic token."
  },
  {
    name: "arbitrary color utility",
    pattern: /\b(?:bg|text|border|ring|from|via|to|fill|stroke|outline|shadow|divide|placeholder|decoration|caret|accent)-\[(?:#|rgba?\(|hsla?\(|color:)/g,
    message: "Map the color through globals.css and tailwind.config.ts first."
  },
  {
    name: "direct named color",
    pattern: /\b(?:color|background(?:-color)?|border(?:-[a-z]+)?-color|outline-color|fill|stroke)\s*:\s*(?:white|black|red|orange|yellow|green|blue|indigo|violet|purple|pink|gray|grey)\b/g,
    message: "Use a semantic CSS variable instead of a named CSS color."
  }
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(entryPath));
    } else if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
}

function getLineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

const files = (await Promise.all(
  sourceRoots.map((root) => collectFiles(path.join(projectRoot, root)))
)).flat();
const violations = [];

for (const file of files) {
  const relativePath = path.normalize(path.relative(projectRoot, file));
  if (relativePath === globalTokenFile) {
    continue;
  }

  const content = await readFile(file, "utf8");
  for (const check of checks) {
    for (const match of content.matchAll(check.pattern)) {
      violations.push({
        file: relativePath,
        line: getLineNumber(content, match.index ?? 0),
        value: match[0],
        rule: check.name,
        message: check.message
      });
    }
  }
}

if (violations.length > 0) {
  console.error("Color token compliance failed:\n");
  for (const violation of violations) {
    console.error(`${violation.file}:${violation.line} [${violation.rule}] ${violation.value}`);
    console.error(`  ${violation.message}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Color token compliance passed (${files.length} source files checked).`);
}
