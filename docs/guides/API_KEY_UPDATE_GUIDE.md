# Claude API Switcher - API Key 更新指南

本指南说明如何在 VS Code 中更新 Claude API 供应商的 API Key。

## 更新 API Key 的多种方式

### 方式 1：通过状态栏（推荐）

1. 点击 VS Code 底部状态栏的云朵图标 `$(cloud)`
2. 在弹出的 QuickPick 中选择 `$(key) 编辑 API Key...`
3. 在输入框中修改 API Key（密码模式，预填当前值）
4. 按 Enter 保存

**优点**：最快捷，一键直达

---

### 方式 2：通过侧边栏

#### 2.1 点击当前配置中的 API Key 项

1. 打开侧边栏的 Claude API Switcher 视图
2. 点击"当前配置"视图中的 `API Key` 项
3. 在输入框中修改 API Key
4. 按 Enter 保存

#### 2.2 使用工具栏按钮

1. 打开侧边栏的 Claude API Switcher 视图
2. 在"当前配置"视图的顶部工具栏中点击 `编辑 API Key` 按钮
3. 在输入框中修改 API Key
4. 按 Enter 保存

**优点**：可视化操作，直接在侧边栏中完成

---

### 方式 3：通过命令面板

1. 按 `Cmd/Ctrl + Shift + P` 打开命令面板
2. 输入 "claudeSwitch.editApiKey" 或搜索 "编辑 API Key"
3. 选择 "Claude: 编辑 API Key" 命令
4. 在输入框中修改 API Key
5. 按 Enter 保存

**优点**：通用方式，适合熟悉命令面板的用户

---

## API Key 管理特性

### ✅ 自动关联当前供应商

当您更新 API Key 时，插件会自动：
1. 检测当前使用的供应商（通过 base URL 匹配）
2. 预填该供应商已保存的 API Key
3. 更新后保存到对应位置

### ✅ 独立存储

每个供应商的 API Key 独立保存：
- **预设供应商**：DeepSeek、Zhipu GLM、MiniMax 等
- **自定义供应商**：用户自行添加的供应商
- **官方供应商**：Claude Official 无需 API Key

### ✅ 密码保护

所有 API Key 输入框均使用密码模式（隐藏输入）。

---

## 首次使用流程

当您第一次选择某个预设供应商时：

1. 选择供应商（如 DeepSeek）
2. 系统检测到没有保存的 API Key
3. 自动弹出输入框提示输入 API Key
4. 输入并保存
5. 以后该供应商的 API Key 会自动应用

---

## 常见问题

### Q: 切换供应商后需要重新输入 API Key 吗？
**A**: 不需要。每个供应商的 API Key 独立保存，切换时会自动使用对应的 Key。

### Q: 可以查看已保存的 API Key 吗？
**A**: API Key 在输入框中以密码模式显示，您可以查看并修改。出于安全考虑，建议不要在公共场合暴露 API Key。

### Q: 自定义供应商的 API Key 保存在哪里？
**A**: 与自定义供应商配置一起保存在 VS Code 的扩展存储中。

### Q: 如何删除某个供应商的 API Key？
**A**: 目前需要通过编辑 API Key 并清空输入框来实现。后续版本会增加删除功能。

### Q: API Key 会被加密存储吗？
**A**: 当前版本以明文存储在本地。建议定期更新 API Key 以确保安全。

---

## 操作演示

### 场景 1：更新当前供应商的 API Key

```
用户当前使用：DeepSeek
操作：点击状态栏 → 选择"编辑 API Key"
结果：输入框预填 "sk-xxx"，用户可修改
```

### 场景 2：切换供应商时自动使用保存的 Key

```
第一次选择 DeepSeek：
  ├─ 输入：sk-deepseek-123
  └─ 保存

切换到其他供应商，再切换回 DeepSeek：
  ├─ 自动应用：sk-deepseek-123
  └─ 无需重新输入
```

---

## 安全建议

1. **定期更换 API Key**：建议每 3-6 个月更换一次
2. **不要分享 API Key**：API Key 是您的账户凭证，请勿分享给他人
3. **注意环境变量**：如果设置了系统环境变量 ANTHROPIC_API_KEY，会覆盖插件中的配置
4. **使用完毕后及时注销**：在共享设备上使用完毕后，建议重新生成 API Key

---

如有问题或建议，请访问项目主页：
https://github.com/xiaomila/vscode-claude-api-switcher
