import * as fs from 'fs';
import * as path from 'path';
import { FigmaConfig } from '../types/figma.js';

/**
 * Load configuration from file and environment variables
 */
export function loadConfig(): FigmaConfig {
  let config: FigmaConfig = {};

  // Try to load from config file
  try {
    const configPath = path.join(process.cwd(), 'src/config/figma.config.json');
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(configContent);
    }
  } catch (error) {
    // Config file doesn't exist or is invalid, continue with defaults
  }

  // Override with environment variables
  return {
    default_file_url: process.env.FIGMA_DEFAULT_FILE_URL || config.default_file_url,
    default_team_url: process.env.FIGMA_DEFAULT_TEAM_URL || config.default_team_url,
    project_urls: process.env.FIGMA_PROJECT_URLS?.split(',') || config.project_urls || [],
  };
}

/**
 * Get Figma access token from environment
 */
export function getFigmaToken(): string | undefined {
  return process.env.FIGMA_ACCESS_TOKEN;
}

/**
 * Validate configuration
 */
export function validateConfig(config: FigmaConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.default_file_url && !isValidFigmaUrl(config.default_file_url)) {
    errors.push('Invalid default_file_url format');
  }

  if (config.default_team_url && !isValidFigmaUrl(config.default_team_url)) {
    errors.push('Invalid default_team_url format');
  }

  if (config.project_urls) {
    config.project_urls.forEach((url, index) => {
      if (!isValidFigmaUrl(url)) {
        errors.push(`Invalid project_urls[${index}] format`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if a URL is a valid Figma URL
 */
function isValidFigmaUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname === 'www.figma.com' || parsedUrl.hostname === 'figma.com';
  } catch {
    return false;
  }
}

/**
 * Get application configuration
 */
export function getAppConfig() {
  return {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    figmaApiBase: 'https://api.figma.com/v1',
    corsEnabled: process.env.CORS_ENABLED !== 'false',
    logLevel: process.env.LOG_LEVEL || 'info',
  };
} 