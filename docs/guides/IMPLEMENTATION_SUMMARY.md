# Claude API Switcher - 供应商 API Key 管理实现

## 实现概述

本次实现为 VS Code 插件添加了**每个供应商独立保存 API Key**的功能，解决了用户每次切换供应商都需要重新输入 API Key 的问题。

## 核心功能

### 1. 供应商 API Key 独立存储

- **预设供应商**：API Key 存储在 VS Code globalState 的 `claudeSwitch.presetApiKeys` 中
- **自定义供应商**：API Key 存储在 `claudeSwitch.customProviders` 的配置中
- **官方供应商**：不需要 API Key

### 2. 首次使用流程

```
用户第一次选择 DeepSeek：
  ├─ 检测到没有保存的 API Key
  ├─ 弹出输入框提示用户输入 DeepSeek 的 API Key
  ├─ 保存 Key 与 'deepseek' 供应商的关联
  └─ 应用配置（包含该 Key）
```

### 3. 重复使用流程

```
用户第二次选择 DeepSeek：
  ├─ 检测到已保存的 API Key
  ├─ 直接应用配置（使用保存的 Key）
  └─ 无需重新输入
```

### 4. API Key 编辑

```
用户点击"编辑 API Key"：
  ├─ 检测当前使用的供应商（通过 baseUrl 匹配）
  ├─ 预填该供应商已保存的 API Key
  ├─ 用户修改后保存到对应位置
  └─ 更新配置
```

## 技术实现

### 新增文件
- 无新增文件

### 修改文件

#### 1. `src/config/types.ts`
- 新增 `PresetApiKeyRecord` 接口，定义预设 API Key 存储结构

#### 2. `src/providers/presetManager.ts`
- 新增 `PRESET_API_KEYS_KEY` 常量
- 新增方法：
  - `getPresetApiKeys()` - 获取所有预设 API Key
  - `getPresetApiKey(providerId)` - 获取特定预设的 API Key
  - `setPresetApiKey(providerId, apiKey)` - 保存预设的 API Key
  - `getProviderApiKey(providerId)` - 通用获取 API Key 方法
  - `updateProviderApiKey()` - 更新 API Key

#### 3. `src/ui/commands.ts`
- 修改 `applyProvider()` 函数：
  - 添加 `presetManager` 参数
  - 检查预设是否有保存的 API Key
  - 如果没有且不是官方供应商，提示用户输入
  - 保存 Key 并合并到配置中
- 修改 `editApiKey()` 函数：
  - 添加 `presetManager` 参数
  - 检测当前供应商
  - 编辑对应供应商的 API Key
- 更新所有调用点，添加 `presetManager` 参数

#### 4. `src/ui/sidebarProvider.ts`
- 为 `ConfigTreeItem` 接口添加 `command` 属性
- 修改 `getTreeItem()` 方法，支持绑定命令
- 为 API Key 配置项添加 `claudeSwitch.editApiKey` 命令

#### 5. `package.json`
- 在 `menus.view/title` 中添加 `claudeSwitch.editApiKey` 按钮
- 仅在 `claudeCurrentConfig` 视图中显示编辑按钮

## 数据存储结构

### 预设 API Key（presetApiKeys）
```json
{
  "claudeSwitch.presetApiKeys": {
    "deepseek": "sk-xxx",
    "zhipu-glm": "sk-yyy",
    "kimi-k2": "sk-zzz"
  }
}
```

### 自定义供应商（customProviders）
```json
{
  "claudeSwitch.customProviders": [
    {
      "id": "custom-xxx",
      "name": "My Provider",
      "category": "custom",
      "settingsConfig": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.example.com",
          "ANTHROPIC_AUTH_TOKEN": "sk-custom-xxx",
          "ANTHROPIC_MODEL": "custom-model"
        }
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## 用户体验改进

### 之前的问题
1. 每次切换供应商，API Key 被覆盖为空
2. 用户必须通过"编辑 API Key"单独设置
3. 无法区分不同供应商的 API Key
4. 没有明显的 API Key 更新入口

### 现在的体验
1. ✅ 首次选择供应商时自动提示输入 API Key
2. ✅ 第二次使用时自动应用保存的 API Key
3. ✅ 每个供应商的 API Key 独立保存
4. ✅ 编辑 API Key 时自动关联到当前供应商
5. ✅ 官方供应商（Claude Official）无需 API Key

### ✅ 多种 API Key 更新入口

用户可以通过以下方式随时更新 API Key：

1. **状态栏入口**
   - 点击状态栏云朵图标
   - 选择"$(key) 编辑 API Key..."

2. **侧边栏入口**
   - 当前配置视图中的 API Key 项（可点击）
   - 当前配置视图顶部工具栏的"编辑 API Key"按钮

3. **命令面板入口**
   - 搜索 "claudeSwitch.editApiKey"
   - 选择 "Claude: 编辑 API Key" 命令

所有入口都会自动检测当前使用的供应商，预填已保存的 API Key。

## 测试场景

### 场景 1：首次使用预设供应商
1. 选择 DeepSeek
2. 弹出 API Key 输入框
3. 输入 `sk-xxx`
4. 配置保存并应用
5. 切换到其他供应商，再切换回来
6. 验证 API Key 自动填充

### 场景 2：编辑 API Key
1. 当前使用 Zhipu GLM
2. 执行"编辑 API Key"命令
3. 输入框预填保存的 API Key
4. 修改并保存
5. 验证更新成功

### 场景 3：自定义供应商
1. 添加自定义供应商
2. 输入 name、URL、API Key、model
3. 应用供应商
4. 验证 API Key 保存成功
5. 切换出去再切换回来
6. 验证 API Key 自动应用

## 兼容性

- ✅ 与现有配置完全兼容
- ✅ 升级后自动使用新的 Key 管理机制
- ✅ 未保存的 Key 不影响功能（会提示输入）

## 构建状态

- TypeScript 编译：✅ 通过
- 打包：✅ 成功
- 生成文件：`claude-api-switcher-0.1.0.vsix` (35.54 KB)
- 新增文档：`API_KEY_UPDATE_GUIDE.md` - 详细的 API Key 更新指南

## 后续优化建议

1. **API Key 加密存储**：当前以明文存储，建议使用 VS Code 的密钥库
2. **批量导入/导出**：支持导出所有供应商配置
3. **Key 有效性验证**：可以添加测试连接功能
4. **更多预设供应商**：参考 CC Switch 添加更多预设

---

实现完成日期：2025-12-10
版本：0.1.0
