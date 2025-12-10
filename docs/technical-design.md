# Claude API Switcher 技术方案

## 1. 项目概述

Claude API Switcher 是一个 VS Code 扩展，用于在编辑器内快速切换 Claude Code 的 API 供应商配置，无需离开编辑器即可完成 API 切换操作。

### 1.1 核心功能

- **快速切换**：通过命令面板快速切换 API 供应商
- **状态栏显示**：实时显示当前使用的供应商
- **侧边栏面板**：可视化管理所有供应商配置
- **自定义供应商**：支持添加、编辑、删除自定义 API 配置
- **预设库**：内置 20+ 常用供应商预设
- **国际化**：支持中文和英文界面

### 1.2 设计原则

1. **完全独立**：不依赖 CC Switch 或其他外部应用
2. **轻量级**：仅包含核心切换功能，避免过度设计
3. **兼容性**：与 CC Switch 使用相同的配置文件，可并行使用
4. **安全性**：原子写入防止配置损坏，API Key 不会泄露到日志

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                      VS Code Extension Host                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                        UI 层                              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │   │
│  │  │  StatusBar  │  │  Commands   │  │ SidebarProvider │   │   │
│  │  │  状态栏显示  │  │  命令面板   │  │   侧边栏面板    │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                       业务层                              │   │
│  │  ┌─────────────────────┐  ┌─────────────────────────┐    │   │
│  │  │   PresetManager     │  │  ClaudeConfigManager    │    │   │
│  │  │  预设+自定义供应商   │  │    配置文件读写         │    │   │
│  │  └─────────────────────┘  └─────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                       数据层                              │   │
│  │  ┌─────────────────────┐  ┌─────────────────────────┐    │   │
│  │  │ ~/.claude/settings  │  │  VS Code globalState    │    │   │
│  │  │   .json             │  │  (自定义供应商存储)      │    │   │
│  │  └─────────────────────┘  └─────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 模块职责

| 模块 | 文件 | 职责 |
|------|------|------|
| **extension.ts** | `src/extension.ts` | 插件入口，初始化所有模块，注册生命周期 |
| **ClaudeConfigManager** | `src/providers/claudeConfigManager.ts` | 读写 `~/.claude/settings.json`，文件监听 |
| **PresetManager** | `src/providers/presetManager.ts` | 管理预设库和自定义供应商 |
| **StatusBar** | `src/ui/statusBar.ts` | 状态栏 UI 显示和交互 |
| **Commands** | `src/ui/commands.ts` | 命令注册和 QuickPick 交互 |
| **SidebarProvider** | `src/ui/sidebarProvider.ts` | 侧边栏 TreeView 数据提供 |
| **Presets** | `src/config/presets.ts` | 硬编码的供应商预设库 |
| **Types** | `src/config/types.ts` | TypeScript 类型定义 |
| **i18n** | `src/i18n/index.ts` | 国际化支持 |

---

## 3. 核心模块设计

### 3.1 配置管理器 (ClaudeConfigManager)

#### 3.1.1 设计模式

采用**单例模式**确保全局只有一个配置管理实例：

```typescript
export class ClaudeConfigManager {
  private static instance: ClaudeConfigManager;

  public static getInstance(): ClaudeConfigManager {
    if (!ClaudeConfigManager.instance) {
      ClaudeConfigManager.instance = new ClaudeConfigManager();
    }
    return ClaudeConfigManager.instance;
  }
}
```

#### 3.1.2 原子写入

为防止写入过程中断导致配置文件损坏，采用**临时文件 + 重命名**策略：

```typescript
public async writeConfig(settings: ClaudeSettings): Promise<void> {
  const tempPath = `${configPath}.tmp.${Date.now()}`;

  try {
    // 1. 写入临时文件
    await fs.promises.writeFile(tempPath, content, 'utf-8');
    // 2. 原子重命名（操作系统保证原子性）
    await fs.promises.rename(tempPath, configPath);
  } catch (error) {
    // 3. 失败时清理临时文件
    await fs.promises.unlink(tempPath).catch(() => {});
    throw error;
  }
}
```

#### 3.1.3 文件监听

监听配置文件变化，响应外部修改（如 CC Switch 或手动编辑）：

