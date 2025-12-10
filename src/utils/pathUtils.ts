import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Get the Claude configuration file path
 * Priority:
 * 1. User-configured custom path
 * 2. Default path: ~/.claude/settings.json
 */
export function getClaudeConfigPath(): string {
  const config = vscode.workspace.getConfiguration('claudeSwitch');
  const customPath = config.get<string>('claudeConfigPath');

  if (customPath && customPath.trim()) {
    return expandPath(customPath.trim());
  }

  return getDefaultClaudeConfigPath();
}

/**
 * Get the default Claude configuration file path
 */
export function getDefaultClaudeConfigPath(): string {
  const homeDir = os.homedir();
  return path.join(homeDir, '.claude', 'settings.json');
}

/**
 * Expand ~ to home directory in path
 */
export function expandPath(filePath: string): string {
  if (filePath.startsWith('~')) {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

/**
 * Get the Claude configuration directory
 */
export function getClaudeConfigDir(): string {
  const configPath = getClaudeConfigPath();
  return path.dirname(configPath);
}

/**
 * Check if a path exists
 */
export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
    return true;
  } catch {
    return false;
  }
}
