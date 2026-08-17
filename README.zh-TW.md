# RTK — Relay Task Kernel

**一份交接規則，Claude Code、Codex、Gemini CLI、Copilot 全部共用。**

[English](README.md)

---

## 這解決什麼問題

你不會只用一個 AI coding agent。但每一個都要自己的指令檔：

```
AGENTS.md                        Codex
CLAUDE.md                        Claude Code
GEMINI.md                        Gemini CLI
.github/copilot-instructions.md  Copilot
```

所以同一套規則你寫了四遍。改一條規則要同步三個檔案。然後新開一個對話，
AI 完全不知道昨天發生什麼事，你第九次重講一遍專案背景——就在它 force push 之前。

RTK 把那四個檔案變成指向同一份規則的薄入口，再給專案一份小而刻意的記憶，
跨對話、跨 AI 都還在。

## 快速開始

```bash
npx github:leavemagic-cyber/relay-task-kernel init --all
```

`--all` 會同時寫入機器層的 `~/.rtk/` 和目前 repo 的專案層設定。
回答四個問題，或直接加 `--yes` 用自動偵測的值。

已經有自己寫的 `CLAUDE.md`？留著就好。RTK 只管自己標記區塊內的內容，區塊外一個字都不動。

## 它會產生什麼

```
~/.rtk/                        跨專案共用的協定
├── RTK.md                     載入順序 + 核心約定
├── rules/                     核心規則、禁止事項、改碼規則
├── templates/                 任務包、脈絡膠囊、記憶補丁、交接卡
└── schemas/                   機器可讀的任務包格式
~/.codex/AGENTS.md             Codex 全域入口

你的 repo/
├── START_HERE.md              所有 AI 進來先讀的那一張卡
├── AGENTS.md                  ─┐
├── CLAUDE.md                   ├ 薄入口，全部指向同一套規則
├── GEMINI.md                   │
├── .github/copilot-instructions.md ─┘
└── .rtk/
    ├── project.md             比全域更嚴的專案規則
    └── memory/
        ├── project-brief.md     這是什麼、資料夾各管什麼
        ├── current-state.md     現在做到哪、什麼還沒完
        ├── user-preferences.md  你習慣怎麼被回報
        └── mistakes-to-avoid.md 已經踩過一次的坑
```

實際用下來最有價值的是 `START_HERE.md`：一張短卡、所有 AI 第一個讀，
寫清楚鐵規矩和「先跑這行指令看現況」——而不是讓 AI 自己亂開檔案猜專案長什麼樣。

## 合併機制

每個產生出來的區塊都有圍欄：

```markdown
# 我自己寫在上面的筆記 — 不會被動到

<!-- RTK:BEGIN PROJECT-RTK-CLAUDE -->
...自動產生...
<!-- RTK:END PROJECT-RTK-CLAUDE -->

## 我自己寫在下面的段落 — 一樣不會被動到
```

所以：

- **可重複執行**：沒改過的 repo 再跑一次 `rtk init`，回報 `0 file(s) changed`。
- **不破壞**：標記區塊外的內容，每次升級都完整保留。
- **可還原**：任何覆寫都會在旁邊留下 `CLAUDE.backup.20260817-143022.md`。
- **可檢查**：`rtk check` 會告訴你哪個區塊被刪掉了——AI 就是這樣默默失去規則的。

## 指令

| 指令 | 作用 |
|---|---|
| `rtk init` | 把規則寫進這個 repo |
| `rtk init --global` | 只寫 `~/.rtk/` 和 `~/.codex/AGENTS.md` |
| `rtk init --all` | 兩邊都寫 |
| `rtk check` | 檢查所有管理區塊是否完整（有問題回傳 exit 1） |
| `rtk eject` | 移除 RTK 的區塊，你自己寫的內容全部保留 |
| `rtk presets` | 列出可用情境 |

常用參數：`--dry-run`、`--yes`、`--dir <路徑>`、`--preset <名稱>`、
`--no-backup`、`--crlf`、`--set KEY=VALUE`。

```bash
rtk init --dry-run          # 先看會改什麼，不寫檔
rtk check --all             # 適合放進 CI
```

## 情境預設（presets）

```bash
rtk init --preset content-site
```

| 預設 | 適合 |
|---|---|
| `content-site` | 部落格、文件站、內容站——加上發布關卡，草稿不會外流到正式站 |
| `oss-library` | 已發布的套件——AI 不准動版號、tag、release |

一個 preset 就是一個小 JSON，加上變數和額外規則檔，自己寫大概十行。

## 範本變數

從 git 和 `package.json` 自動偵測，也可以用參數覆蓋：

| 變數 | 參數 | 偵測來源 |
|---|---|---|
| `PROJECT_NAME` | `--name` | `package.json` name，沒有就用資料夾名 |
| `PROJECT_DESCRIPTION` | `--description` | — |
| `PRODUCTION_BRANCH` | `--branch` | 目前 git branch |
| `REPO_URL` | `--repo` | `git remote get-url origin` |
| `VALIDATE_COMMAND` | `--validate` | `package.json` / `Cargo.toml` / `go.mod` / `pyproject.toml` |
| `REPORT_LANGUAGE` | `--lang` | — |
| `OWNER` | `--owner` | — |

## 設計取捨

**專案層只能更嚴，不能放寬。** 專案規則可以禁止全域允許的事，但永遠不能開放全域禁止的事。
不然安全規則只要一次隨手 commit 就被關掉了。

**記憶只有四個檔案，不是資料庫。** 其中 `current-state.md` 最值錢：
做到一半的搬遷、故意先壞著的東西、剛上線正在觀察的改動——這些是新對話沒辦法從程式碼推回來的。

**「最小脈絡」是規則不是建議。** 讀更多檔案不是免費的：它會把真正重要的細節擠掉，
讓 AI 對過期的程式碼講得很有自信。

**零依賴。** 這工具只是把 markdown 寫進你的 repo，沒有理由為此拉一整棵依賴樹進來。

## 由來

RTK 原本是一個繁體中文內容站的內部 PowerShell 腳本，這個站日常由
Claude Code、Codex、Gemini 輪流維護，已發布約 90 篇文章。
這裡的規則都是擋下過真實事故的那幾條：AI 擅自發布草稿、AI 直接部署上線、AI 忘記昨天的決定。

這個 repo 就是那支腳本的通用化版本：跨平台，並且移除所有專案專屬內容。

## 參與

歡迎 issue 和 PR，見 [CONTRIBUTING.md](CONTRIBUTING.md)。新增 preset 是最好上手的地方。

```bash
npm test        # 31 個測試，零依賴
```

## 授權

MIT
