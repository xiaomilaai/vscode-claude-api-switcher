import * as vscode from 'vscode';
import { ClaudeConfigManager } from '../providers/claudeConfigManager';
import { PresetManager } from '../providers/presetManager';
import { t } from '../i18n';
import type { ClaudeEnvConfig } from '../config/types';

/**
 * Manages the status bar item for Claude API Switcher
 */
export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;
  private configManager: ClaudeConfigManager;
  private presetManager: PresetManager;

  constructor() {
    this.configManager = ClaudeConfigManager.getInstance();
    this.presetManager = PresetManager.getInstance();

    // Get alignment from settings
    const config = vscode.workspace.getConfiguration('claudeSwitch');
    const alignment = config.get<string>('statusBarAlignment', 'right');
    const vscodeAlignment =
      alignment === 'left'
        ? vscode.StatusBarAlignment.Left
        : vscode.StatusBarAlignment.Right;

    this.statusBarItem = vscode.window.createStatusBarItem(
      vscodeAlignment,
      100
    );
    this.statusBarItem.command = 'claudeSwitch.switchProvider';
    this.statusBarItem.tooltip = t('statusBar.tooltip');
  }

  /**
   * Update status bar with current provider info
   */
  public async update(): Promise<void> {
    const config = vscode.workspace.getConfiguration('claudeSwitch');
    const showStatusBar = config.get<boolean>('showStatusBar', true);

    if (!showStatusBar) {
      this.statusBarItem.hide();
      return;
    }

    const env = await this.configManager.getEnv();
    const providerName = this.detectProviderName(env);

    this.statusBarItem.text = `$(cloud) ${providerName}`;
    this.statusBarItem.show();
  }

  /**
   * Detect current provider name from env config
   */
  private detectProviderName(env: ClaudeEnvConfig | null): string {
    if (!env) {
      return t('statusBar.notConfigured');
    }

    const baseUrl = env.ANTHROPIC_BASE_URL;

    // If no base URL, it's official Claude
    if (!baseUrl) {
      return 'Claude Official';
    }

    // Try to match against presets
    const presets = this.presetManager.getPresets();
    for (const preset of presets) {
      const presetBaseUrl = preset.settingsConfig.env.ANTHROPIC_BASE_URL;
      if (presetBaseUrl && baseUrl.includes(new URL(presetBaseUrl).host)) {
        return preset.name;
      }
    }

    // Try to match against custom providers
    const customProviders = this.presetManager.getCustomProviders();
    for (const custom of customProviders) {
      const customBaseUrl = custom.settingsConfig.env.ANTHROPIC_BASE_URL;
      if (customBaseUrl && baseUrl.includes(new URL(customBaseUrl).host)) {
        return custom.name;
      }
    }

    // Extract domain from URL as fallback
    try {
      const url = new URL(baseUrl);
      return url.host;
    } catch {
      return t('statusBar.notConfigured');
    }
  }

  /**
   * Show the status bar item
   */
  public show(): void {
    this.statusBarItem.show();
  }

  /**
   * Hide the status bar item
   */
  public hide(): void {
    this.statusBarItem.hide();
  }

  /**
   * Dispose the status bar item
   */
  public dispose(): void {
    this.statusBarItem.dispose();
  }
}