```typescript
public startWatching(): vscode.Disposable {
  this.configWatcher = fs.watch(configDir, (eventType, filename) => {
    if (filename === 'settings.json') {
      // 防抖：忽略自己写入触发的事件
      if (Date.now() - this.lastWriteTime < this.writeDebounceMs) {
        return;
      }
      // 触发配置变更事件
      this.onConfigChangeEmitter.fire({ settings, source: 'external' });
    }
  });
}
```

#### 3.1.4 配置合并策略

写入时保留用户手动添加的其他配置项：

```typescript
const existingConfig = await this.readConfig();
const mergedConfig: ClaudeSettings = {
  ...existingConfig,      // 保留现有配置
  ...settings,            // 覆盖新配置
  env: {
    ...existingConfig?.env,
    ...settings.env,      // 合并 env 对象
  },
};
```

### 3.2 预设管理器 (PresetManager)

#### 3.2.1 数据来源

```
预设供应商：硬编码在 src/config/presets.ts（从 CC Switch 复制）
自定义供应商：存储在 VS Code globalState（跨会话持久化）
```

#### 3.2.2 自定义供应商存储

```typescript
const CUSTOM_PROVIDERS_KEY = 'claudeSwitch.customProviders';

// 读取
const providers = context.globalState.get<CustomProvider[]>(CUSTOM_PROVIDERS_KEY, []);

// 写入
await context.globalState.update(CUSTOM_PROVIDERS_KEY, providers);
```

#### 3.2.3 供应商数据结构

```typescript
interface Provider {
  id: string;                          // 唯一标识
  name: string;                        // 显示名称
  category: ProviderCategory;          // 分类
  settingsConfig: {
    env: {
      ANTHROPIC_BASE_URL?: string;     // API 地址
      ANTHROPIC_AUTH_TOKEN?: string;   // API Key
      ANTHROPIC_MODEL?: string;        // 默认模型
      // ... 其他环境变量
    };
  };
  meta?: {
    websiteUrl?: string;               // 官网地址
    apiKeyUrl?: string;                // 获取 Key 的链接
  };
}
```

### 3.3 UI 组件

#### 3.3.1 状态栏 (StatusBar)

```typescript
// 创建状态栏项
this.statusBarItem = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Right,
  100  // 优先级
);

// 配置交互
this.statusBarItem.command = 'claudeSwitch.switchProvider';
this.statusBarItem.tooltip = '点击切换 Claude API 供应商';

// 更新显示
this.statusBarItem.text = `$(cloud) ${providerName}`;
```

#### 3.3.2 命令面板 (QuickPick)

```typescript
const items: vscode.QuickPickItem[] = providers.map(p => ({
  label: `${isActive ? '$(check) ' : ''}${p.name}`,
  description: isActive ? '(当前)' : undefined,
  detail: `${baseUrl} | ${model}`,
}));

const selected = await vscode.window.showQuickPick(items, {
  placeHolder: '选择 Claude API 供应商',
  matchOnDescription: true,
  matchOnDetail: true,
});
```

#### 3.3.3 侧边栏 (TreeDataProvider)

```typescript
class PresetProvidersProvider implements vscode.TreeDataProvider<TreeItem> {
  // 获取树节点
  getTreeItem(element: TreeItem): vscode.TreeItem {
    const item = new vscode.TreeItem(element.provider.name);
    item.command = {
      command: 'claudeSwitch.applyProvider',
      arguments: [{ provider: element.provider }],
    };
    return item;
  }

  // 获取子节点
  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (!element) {
      return categories;  // 返回分类
    }
    return providersInCategory;  // 返回该分类下的供应商
  }
}
```

---

## 4. 数据流

### 4.1 切换供应商流程

```
┌─────────┐     ┌──────────────┐     ┌───────────────────┐
│  用户    │────▶│  QuickPick   │────▶│  选择供应商       │
└─────────┘     └──────────────┘     └───────────────────┘
                                              │
                                              ▼
                                     ┌───────────────────┐
                                     │ ClaudeConfigManager│
                                     │   .updateEnv()    │
                                     └───────────────────┘
                                              │
                                              ▼
                                     ┌───────────────────┐
                                     │ 原子写入配置文件   │
                                     │ ~/.claude/        │
                                     │   settings.json   │
                                     └───────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
           ┌───────────────┐        ┌───────────────┐        ┌───────────────┐
           │ StatusBar     │        │ Sidebar       │        │ Toast 通知    │
           │ .update()     │        │ .refresh()    │        │ 切换成功      │
           └───────────────┘        └───────────────┘        └───────────────┘
```

