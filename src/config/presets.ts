/**
 * Hardcoded provider presets
 * Based on CC Switch project presets
 */
import type { Provider, ProviderCategory } from './types';

/**
 * Provider presets for Claude API Switcher
 * These are hardcoded in the extension for simplicity
 */
export const providerPresets: Provider[] = [
  // ==================== Official ====================
  {
    id: 'claude-official',
    name: 'Claude Official',
    category: 'official',
    settingsConfig: {
      env: {},
    },
    meta: {
      websiteUrl: 'https://www.anthropic.com/claude-code',
      apiKeyUrl: 'https://console.anthropic.com/settings/keys',
      description: 'Official Anthropic Claude API',
    },
    icon: 'anthropic',
    iconColor: '#D4915D',
  },

  // ==================== CN Official Providers ====================
  {
    id: 'deepseek',
    name: 'DeepSeek',
    category: 'third_party',
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: 'https://api.deepseek.com/anthropic',
        ANTHROPIC_AUTH_TOKEN: '',
        ANTHROPIC_MODEL: 'DeepSeek-V3.2',
        ANTHROPIC_DEFAULT_HAIKU_MODEL: 'DeepSeek-V3.2',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'DeepSeek-V3.2',
        ANTHROPIC_DEFAULT_OPUS_MODEL: 'DeepSeek-V3.2',
      },
    },
    meta: {
      websiteUrl: 'https://platform.deepseek.com',
      apiKeyUrl: 'https://platform.deepseek.com/api_keys',
      description: 'DeepSeek AI Platform',
    },
    icon: 'deepseek',
    iconColor: '#1E88E5',
  },
  {
    id: 'zhipu-glm',
    name: 'Zhipu GLM',
    category: 'third_party',
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: 'https://open.bigmodel.cn/api/anthropic',
        ANTHROPIC_AUTH_TOKEN: '',
        ANTHROPIC_MODEL: 'glm-4.6',
        ANTHROPIC_DEFAULT_HAIKU_MODEL: 'glm-4.5-air',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'glm-4.6',
        ANTHROPIC_DEFAULT_OPUS_MODEL: 'glm-4.6',
      },
    },
    meta: {
      websiteUrl: 'https://open.bigmodel.cn',
      apiKeyUrl: 'https://www.bigmodel.cn/claude-code?ic=RRVJPB5SII',
      description: 'Zhipu AI GLM Models',
    },
    icon: 'zhipu',
    iconColor: '#0F62FE',
  },
  {
    id: 'z-ai-glm',
    name: 'Z.ai GLM',
    category: 'third_party',
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: 'https://api.z.ai/api/anthropic',
        ANTHROPIC_AUTH_TOKEN: '',
        ANTHROPIC_MODEL: 'glm-4.6',
        ANTHROPIC_DEFAULT_HAIKU_MODEL: 'glm-4.5-air',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'glm-4.6',
        ANTHROPIC_DEFAULT_OPUS_MODEL: 'glm-4.6',
      },
    },
    meta: {
      websiteUrl: 'https://z.ai',
      apiKeyUrl: 'https://z.ai/subscribe?ic=8JVLJQFSKB',
      description: 'Z.ai GLM Models',
    },
    icon: 'zhipu',
    iconColor: '#0F62FE',
  },
  {
    id: 'qwen-coder',
    name: 'Qwen Coder',
    category: 'third_party',
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: 'https://dashscope.aliyuncs.com/api/v2/apps/claude-code-proxy',
        ANTHROPIC_AUTH_TOKEN: '',
        ANTHROPIC_MODEL: 'qwen3-max',
        ANTHROPIC_DEFAULT_HAIKU_MODEL: 'qwen3-max',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'qwen3-max',
        ANTHROPIC_DEFAULT_OPUS_MODEL: 'qwen3-max',
      },
    },
    meta: {
      websiteUrl: 'https://bailian.console.aliyun.com',
      apiKeyUrl: 'https://bailian.console.aliyun.com',
      description: 'Alibaba Qwen Coder Models',
    },
    icon: 'qwen',
    iconColor: '#FF6A00',
  },
  {
    id: 'kimi-k2',
    name: 'Kimi k2',
    category: 'third_party',
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: 'https://api.moonshot.cn/anthropic',
        ANTHROPIC_AUTH_TOKEN: '',
        ANTHROPIC_MODEL: 'kimi-k2-thinking',
        ANTHROPIC_DEFAULT_HAIKU_MODEL: 'kimi-k2-thinking',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'kimi-k2-thinking',
        ANTHROPIC_DEFAULT_OPUS_MODEL: 'kimi-k2-thinking',
      },
    },
    meta: {
      websiteUrl: 'https://platform.moonshot.cn/console',
      apiKeyUrl: 'https://platform.moonshot.cn/console/api-keys',
      description: 'Moonshot Kimi k2 Models',
    },
    icon: 'kimi',
    iconColor: '#6366F1',
  },
  {
    id: 'kimi-for-coding',
    name: 'Kimi For Coding',
    category: 'third_party',
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: 'https://api.kimi.com/coding/',
        ANTHROPIC_AUTH_TOKEN: '',
        ANTHROPIC_MODEL: 'kimi-for-coding',
        ANTHROPIC_DEFAULT_HAIKU_MODEL: 'kimi-for-coding',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'kimi-for-coding',
        ANTHROPIC_DEFAULT_OPUS_MODEL: 'kimi-for-coding',
      },
    },
    meta: {
      websiteUrl: 'https://www.kimi.com/coding/docs/',
      description: 'Kimi For Coding',
    },
    icon: 'kimi',
    iconColor: '#6366F1',
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    category: 'third_party',
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: 'https://api.minimaxi.com/anthropic',
        ANTHROPIC_AUTH_TOKEN: '',
        API_TIMEOUT_MS: '3000000',
        CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
        ANTHROPIC_MODEL: 'MiniMax-M2',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'MiniMax-M2',
        ANTHROPIC_DEFAULT_OPUS_MODEL: 'MiniMax-M2',
        ANTHROPIC_DEFAULT_HAIKU_MODEL: 'MiniMax-M2',
      },
    },
    meta: {
      websiteUrl: 'https://platform.minimaxi.com',
      apiKeyUrl: 'https://platform.minimaxi.com/subscribe/coding-plan',
      description: 'MiniMax AI Platform (CN)',
    },
    icon: 'minimax',
    iconColor: '#FF6B6B',
  },
  {
    id: 'minimax-en',
    name: 'MiniMax (EN)',
    category: 'third_party',
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: 'https://api.minimax.io/anthropic',
        ANTHROPIC_AUTH_TOKEN: '',
        API_TIMEOUT_MS: '3000000',
        CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
        ANTHROPIC_MODEL: 'MiniMax-M2',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'MiniMax-M2',
        ANTHROPIC_DEFAULT_OPUS_MODEL: 'MiniMax-M2',
        ANTHROPIC_DEFAULT_HAIKU_MODEL: 'MiniMax-M2',
      },
    },
    meta: {
      websiteUrl: 'https://platform.minimax.io',
      apiKeyUrl: 'https://platform.minimax.io/subscribe/coding-plan',
      description: 'MiniMax AI Platform (International)',
    },
    icon: 'minimax',
    iconColor: '#FF6B6B',
  },
];

/**
 * Get presets by category
 */
export function getPresetsByCategory(category: ProviderCategory): Provider[] {
  return providerPresets.filter(p => p.category === category);
}

/**
 * Find preset by ID
 */
export function findPresetById(id: string): Provider | undefined {
  return providerPresets.find(p => p.id === id);
}

/**
 * Find preset by name (case-insensitive)
 */
export function findPresetByName(name: string): Provider | undefined {
  const lowerName = name.toLowerCase();
  return providerPresets.find(p => p.name.toLowerCase() === lowerName);
}

/**
 * Get all preset categories that have providers
 */
export function getAvailableCategories(): ProviderCategory[] {
  const categories = new Set(providerPresets.map(p => p.category));
  return Array.from(categories);
}
