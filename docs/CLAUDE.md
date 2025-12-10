# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个 VS Code 扩展，用于在不离开 VS Code 的情况下快速切换 Claude Code API 提供商。它通过读写 `~/.claude/settings.json` 配置文件来管理不同的 API 提供商配置。

## 核心架构

### 配置管理层
- **ClaudeConfigManager** (`src/providers/claudeConfigManager.ts`): 单例模式管理 `~/.claude/settings.json` 文件的读写
  - 使用原子写入机制（临时文件 + 重命名）保证配置安全
  - 实现文件监听器（`fs.watch`）检测外部配置变更
  - 使用防抖机制（`writeDebounceMs`）避免监听自己的写入操作
  - 提供 EventEmitter 发布配置变更事件

- **PresetManager** (`src/providers/presetManager.ts`): 管理预设和自定义提供商
  - 预设提供商从 `src/config/presets.ts` 导入
  - 自定义提供商存储在 VS Code 的 `globalState` 中（key: `claudeSwitch.customProviders`）
  - 支持添加、编辑、删除自定义提供商

### UI 层
- **StatusBarManager** (`src/ui/statusBar.ts`): 管理状态栏项，显示当前 API 提供商
- **Commands** (`src/ui/commands.ts`): 注册所有命令处理函数
  - `switchProvider`: 显示提供商选择器
  - `editApiKey`: 编辑 API Key
  - `addCustomProvider`: 添加自定义提供商
  - `viewConfig`: 打开配置文件
  - `applyProvider`: 应用提供商配置
  - `editProvider`/`deleteProvider`: 编辑/删除自定义提供商

- **SidebarProvider** (`src/ui/sidebarProvider.ts`): 三个树视图提供商
  - `CurrentConfigProvider`: 显示当前配置
  - `PresetProvidersProvider`: 显示预设提供商列表
  - `CustomProvidersProvider`: 显示自定义提供商列表

### 类型系统
- **types.ts** (`src/config/types.ts`): 核心类型定义
  - `ClaudeSettings`: Claude Code 配置文件结构
  - `ClaudeEnvConfig`: env 环境变量配置（ANTHROPIC_BASE_URL, ANTHROPIC_AUTH_TOKEN 等）
  - `Provider`: 提供商定义
  - `CustomProvider`: 自定义提供商（继承 Provider，添加创建/更新时间）

### 工具类
- **pathUtils.ts** (`src/utils/pathUtils.ts`): 路径处理工具
- **envChecker.ts** (`src/utils/envChecker.ts`): 检查环境变量冲突
- **i18n** (`src/i18n/index.ts`): 国际化支持（中英文）

## 开发命令

```bash
# 安装依赖
npm install

# 编译 TypeScript
npm run compile

# 监听模式（开发时使用）
npm run watch

# 代码检查
npm run lint

# 打包扩展
npm run package

# 发布扩展
npm run publish
```

## 关键配置文件

- **package.json**: VS Code 扩展配置
  - 定义所有命令、视图、菜单
  - 扩展设置项（`claudeSwitch.*`）
  - 国际化消息引用（`%command.xxx%`）

- **tsconfig.json**: TypeScript 编译配置
  - 目标: ES2022
  - 输出目录: `out/`
  - 启用严格模式

- **.eslintrc.json**: ESLint 配置
  - 使用 TypeScript ESLint
  - 自定义规则（命名约定、分号等）

## Claude Settings 配置结构

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.example.com",
    "ANTHROPIC_AUTH_TOKEN": "your-api-key",
    "ANTHROPIC_MODEL": "claude-3-5-sonnet-20241022"
  }
}
```

## 扩展激活流程

1. 扩展激活时首先检查环境变量冲突（`checkAndBlockIfEnvConflicts`）
2. 如果有冲突，显示阻塞状态栏并停止激活
3. 初始化管理器：`ClaudeConfigManager`、`PresetManager`
4. 创建 UI 组件：`StatusBarManager`、三个 `TreeDataProvider`
5. 注册命令、启动配置文件监听器
6. 监听配置变更事件并更新 UI

## 提供商激活判断逻辑

判断一个提供商是否当前激活：
- 通过比较 `ANTHROPIC_BASE_URL` 的 host 部分
- 如果两者都为空，则认为是官方 API（激活状态）
- 使用 URL 解析避免端口、协议差异影响判断

## 数据流

1. 用户点击状态栏或执行命令
2. 显示 QuickPick 选择器（来自 PresetManager 的数据）
3. 用户选择提供商
4. 通过 ClaudeConfigManager 写入 `~/.claude/settings.json`
5. 配置文件变更触发 EventEmitter
6. StatusBar 和 Sidebar 自动刷新

## 注意事项

- 配置文件路径可通过 `claudeSwitch.claudeConfigPath` 设置自定义，默认为 `~/.claude/settings.json`
- 所有写入操作使用原子写入，防止文件损坏
- 自定义提供商存储在 VS Code 全局状态，不会与工作区绑定
- API Key 输入框使用 `password: true` 保护隐私
- 国际化消息定义在 `package.nls.json` 和 `package.nls.zh-cn.json`