### 4.2 外部配置变更检测

```
┌─────────────────┐     ┌──────────────┐     ┌───────────────────┐
│ 外部修改配置文件 │────▶│  fs.watch    │────▶│ 防抖检测          │
│ (CC Switch/手动) │     │  监听变化    │     │ (排除自身写入)    │
└─────────────────┘     └──────────────┘     └───────────────────┘
                                                      │
                                                      ▼
                                             ┌───────────────────┐
                                             │ onConfigChange    │
                                             │ 事件触发          │
                                             └───────────────────┘
                                                      │
                                   ┌──────────────────┼──────────────────┐
                                   ▼                                     ▼
                          ┌───────────────┐                     ┌───────────────┐
                          │ StatusBar     │                     │ Sidebar       │
                          │ .update()     │                     │ .refresh()    │
                          └───────────────┘                     └───────────────┘
```

### 4.3 配置变更同步

插件通过文件系统监听实现配置变更的实时同步：

#### 4.3.1 内部配置变更流程

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│ 用户操作        │────▶│ ClaudeConfig    │────▶│ 更新配置文件      │
│ (切换/编辑)     │     │ Manager.write    │     │ ~/.claude/settings│
└─────────────────┘     └──────────────────┘     └───────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
           ┌───────────────┐        ┌───────────────┐        ┌───────────────┐
           │ StatusBar     │        │ Sidebar       │        │ Toast 通知    │
           │ .update()     │        │ .refresh()    │        │ 切换成功      │
           └───────────────┘        └───────────────┘        └───────────────┘
```

#### 4.3.2 外部配置变更检测

```
┌─────────────────┐     ┌──────────────┐     ┌───────────────────┐
│ 外部修改配置文件 │────▶│  fs.watch    │────▶│ 防抖检测          │
│ (CC Switch/手动) │     │  监听变化    │     │ (排除自身写入)    │
└─────────────────┘     └──────────────┘     └───────────────────┘
                                                      │
                                                      ▼
                                             ┌───────────────────┐
                                             │ onConfigChange    │
                                             │ 事件触发          │
                                             └───────────────────┘
                                                      │
                                   ┌──────────────────┼──────────────────┐
                                   ▼                                     ▼
                          ┌───────────────┐                     ┌───────────────┐
                          │ StatusBar     │                     │ Sidebar       │
                          │ .update()     │                     │ .refresh()    │
                          └───────────────┘                     └───────────────┘
```

---

## 5. 国际化方案

### 5.1 静态文本 (package.json)

使用 VS Code 原生的 `package.nls.json` 机制：

```json
// package.json
{
  "contributes": {
    "commands": [{
      "command": "claudeSwitch.switchProvider",
      "title": "%command.switchProvider%"  // 占位符
    }]
  }
}

// package.nls.json (英文)
{
  "command.switchProvider": "Switch Provider"
}

// package.nls.zh-cn.json (中文)
{
  "command.switchProvider": "切换供应商"
}
```

### 5.2 运行时文本

```typescript
// src/i18n/index.ts
const messages = {
  en: {
    'statusBar.tooltip': 'Click to switch Claude API provider',
    // ...
  },
  zh: {
    'statusBar.tooltip': '点击切换 Claude API 供应商',
    // ...
  },
};

function getLocale(): string {
  return vscode.env.language.startsWith('zh') ? 'zh' : 'en';
}

