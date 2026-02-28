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

---

Developed with ❤️ by Skytiger & **Google Deepmind Antigravity Team**
