import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from d:\code\.env
config({ path: resolve('d:/code/.env') });

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.0-flash-001';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

function getApiKey() {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
        throw new Error(
            '❌ OPENROUTER_API_KEY not found. Please set it in d:\\code\\.env or as an environment variable.'
        );
    }
    return key;
}

const SYSTEM_PROMPT = `你是一位資深軟體工程師，擅長用淺顯易懂的方式向非技術人員解釋程式碼變更。

你會收到一份 git diff（程式碼的變更前後比對）。請分析這份 diff，並以繁體中文回答。

你的回答必須是一個 JSON 物件，格式如下：
{
  "summary": "一句話摘要，說明這個檔案改了什麼",
  "details": "用 2-4 句話詳細說明具體改了哪些內容，用非技術人員能理解的方式描述",
  "impact": "這個改動可能造成的影響或目的"
}

規則：
1. 不要用程式術語（如 function、variable、class），改用日常用語
2. 著重說明「改了什麼」和「為什麼要改」
3. 如果是新增檔案，說明這個檔案的用途
4. 如果是刪除檔案，說明移除的原因（推測）
5. 只回傳 JSON，不要有其他文字`;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Analyze a single file's diff using OpenRouter API.
 * @param {string} diffText - Formatted diff text
 * @param {string} fileName - File path
 * @returns {Promise<{ summary: string, details: string, impact: string }>}
 */
export async function analyzeFileDiff(diffText, fileName) {
    const apiKey = getApiKey();

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const res = await fetch(OPENROUTER_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://github.com/skytiger111/github-diff-analyzer',
                    'X-Title': 'GitHub Diff Analyzer',
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: `以下是檔案 "${fileName}" 的 diff：\n\n${diffText}` },
                    ],
                    temperature: 0.3,
                    max_tokens: 1024,
                }),
            });

            if (!res.ok) {
                const body = await res.text();
                const is429 = res.status === 429;

                if (is429 && attempt < MAX_RETRIES) {
                    const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
                    console.warn(`⏳ Rate limited on ${fileName}, retry ${attempt}/${MAX_RETRIES} in ${delay / 1000}s...`);
                    await sleep(delay);
                    continue;
                }

                throw new Error(`HTTP ${res.status}: ${body}`);
            }

            const data = await res.json();
            const raw = data.choices?.[0]?.message?.content ?? '';
            const text = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(text);
        } catch (err) {
            if (attempt < MAX_RETRIES && err.message?.includes('429')) {
                const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
                console.warn(`⏳ Rate limited on ${fileName}, retry ${attempt}/${MAX_RETRIES} in ${delay / 1000}s...`);
                await sleep(delay);
                continue;
            }

            console.warn(`⚠️ AI analysis failed for ${fileName}: ${err.message}`);
            return {
                summary: '分析失敗',
                details: err.message?.includes('429')
                    ? 'API 額度已用完，請稍後再試'
                    : `無法取得 AI 分析結果: ${err.message}`,
                impact: '未知',
            };
        }
    }
}

/**
 * Analyze all parsed files with rate limiting.
 * @param {{ file: string, diffText: string }[]} fileDiffs
 * @returns {Promise<{ file: string, summary: string, details: string, impact: string }[]>}
 */
export async function analyzeAllFiles(fileDiffs) {
    const results = [];
    const total = fileDiffs.length;

    for (let i = 0; i < total; i++) {
        const { file, diffText } = fileDiffs[i];
        console.log(`🤖 Analyzing [${i + 1}/${total}]: ${file}`);

        const analysis = await analyzeFileDiff(diffText, file);
        results.push({ file, ...analysis });

        // Rate limit: wait 300ms between requests
        if (i < total - 1) {
            await sleep(300);
        }
    }

    return results;
}