export function t(key: string, ...args: string[]): string {
  const locale = getLocale();
  let message = messages[locale]?.[key] ?? messages['en']?.[key] ?? key;

  // 支持参数替换：t('message.switched', 'DeepSeek') => '已切换到 DeepSeek'
  args.forEach((arg, index) => {
    message = message.replace(`{${index}}`, arg);
  });

  return message;
}
```

---

## 6. 与 CC Switch 的关系

### 6.1 架构对比

| 维度 | CC Switch | VS Code 插件 |
|------|-----------|--------------|
| **技术栈** | Tauri (Rust + React) | VS Code Extension API (TypeScript) |
| **运行环境** | 独立桌面应用 | VS Code 内嵌 |
| **数据存储** | SQLite + JSON 双层 | JSON + VS Code globalState |
| **配置同步** | 双向同步 (DB ↔ Live) | 直接读写 Live 文件 |
| **预设管理** | 数据库动态管理 | 硬编码在源码中 |
| **功能范围** | 完整 (MCP/Prompts/环境变量) | 精简 (仅供应商切换) |

### 6.2 兼容性设计

两者都操作 `~/.claude/settings.json`，天然兼容：

```
用户场景 1：仅使用 VS Code 插件
  └── 直接读写 settings.json，独立工作

用户场景 2：仅使用 CC Switch
  └── CC Switch 管理配置，插件不受影响

用户场景 3：两者并行使用
  └── 插件监听文件变化，CC Switch 修改后自动同步 UI
  └── 插件修改后，CC Switch 下次读取时自动获取最新配置
```

### 6.3 预设库复用

插件的预设库直接从 CC Switch 的 `src/config/claudeProviderPresets.ts` 复制，保持一致性。

---

## 7. 安全性考虑

### 7.1 API Key 处理

- **不记录日志**：API Key 不会出现在 console.log 或错误信息中
- **密码输入框**：编辑 API Key 时使用 `password: true` 隐藏输入
- **本地存储**：仅存储在本地文件和 VS Code globalState，不上传

### 7.2 文件操作安全

- **原子写入**：防止写入中断导致配置损坏
- **路径验证**：使用 `os.homedir()` 获取用户目录，避免路径注入
- **权限保留**：重命名操作保留原文件权限

---

## 8. 项目结构

```
vscode-claude-api-switcher/
├── .vscode/                    # VS Code 配置
│   ├── launch.json             # 调试配置
│   ├── tasks.json              # 任务配置
│   └── extensions.json         # 推荐扩展
├── docs/                       # 文档
│   └── technical-design.md     # 技术方案（本文件）
├── resources/
│   └── icons/
│       └── claude.svg          # 侧边栏图标
├── src/
│   ├── config/
│   │   ├── types.ts            # 类型定义
│   │   └── presets.ts          # 预设库
│   ├── providers/
│   │   ├── claudeConfigManager.ts  # 配置管理
│   │   └── presetManager.ts        # 预设管理
│   ├── ui/
│   │   ├── statusBar.ts        # 状态栏
│   │   ├── commands.ts         # 命令注册
│   │   └── sidebarProvider.ts  # 侧边栏
│   ├── i18n/
│   │   └── index.ts            # 国际化
│   ├── utils/
│   │   └── pathUtils.ts        # 路径工具
│   └── extension.ts            # 插件入口
├── .eslintrc.json              # ESLint 配置
├── .gitignore                  # Git 忽略
├── .vscodeignore               # 打包忽略
├── LICENSE                     # MIT 许可证
├── package.json                # 插件配置
├── package.nls.json            # 英文本地化
├── package.nls.zh-cn.json      # 中文本地化
├── README.md                   # 说明文档
└── tsconfig.json               # TypeScript 配置
```

---

## 9. 开发指南

### 9.1 环境要求

- Node.js 18+
- VS Code 1.85+

### 9.2 常用命令

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 监听模式
npm run watch

# 代码检查
npm run lint

# 打包
npm run package

# 发布
npm run publish
```

### 9.3 调试方式

1. 在 VS Code 中打开项目
2. 按 `F5` 启动调试
3. 在新窗口中测试插件功能

---

## 10. 后续迭代方向

### 10.1 短期优化

- [ ] 添加插件图标 (PNG 格式)
- [ ] 实现 API 连接测试功能
- [ ] 添加配置导入/导出功能

### 10.2 中期功能

- [ ] WebView 编辑面板（替代多步输入框）
- [ ] 从网络获取最新预设库
- [ ] 配置验证（URL 格式、Key 有效性）

### 10.3 长期规划

- [ ] 与 CC Switch 双向同步（需要 CC Switch 暴露 IPC 接口）
- [ ] MCP 服务器快速管理
- [ ] 多工作区配置隔离
