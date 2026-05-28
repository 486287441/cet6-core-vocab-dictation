# 六级核心词背诵检测站

备考英语六级时，用闪卡快速检测每个核心词的**中文含义**是否背熟。纯前端静态页，本地打开即可，进度保存在浏览器 `localStorage`。

**在线仓库**：[github.com/486287441/cet6-core-vocab-dictation](https://github.com/486287441/cet6-core-vocab-dictation)

---

## 功能概览

| 能力 | 说明 |
| --- | --- |
| 分批背诵 | 按 `words.csv` 顺序，每批 50 词，共约 8 批（374 词） |
| 轮次复习 | 本批内「不记得」的词进入下一轮，直至某一轮 50 词全「记得」 |
| 键盘流 | `A`/`←` 不记得，`D`/`→` 记得；判词后展开中文，`空格` 下一张 |
| 触控操作 | 闪卡页支持点击 `不记得 / 下一张 / 记得`，手机端可直接点按学习 |
| 断点续背 | 关闭浏览器后从当前批与批内状态继续 |
| 用时统计 | 本批用时、全库跨次累计总时长 |
| 全库庆祝 | 每一批均通关后，礼花庆祝页；可重新开始全库 |

---

## 快速开始

### 方式一（推荐）

| 系统 | 操作 |
| --- | --- |
| Windows | 双击 [`start.bat`](start.bat) |
| macOS / Linux | `chmod +x start.sh && ./start.sh` |

默认 **http://localhost:8888/** ，脚本会自动打开浏览器。

自定义端口：`set PORT=3000`（Windows）或 `PORT=3000 ./start.sh`。

### 方式二（命令行）

```bash
cd 项目根目录
python -m http.server 8888
```

浏览器访问 `http://localhost:8888/`。**不要用 `file://` 打开**，否则无法加载 `words.csv`。

---

## 键盘快捷键

| 操作 | 按键 |
| --- | --- |
| 不记得 | `A` / `←` |
| 记得 | `D` / `→` |
| 下一张（须先判词） | `空格` |
| 预览庆祝页（调试） | `Shift` + `.` |

---

## 项目结构

```
├── index.html          # 入口
├── words.csv           # 词库（word, meaning）
├── css/app.css         # 样式（暖纸 + 墨蓝强调）
├── js/
│   ├── main.js         # 启动、路由、键盘
│   ├── words.js        # CSV 加载与分批
│   ├── state.js        # 批内轮次状态机
│   ├── storage.js      # localStorage
│   ├── studyTimer.js   # 学习计时
│   ├── views/          # 闪卡 / 本批统计 / 庆祝
│   └── ui/             # Toast、进度条等
├── scripts/            # 词库与状态机校验脚本
├── plan/               # 模块计划与技术方案
├── start.bat / start.sh
└── 需求.md             # 产品需求（PRD）
```

---

## 开发说明

### 环境要求

- 现代浏览器（Chrome / Edge / Firefox / Safari）
- Python 3（仅用于本地静态服务器）

### 校验脚本

```bash
node scripts/verify-meaning.mjs
node scripts/verify-m02.mjs
```

### Git 提交钩子

本仓库要求：**凡提交除 `README.md` 以外的改动，须同时更新 `README.md`**（至少补充「更新记录」一条）。

首次克隆后安装钩子（任选其一）：

```bash
# 方式 A：复制到 .git/hooks（推荐，不改 git config）
cp .githooks/pre-commit .git/hooks/pre-commit   # macOS / Linux / Git Bash
```

```powershell
# Windows PowerShell
Copy-Item .githooks\pre-commit .git\hooks\pre-commit
```

```bash
# 方式 B：使用 core.hooksPath（需在本仓库执行一次）
git config core.hooksPath .githooks
```

---

## 更新记录

| 日期 | 说明 |
| --- | --- |
| 2026-05-28 | 修复学习时长统计异常（按实际活跃学习时长累计），并在手机端将触控按钮固定到底部以稳定点击位置 |
| 2026-05-28 | 调整“下一张”拦截提示文案为“先按记得（D）或不记得（A）”，键盘与触控提示保持一致 |
| 2026-05-28 | 为 CSS/JS/词库请求增加版本参数与禁缓存读取，降低旧浏览器页面与词库不刷新的问题 |
| 2026-05-28 | 优化手机端闪卡布局：隐藏键盘提示栏，仅保留触控按钮，减少页面纵向滚动 |
| 2026-05-28 | 闪卡页新增触控按钮（不记得/下一张/记得），并完成手机端点击适配与样式优化 |
| 2026-05-26 | 新增 README；完善 `.gitignore`；初始化 Git 并推送至 GitHub |

---

## 许可与词库

词库来源见项目内 `words.csv`。界面与逻辑为个人学习工具，欢迎 Fork 自用。
