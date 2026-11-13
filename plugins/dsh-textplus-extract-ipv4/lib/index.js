/**
 * 文本增强：extract ipv4 — 文本增强
 */

export const name = "dsh-textplus-extract-ipv4";
export const inject = ["tools"];

const NL = String.fromCharCode(10);
const SITE = "https://deepseekbase.com/zh/tools/";
const TEXT_OUTPUT = {
  schema: { type: "object", additionalProperties: false, properties: { text: { type: "string" } }, required: ["text"] },
  render: (_args, value) => [{ type: "text", text: (value && value.text) || "" }],
};

function lines(t) { return String(t).split(/\r?\n/); }
function lev(a, b) {
  a = String(a); b = String(b);
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (x, i) => [i].concat(new Array(n).fill(0)));
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[m][n];
}
function tokens(t) { return String(t).toLowerCase().split(/[\s,.;:!?，。；：！？、"'()\[\]{}]+/).filter(Boolean); }
function widthOf(c) { const cp = c.codePointAt(0); return (cp >= 0x4e00 && cp <= 0x9fa5) || (cp >= 0x3000 && cp <= 0x303f) || (cp >= 0xff00 && cp <= 0xffef) ? 2 : 1; }
function displayWidth(s) { return Array.from(String(s)).reduce((n, c) => n + widthOf(c), 0); }
function isEmoji(c) { const cp = c.codePointAt(0); return (cp >= 0x1F300 && cp <= 0x1FAFF) || (cp >= 0x2600 && cp <= 0x27BF) || cp === 0xFE0F; }

const OPS = {
  levenshtein: (t, a) => "编辑距离: " + lev(t, a),
  similarity: (t, a) => { const d = lev(t, a); const max = Math.max(String(t).length, String(a).length) || 1; return "相似度: " + (Math.round((1 - d / max) * 10000) / 100) + "%"; },
  jaccard: (t, a) => { const A = new Set(tokens(t)), B = new Set(tokens(a)); const inter = [...A].filter((x) => B.has(x)).length; const uni = new Set([...A, ...B]).size; return "Jaccard: " + (Math.round(inter / (uni || 1) * 10000) / 100) + "%"; },
  diff_lines: (t, a) => { const A = lines(t), B = lines(a); const out = []; const n = Math.max(A.length, B.length); for (let i = 0; i < n; i++) { if (A[i] !== B[i]) out.push("行 " + (i + 1) + ": - " + (A[i] === undefined ? "" : A[i]) + NL + "      + " + (B[i] === undefined ? "" : B[i])); } return out.length ? out.join(NL) : "无差异"; },
  diff_words: (t, a) => { const A = String(t).split(/\s+/), B = String(a).split(/\s+/); const out = []; const n = Math.max(A.length, B.length); for (let i = 0; i < n; i++) { if (A[i] !== B[i]) out.push("词 " + (i + 1) + ": - " + (A[i] || "") + " + " + (B[i] || "")); } return out.length ? out.join(NL) : "无差异"; },
  mask_phone: (t) => String(t).replace(/1[3-9]\d{9}/g, (m) => m.slice(0, 3) + "****" + m.slice(7)),
  mask_email: (t) => String(t).replace(/([\w.-]+)@([\w.-]+)/g, (m, u, d) => u.slice(0, 2) + "***@" + d),
  mask_id: (t) => String(t).replace(/\d{17}[\dXx]/g, (m) => m.slice(0, 6) + "********" + m.slice(14)),
  mask_card: (t) => String(t).replace(/\d{16,19}/g, (m) => m.slice(0, 4) + " **** **** " + m.slice(-4)),
  mask_name: (t) => String(t).replace(/[\u4e00-\u9fa5]{2,4}/g, (m) => m[0] + "*".repeat(m.length - 1)),
  extract_phones: (t) => (String(t).match(/1[3-9]\d{9}/g) || []).join(NL) || "未找到",
  extract_hashtags: (t) => (String(t).match(/#[^\s#]+/g) || []).join(NL) || "未找到",
  extract_mentions: (t) => (String(t).match(/@[^\s@]+/g) || []).join(NL) || "未找到",
  extract_ipv4: (t) => (String(t).match(/\b(\d{1,3}\.){3}\d{1,3}\b/g) || []).join(NL) || "未找到",
  remove_emoji: (t) => Array.from(String(t)).filter((c) => !isEmoji(c)).join(""),
  char_width: (t) => { const a = Array.from(String(t)); const wide = a.filter((c) => widthOf(c) === 2).length; return "字符: " + a.length + NL + "全角: " + wide + NL + "半角: " + (a.length - wide); },
  text_width: (t) => "显示宽度: " + displayWidth(t) + " 列",
  truncate: (t, a) => { const n = Math.max(1, Number(a) || 20); const cs = Array.from(String(t)); return cs.length <= n ? String(t) : cs.slice(0, n).join("") + "…"; },
  wrap: (t, a) => { const n = Math.max(5, Number(a) || 40); const out = []; for (const line of lines(t)) { let cur = ""; for (const c of Array.from(line)) { cur += c; if (displayWidth(cur) >= n) { out.push(cur); cur = ""; } } if (cur) out.push(cur); } return out.join(NL); },
  indent: (t, a) => String(t).split(NL).map((l) => " ".repeat(Math.max(0, Number(a) || 2)) + l).join(NL),
  bullet_list: (t) => lines(t).filter((x) => x.trim()).map((x) => "- " + x.trim()).join(NL),
  numbered_list: (t) => lines(t).filter((x) => x.trim()).map((x, i) => (i + 1) + ". " + x.trim()).join(NL),
  quote: (t) => lines(t).map((l) => "> " + l).join(NL),
  unquote: (t) => lines(t).map((l) => l.replace(/^>\s?/, "")).join(NL),
  strip_markdown: (t) => String(t).replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[#*_~\x60>]/g, "").replace(/\n{3,}/g, NL + NL),
  markdown_links: (t) => { const out = []; const re = /\[([^\]]*)\]\(([^)]+)\)/g; let m; while ((m = re.exec(String(t))) !== null) out.push(m[1] + " -> " + m[2]); return out.join(NL) || "未找到链接"; },
  table_align: (t) => { const rows = lines(t).filter((x) => x.indexOf("|") >= 0).map((r) => r.trim()); if (!rows.length) return "没有表格行"; const m = rows[0].replace(/^\|/, "").replace(/\|$/, "").split("|").length; return "列数: " + m + NL + rows.map((r) => { const cells = r.replace(/^\|/, "").replace(/\|$/, "").split("|"); return cells.map((c) => c.trim()).join(" | "); }).join(NL); },
  reading_time: (t) => { const w = tokens(t).length; return "词数: " + w + NL + "阅读时长: 约 " + Math.max(1, Math.round(w / 300)) + " 分钟"; },
  word_freq: (t, a) => { const n = Math.max(1, Number(a) || 10); const m = {}; tokens(t).forEach((x) => { m[x] = (m[x] || 0) + 1; }); return Object.keys(m).sort((x, y) => m[y] - m[x]).slice(0, n).map((k) => k + ": " + m[k]).join(NL); },
};

export function apply(ctx, config) {
  void config;
  ctx.tools.register({
    name: "textplus_extract_ipv4",
    description: "extract ipv4",
    parameters: {
      text: { "type": "string", required: true, "description": "输入" },
    },
    output: TEXT_OUTPUT,
    async execute(args) {
      const t = args && args.text != null ? String(args.text) : "";
      const a = args && args.a != null ? String(args.a) : "";
      try {
        const fn = OPS["extract_ipv4"];
        if (!fn) throw new Error("未知操作");
        return { text: ["文本增强：extract ipv4", "=".repeat(52), String(fn(t, a)), "", "更多工具：" + SITE].join(NL) };
      } catch (e) {
        return { text: "处理失败: " + String((e && e.message) || e) };
      }
    },
  });
}
