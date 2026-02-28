# GitHub Diff Analyzer

分析 GitHub 專案的 git diff，透過 **Gemini AI (via OpenRouter)** 產生人話版異動說明，輸出 Excel 報表讓非技術人員也能看懂改了什麼。

## Features

- 🔍 Clone GitHub 專案並自動取得 diff
- 🧠 透過 Gemini 2.0 Flash AI 分析每個檔案的變更
- 📊 產出繁體中文 Excel (.xlsx) 報表，含樣式與自動換行
- 📋 支持指定 commit、比對兩個 commit、或分析最新一筆
- 💻 **變更對照**：直接在 Excel 中列出「變更前」與「變更後」的程式碼
- ⚡ **提供 Windows `run.bat` 互動式啟動器**，不用背指令也能跑

## Quick Start

```bash
# 安裝依賴
npm install

# 互動式執行 (Windows 推薦)
run.bat

# 手動分析最新一筆 commit
node src/index.js --repo https://github.com/user/repo

# 列出最近 10 筆 commit
node src/index.js --repo https://github.com/user/repo --list 10

# 比對兩個 commit
node src/index.js --repo https://github.com/user/repo --compare abc1234..def5678

# 指定輸出路徑
node src/index.js --repo https://github.com/user/repo --output result.xlsx
```

## Options

| 參數 | 說明 | 預設值 |
|---|---|---|
| `--repo <url>` | GitHub repo URL（必填） | - |
| `--commit <sha>` | 指定 commit SHA | 最新一筆 |
| `--compare <sha1..sha2>` | 比對兩個 commit | - |
| `--list <count>` | 列出最近 N 筆 commit | - |
| `--output <path>` | Excel 輸出路徑 | `./diff-report.xlsx` |

## Excel Output 欄位說明

| 欄位 | 說明 |
|---|---|
| 檔案名稱 | 變更的檔案路徑 |
| 新增行數 | 新增的程式碼行數 |
| 刪除行數 | 刪除的程式碼行數 |
| **變更前** | 被刪除的原始程式碼（紅字） |
| **變更後** | 新增的最新程式碼（綠字） |
| 異動摘要 | AI 生成的一句話摘要 |
| 詳細說明 | AI 生成的詳細描述（非技術用語） |
| 影響範圍 | AI 評估的影響 |

## Prerequisites

- Node.js 18+
- Git
- `OPENROUTER_API_KEY` 設定在 `d:\code\.env` 中

## 🏢 企業內部部署情境

本工具支援企業內部 Git 與 LLM，**全程不出內網**，適合有資安需求的環境。

### 支援的 Git 平台

| 平台 | 範例 |
|---|---|
| GitHub Enterprise | `--repo https://github.yourcompany.com/org/repo` |
| GitLab | `--repo https://gitlab.yourcompany.com/org/repo` |
| Bitbucket | `--repo https://bitbucket.yourcompany.com/org/repo` |
| SSH 認證 | `--repo git@github.yourcompany.com:org/repo.git` |

只要你的機器能 `git clone` 該 repo（已設定 SSH Key 或 Token），即可直接使用。

### 切換為企業內部 LLM（LiteLLM Gateway）

修改 `src/ai-analyzer.js` 中的兩個常數即可：

```javascript
// 改為你的 LiteLLM Gateway 網址
const OPENROUTER_BASE = 'https://your-litellm-gateway.yourcompany.com/chat/completions';

// 改為 LiteLLM 上設定的模型名稱
const MODEL = 'your-internal-model-name';
```

並在 `.env` 中設定 LiteLLM 的 API Key：

```env
OPENROUTER_API_KEY=sk-your-litellm-key
```

> **💡 提示：** LiteLLM 使用 OpenAI-compatible API 格式，因此 Header 和 Request Body 完全相容，其他程式碼不需要任何修改。

### 支援的企業 LLM 方案

| 方案 | 相容性 | 備註 |
|---|---|---|
| **LiteLLM** | ✅ 完全相容 | 推薦，統一所有 LLM 介面 |
| **vLLM / TGI** | ✅ 原生相容 | 自架開源模型 |
| **Ollama** | ✅ 原生相容 | 本機部署，endpoint: `http://localhost:11434/v1/chat/completions` |
| **Azure OpenAI** | ✅ 需調整 | 改 endpoint + 加 `api-version` header |
| **AWS Bedrock** | ⚠️ 需轉接 | 透過 LiteLLM 代理即可 |

### 模型建議

- 中文摘要品質建議至少使用 **70B** 等級模型（如 Qwen2.5-72B）
- 大型 diff 需要 **32K+** context window，請確認模型支援

---

Developed with ❤️ by Skytiger & **Google Deepmind Antigravity Team**
