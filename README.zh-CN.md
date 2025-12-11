# CCAS - Claude Code API Switcher

在 VS Code 中快速切换 Claude Code API 供应商。

## 功能特性

- **快速切换**：使用 `Cmd+Shift+P` → "Claude: 切换供应商" 快速切换 API 供应商
- **状态栏显示**：在状态栏显示当前 API 供应商，点击即可切换
- **侧边栏面板**：在活动栏中查看和管理供应商
- **自定义供应商**：添加你自己的自定义 API 供应商
- **预设库**：内置多个供应商预设，包括：
  - Claude 官方
  - DeepSeek
  - 智谱 GLM
  - 通义千问
  - Kimi
  - MiniMax
  - 更多...
- **国际化**：支持中文和英文界面

## 安装

从以下市场安装：
- **VS Code 插件市场**：[Claude Code API Switcher](https://marketplace.visualstudio.com/items?itemName=xiaomila.claude-api-switcher)
- **Open VSX**：[Claude Code API Switcher](https://open-vsx.org/extension/xiaomila/claude-api-switcher)

或下载 `.vsix` 文件，通过 `扩展: 从 VSIX 安装...` 手动安装

## 使用方法

### 快速切换

1. 按 `Cmd+Shift+P` (Mac) 或 `Ctrl+Shift+P` (Windows/Linux)
2. 输入 "Claude: 切换供应商"
3. 从列表中选择供应商

### 状态栏

点击状态栏显示的当前供应商名称，即可打开供应商选择器。

### 侧边栏

1. 点击活动栏中的 Claude 图标
2. 查看当前配置
3. 浏览预设供应商
4. 管理自定义供应商

### 命令列表

| 命令 | 描述 |
|------|------|
| `Claude: 切换供应商` | 切换到不同的 API 供应商 |
| `Claude: 编辑 API Key` | 编辑当前 API Key |
| `Claude: 添加自定义供应商` | 添加自定义供应商 |
| `Claude: 查看当前配置` | 打开 settings.json 文件 |

## 配置项

| 设置项 | 描述 | 默认值 |
|--------|------|--------|
| `claudeSwitch.showStatusBar` | 在状态栏显示供应商 | `true` |
| `claudeSwitch.statusBarAlignment` | 状态栏对齐方式 (left/right) | `right` |
| `claudeSwitch.claudeConfigPath` | settings.json 自定义路径 | `~/.claude/settings.json` |

## 工作原理

本插件通过读写 `~/.claude/settings.json` 文件来管理 Claude Code CLI 的配置。更改会立即对新的 Claude Code 会话生效。

## 切换插件语言

本插件会**自动跟随 VS Code 的语言设置**，无需单独配置。

### 切换 VS Code 语言的方法：

**方法一：通过命令面板**
1. 按 `Cmd+Shift+P` (Mac) 或 `Ctrl+Shift+P` (Windows/Linux)
2. 输入 "Configure Display Language" 或 "配置显示语言"
3. 选择目标语言（如 "中文(简体)" 或 "English"）
4. 重启 VS Code 生效

**方法二：通过设置**
1. 打开 VS Code 设置（`Cmd+,` 或 `Ctrl+,`）
2. 搜索 "locale"
3. 修改 `locale` 设置项

**方法三：直接修改 settings.json**
```json
{
  "locale": "zh-cn"  // 中文
  // 或
  "locale": "en"     // 英文
}
```

修改后重启 VS Code，插件界面将自动切换到对应语言。

## 开发

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 监听模式
npm run watch

# 打包
npm run package
```

## 许可证

MIT
