import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Figma URL patterns
export const FIGMA_URL_PATTERNS = {
  file: /https:\/\/(?:www\.)?figma\.com\/(?:file|design)\/([a-zA-Z0-9]{22,128})\/[^?]*(?:\?.*?node-id=([^&]+))?/,
  team: /https:\/\/(?:www\.)?figma\.com\/files\/team\/(\d+)/,
  project: /https:\/\/(?:www\.)?figma\.com\/files\/project\/(\d+)/,
};

/**
 * Parse file key from Figma URL or return as-is if already a key
 */
export function parseFileKey(input: string): string {
  // If it's already a file key (no URL), return as-is
  if (!input.includes('figma.com')) {
    return input;
  }

  // Extract file key from URL
  const match = input.match(FIGMA_URL_PATTERNS.file);
  if (match && match[1]) {
    return match[1];
  }

  throw new McpError(
    ErrorCode.InvalidRequest,
    `Invalid Figma URL or file key: ${input}. Expected format: https://figma.com/file/FILE_KEY/...`
  );
}

/**
 * Parse node IDs from Figma URL or string
 */
export function parseNodeIds(input: string): string[] {
  // If it's a URL, extract node IDs from the URL
  if (input.includes('figma.com')) {
    const match = input.match(FIGMA_URL_PATTERNS.file);
    if (match && match[2]) {
      // Convert node-id format (1-2) to API format (1:2)
      return match[2].split('%2C').map(id => id.replace(/-/g, ':'));
    }
    return [];
  }

  // If it's already node IDs, split by comma
  return input.split(',').map(id => id.trim());
}

/**
 * Parse team ID from Figma URL or return as-is if already an ID
 */
export function parseTeamId(input: string): string {
  // If it's already a team ID (no URL), return as-is
  if (!input.includes('figma.com')) {
    return input;
  }

  // Extract team ID from URL
  const match = input.match(FIGMA_URL_PATTERNS.team);
  if (match && match[1]) {
    return match[1];
  }

  throw new McpError(
    ErrorCode.InvalidRequest,
    `Invalid Figma team URL or ID: ${input}. Expected format: https://figma.com/files/team/TEAM_ID`
  );
}

/**
 * Extract all relevant IDs from a Figma URL
 */
export function extractFigmaIds(url: string) {
  const result: {
    fileKey?: string;
    nodeIds?: string[];
    teamId?: string;
    type: 'file' | 'team' | 'project' | 'unknown';
  } = { type: 'unknown' };

  try {
    // Try file URL first
    const fileMatch = url.match(FIGMA_URL_PATTERNS.file);
    if (fileMatch) {
      result.type = 'file';
      result.fileKey = fileMatch[1];
      if (fileMatch[2]) {
        result.nodeIds = parseNodeIds(url);
      }
      return result;
    }

    // Try team URL
    const teamMatch = url.match(FIGMA_URL_PATTERNS.team);
    if (teamMatch) {
      result.type = 'team';
      result.teamId = teamMatch[1];
      return result;
    }

    // Try project URL
    const projectMatch = url.match(FIGMA_URL_PATTERNS.project);
    if (projectMatch) {
      result.type = 'project';
      // Project URLs contain team info in the broader context
      return result;
    }

  } catch (error) {
    // URL doesn't match any known patterns
  }

  return result;
}

/**
 * Validate if a string is a valid Figma file key
 */
export function isValidFileKey(key: string): boolean {
  return /^[a-zA-Z0-9]{22,128}$/.test(key);
}

/**
 * Validate if a string is a valid node ID
 */
export function isValidNodeId(nodeId: string): boolean {
  return /^\d+:\d+$/.test(nodeId);
}

/**
 * Convert node ID from URL format (1-2) to API format (1:2)
 */
export function convertNodeIdFormat(nodeId: string): string {
  return nodeId.replace(/-/g, ':');
}

/**
 * Build Figma URL from components
 */
export function buildFigmaUrl(fileKey: string, fileName?: string, nodeId?: string): string {
  let url = `https://www.figma.com/file/${fileKey}`;
  
  if (fileName) {
    url += `/${encodeURIComponent(fileName)}`;
  } else {
    url += '/Untitled';
  }
  
  if (nodeId) {
    const urlNodeId = nodeId.replace(/:/g, '-');
    url += `?node-id=${urlNodeId}`;
  }
  
  return url;
} 