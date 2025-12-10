# Claude API Switcher

Quickly switch Claude Code API providers without leaving VS Code.

## Features

- **Quick Switch**: Use `Cmd+Shift+P` → "Claude: Switch Provider" to quickly switch between API providers
- **Status Bar**: Shows current API provider in the status bar, click to switch
- **Sidebar Panel**: View and manage providers in the Activity Bar
- **Custom Providers**: Add your own custom API providers
- **Preset Library**: 20+ built-in provider presets including:
  - Claude Official
  - DeepSeek
  - Zhipu GLM
  - Qwen Coder
  - Kimi
  - MiniMax
  - OpenRouter
  - And more...
- **i18n**: Supports English and Chinese

## Installation

1. Install from VS Code Marketplace (coming soon)
2. Or download the `.vsix` file and install manually

## Usage

### Quick Switch

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "Claude: Switch Provider"
3. Select a provider from the list

### Status Bar

Click the status bar item showing the current provider name to open the provider picker.

### Sidebar

1. Click the Claude icon in the Activity Bar
2. View current configuration
3. Browse preset providers
4. Manage custom providers

### Commands

| Command | Description |
|---------|-------------|
| `Claude: Switch Provider` | Switch to a different API provider |
| `Claude: Edit API Key` | Edit current API key |
| `Claude: Add Custom Provider` | Add a custom provider |
| `Claude: View Current Configuration` | Open settings.json file |

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `claudeSwitch.showStatusBar` | Show provider in status bar | `true` |
| `claudeSwitch.statusBarAlignment` | Status bar alignment (left/right) | `right` |
| `claudeSwitch.claudeConfigPath` | Custom path to settings.json | `~/.claude/settings.json` |

## How It Works

This extension reads and writes to `~/.claude/settings.json`, the configuration file used by Claude Code CLI. Changes take effect immediately for new Claude Code sessions.

## Switching Plugin Language

This plugin **automatically follows VS Code's language settings** - no separate configuration needed.

### How to change VS Code language:

**Method 1: Via Command Palette**
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "Configure Display Language"
3. Select target language (e.g., "English" or "中文(简体)")
4. Restart VS Code

**Method 2: Via settings.json**
```json
{
  "locale": "en"      // English
  // or
  "locale": "zh-cn"   // Chinese
}
```

After changing, restart VS Code and the plugin interface will automatically switch to the corresponding language.

## Development

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch mode
npm run watch

# Package
npm run package
```

## License

MIT
