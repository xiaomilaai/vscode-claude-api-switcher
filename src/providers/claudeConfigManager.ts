import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import type { ClaudeSettings, ClaudeEnvConfig, ConfigChangeEvent } from '../config/types';
import { getClaudeConfigPath, getClaudeConfigDir, pathExists } from '../utils/pathUtils';

/**
 * Manages reading and writing Claude Code configuration files
 * Handles ~/.claude/settings.json
 */
export class ClaudeConfigManager {
  private static instance: ClaudeConfigManager;
  private configWatcher: fs.FSWatcher | null = null;
  private readonly onConfigChangeEmitter = new vscode.EventEmitter<ConfigChangeEvent>();
  public readonly onConfigChange = this.onConfigChangeEmitter.event;
  private lastWriteTime = 0;
  private readonly writeDebounceMs = 1000;

  private constructor() {}

  public static getInstance(): ClaudeConfigManager {
    if (!ClaudeConfigManager.instance) {
      ClaudeConfigManager.instance = new ClaudeConfigManager();
    }
    return ClaudeConfigManager.instance;
  }

  /**
   * Read Claude settings from config file
   */
  public async readConfig(): Promise<ClaudeSettings | null> {
    const configPath = getClaudeConfigPath();

    try {
      if (!await pathExists(configPath)) {
        return null;
      }

      const content = await fs.promises.readFile(configPath, 'utf-8');
      const settings = JSON.parse(content) as ClaudeSettings;
      return settings;
    } catch (error) {
      console.error('Failed to read Claude config:', error);
      return null;
    }
  }

  /**
   * Write Claude settings to config file (atomic write)
   */
  public async writeConfig(settings: ClaudeSettings): Promise<void> {
    const configPath = getClaudeConfigPath();
    const configDir = getClaudeConfigDir();

    // Ensure directory exists
    if (!await pathExists(configDir)) {
      await fs.promises.mkdir(configDir, { recursive: true });
    }

    // Read existing config to preserve other fields
    const existingConfig = await this.readConfig();

    // Check if we need to clear env (when settings.env is an empty object)
    const isClearingEnv = settings.env && Object.keys(settings.env).length === 0;

    // For official provider or explicit clear, use empty env
    // Otherwise, merge with existing env
    const finalEnv = isClearingEnv
      ? {}
      : {
          ...existingConfig?.env,
          ...settings.env,
        };

    const mergedConfig: ClaudeSettings = {
      ...existingConfig,
      ...settings,
      env: finalEnv,
    };

    // Atomic write: write to temp file, then rename
    const tempPath = `${configPath}.tmp.${Date.now()}`;
    const content = JSON.stringify(mergedConfig, null, 2);

    try {
      await fs.promises.writeFile(tempPath, content, 'utf-8');
      await fs.promises.rename(tempPath, configPath);
      this.lastWriteTime = Date.now();
    } catch (error) {
      // Clean up temp file if rename failed
      try {
        await fs.promises.unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  /**
   * Update only the env section of settings
   */
  public async updateEnv(env: ClaudeEnvConfig): Promise<void> {
    await this.writeConfig({ env });
  }

  /**
   * Get current env configuration
   */
  public async getEnv(): Promise<ClaudeEnvConfig | null> {
    const settings = await this.readConfig();
    return settings?.env ?? null;
  }

  /**
   * Start watching config file for external changes
   */
  public startWatching(): vscode.Disposable {
    const configPath = getClaudeConfigPath();
    const configDir = path.dirname(configPath);

    // Watch the directory for changes
    try {
      this.configWatcher = fs.watch(configDir, (eventType, filename) => {
        if (filename === 'settings.json') {
          // Debounce: ignore changes from our own writes
          if (Date.now() - this.lastWriteTime < this.writeDebounceMs) {
            return;
          }

          // Emit change event
          this.readConfig().then(settings => {
            if (settings) {
              this.onConfigChangeEmitter.fire({
                settings,
                source: 'external',
              });
            }
          });
        }
      });
    } catch (error) {
      console.error('Failed to start config watcher:', error);
    }

    return new vscode.Disposable(() => this.stopWatching());
  }

  /**
   * Stop watching config file
   */
  public stopWatching(): void {
    if (this.configWatcher) {
      this.configWatcher.close();
      this.configWatcher = null;
    }
  }

  /**
   * Check if config file exists
   */
  public async configExists(): Promise<boolean> {
    return pathExists(getClaudeConfigPath());
  }

  /**
   * Get the config file path
   */
  public getConfigPath(): string {
    return getClaudeConfigPath();
  }

  /**
   * Create initial config file if it doesn't exist
   */
  public async ensureConfigExists(): Promise<void> {
    if (!await this.configExists()) {
      await this.writeConfig({
        env: {},
      });
    }
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.stopWatching();
    this.onConfigChangeEmitter.dispose();
  }
}
