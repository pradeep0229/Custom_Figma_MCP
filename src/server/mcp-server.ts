import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

// Figma API configuration
const FIGMA_API_BASE = 'https://api.figma.com/v1';

// Configuration interface
interface FigmaConfig {
  default_file_url?: string;
  default_team_url?: string;
  project_urls?: string[];
}

// Figma URL patterns
const FIGMA_URL_PATTERNS = {
  file: /https:\/\/(?:www\.)?figma\.com\/(?:file|design)\/([a-zA-Z0-9]{22,128})\/[^?]*(?:\?.*?node-id=([^&]+))?/,
  team: /https:\/\/(?:www\.)?figma\.com\/files\/team\/(\d+)/,
  project: /https:\/\/(?:www\.)?figma\.com\/files\/project\/(\d+)/,
};

class FigmaMCPServer {
  private server: Server;
  private figmaToken: string | undefined;
  private config: FigmaConfig;

  constructor() {
    this.server = new Server(
      {
        name: 'custom-figma-mcp',
        version: '1.0.0',
      },
      {
  capabilities: {
    tools: {},
  },
      }
    );

    this.figmaToken = process.env.FIGMA_ACCESS_TOKEN;
    this.config = this.loadConfig();
    this.setupToolHandlers();
  }

  private async makeRequest(endpoint: string): Promise<any> {
    if (!this.figmaToken) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Figma access token not provided. Set FIGMA_ACCESS_TOKEN environment variable.'
      );
    }

    const response = await fetch(`${FIGMA_API_BASE}${endpoint}`, {
      headers: {
        'X-Figma-Token': this.figmaToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new McpError(
        ErrorCode.InternalError,
        `Figma API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
                     {
             name: 'get_figma_file',
             description: 'Get information about a Figma file including its structure and metadata',
             inputSchema: {
               type: 'object',
               properties: {
                 file_key_or_url: {
                   type: 'string',
                   description: 'Figma file key OR complete Figma URL (e.g., https://figma.com/file/ABC123/My-Design)',
                 },
               },
               required: [],
             },
           },
          {
            name: 'get_figma_components',
            description: 'Get all components from a Figma file',
            inputSchema: {
              type: 'object',
              properties: {
                file_key: {
                  type: 'string',
                  description: 'The Figma file key (found in the URL)',
                },
              },
              required: ['file_key'],
            },
          },
          {
            name: 'export_figma_image',
            description: 'Export images from specific nodes in a Figma file',
            inputSchema: {
              type: 'object',
              properties: {
                file_key: {
                  type: 'string',
                  description: 'The Figma file key (found in the URL)',
                },
                node_ids: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of node IDs to export',
                },
                format: {
                  type: 'string',
                  enum: ['jpg', 'png', 'svg', 'pdf'],
                  default: 'png',
                  description: 'Export format',
                },
                scale: {
                  type: 'number',
                  default: 1,
                  description: 'Scale factor (1-4)',
                },
              },
              required: ['file_key', 'node_ids'],
            },
          },
          {
            name: 'get_figma_team_projects',
            description: 'Get all projects for a specific team',
            inputSchema: {
              type: 'object',
              properties: {
                team_id: {
                  type: 'string',
                  description: 'The Figma team ID',
                },
              },
              required: ['team_id'],
            },
          },
                     {
             name: 'search_figma_files',
             description: 'Search for files in a Figma team',
             inputSchema: {
               type: 'object',
               properties: {
                 team_id: {
                   type: 'string',
                   description: 'The Figma team ID',
                 },
                 query: {
                   type: 'string',
                   description: 'Search query',
                 },
               },
               required: ['team_id'],
             },
           },
           {
             name: 'get_figma_styles',
             description: 'Get all styles (colors, text, effects, grids) from a Figma file',
             inputSchema: {
               type: 'object',
               properties: {
                 file_key: {
                   type: 'string',
                   description: 'The Figma file key (found in the URL)',
                 },
               },
               required: ['file_key'],
             },
           },
           {
             name: 'analyze_figma_design_system',
             description: 'Analyze and extract design system information from a Figma file including colors, typography, spacing, and components',
             inputSchema: {
               type: 'object',
               properties: {
                 file_key: {
                   type: 'string',
                   description: 'The Figma file key (found in the URL)',
                 },
                 include_components: {
                   type: 'boolean',
                   default: true,
                   description: 'Whether to include component analysis',
                 },
                 include_styles: {
                   type: 'boolean',
                   default: true,
                   description: 'Whether to include style analysis',
                 },
               },
               required: ['file_key'],
             },
           },
           {
             name: 'get_figma_version_history',
             description: 'Get version history and comments for a Figma file',
             inputSchema: {
               type: 'object',
               properties: {
                 file_key: {
                   type: 'string',
                   description: 'The Figma file key (found in the URL)',
                 },
               },
               required: ['file_key'],
             },
           },
           {
             name: 'map_figma_to_code_components',
             description: 'Analyze Figma components and suggest mappings to existing code components based on naming patterns, structure, and properties',
             inputSchema: {
               type: 'object',
               properties: {
                 file_key: {
                   type: 'string',
                   description: 'The Figma file key (found in the URL)',
                 },
                 code_directory: {
                   type: 'string',
                   description: 'Path to your components directory (e.g., ./src/components)',
                 },
                 framework: {
                   type: 'string',
                   enum: ['react', 'vue', 'angular', 'svelte', 'vanilla'],
                   default: 'react',
                   description: 'Frontend framework used in your codebase',
                 },
                 include_props_analysis: {
                   type: 'boolean',
                   default: true,
                   description: 'Whether to analyze component properties and variants',
                 },
               },
               required: ['file_key', 'code_directory'],
             },
           },
           {
             name: 'generate_component_usage_guide',
             description: 'Generate a usage guide showing how to use existing coded components based on Figma designs',
             inputSchema: {
               type: 'object',
               properties: {
                 file_key: {
                   type: 'string',
                   description: 'The Figma file key (found in the URL)',
                 },
                 component_mappings: {
                   type: 'object',
                   description: 'Manual mappings between Figma components and code components (optional)',
                 },
                 output_format: {
                   type: 'string',
                   enum: ['markdown', 'json', 'typescript'],
                   default: 'markdown',
                   description: 'Output format for the usage guide',
                 },
               },
               required: ['file_key'],
             },
           },
           {
             name: 'analyze_design_code_consistency',
             description: 'Compare Figma designs with existing code components to identify inconsistencies and missing implementations',
             inputSchema: {
               type: 'object',
               properties: {
                 file_key: {
                   type: 'string',
                   description: 'The Figma file key (found in the URL)',
                 },
                 code_directory: {
                   type: 'string',
                   description: 'Path to your components directory',
                 },
                 check_styles: {
                   type: 'boolean',
                   default: true,
                   description: 'Whether to check style consistency (colors, typography, spacing)',
                 },
                 check_components: {
                   type: 'boolean',
                   default: true,
                   description: 'Whether to check component implementation consistency',
                 },
               },
               required: ['file_key', 'code_directory'],
             },
           },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
                 switch (name) {
           case 'get_figma_file':
             return await this.getFigmaFile(args);
           case 'get_figma_components':
             return await this.getFigmaComponents(args);
           case 'export_figma_image':
             return await this.exportFigmaImage(args);
           case 'get_figma_team_projects':
             return await this.getFigmaTeamProjects(args);
           case 'search_figma_files':
             return await this.searchFigmaFiles(args);
           case 'get_figma_styles':
             return await this.getFigmaStyles(args);
           case 'analyze_figma_design_system':
             return await this.analyzeFigmaDesignSystem(args);
           case 'get_figma_version_history':
             return await this.getFigmaVersionHistory(args);
           case 'map_figma_to_code_components':
             return await this.mapFigmaToCodeComponents(args);
           case 'generate_component_usage_guide':
             return await this.generateComponentUsageGuide(args);
           case 'analyze_design_code_consistency':
             return await this.analyzeDesignCodeConsistency(args);
           default:
             throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
         }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error}`);
      }
    });
  }

  private async getFigmaFile(args: any) {
    const schema = z.object({
      file_key_or_url: z.string().optional(),
    });
    const { file_key_or_url } = schema.parse(args);

    const file_key = this.resolveFileKey(file_key_or_url);
    const data = await this.makeRequest(`/files/${file_key}`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            extracted_file_key: file_key,
            original_input: file_key_or_url,
            figma_data: data
          }, null, 2),
        },
      ],
    };
  }

  private async getFigmaComponents(args: any) {
    const schema = z.object({
      file_key: z.string(),
    });
    const { file_key } = schema.parse(args);

    const data = await this.makeRequest(`/files/${file_key}/components`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private async exportFigmaImage(args: any) {
    const schema = z.object({
      file_key: z.string(),
      node_ids: z.array(z.string()),
      format: z.enum(['jpg', 'png', 'svg', 'pdf']).default('png'),
      scale: z.number().min(1).max(4).default(1),
    });
    const { file_key, node_ids, format, scale } = schema.parse(args);

    const params = new URLSearchParams({
      ids: node_ids.join(','),
      format,
      scale: scale.toString(),
    });

    const data = await this.makeRequest(`/images/${file_key}?${params}`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private async getFigmaTeamProjects(args: any) {
    const schema = z.object({
      team_id: z.string(),
    });
    const { team_id } = schema.parse(args);

    const data = await this.makeRequest(`/teams/${team_id}/projects`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private async searchFigmaFiles(args: any) {
    const schema = z.object({
      team_id: z.string(),
      query: z.string().optional(),
    });
    const { team_id, query } = schema.parse(args);

    let endpoint = `/teams/${team_id}/projects`;
    if (query) {
      const params = new URLSearchParams({ query });
      endpoint += `?${params}`;
    }

    const data = await this.makeRequest(endpoint);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private async getFigmaStyles(args: any) {
    const schema = z.object({
      file_key: z.string(),
    });
    const { file_key } = schema.parse(args);

    const data = await this.makeRequest(`/files/${file_key}/styles`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private async analyzeFigmaDesignSystem(args: any) {
    const schema = z.object({
      file_key: z.string(),
      include_components: z.boolean().default(true),
      include_styles: z.boolean().default(true),
    });
    const { file_key, include_components, include_styles } = schema.parse(args);

    const analysisResults: any = {
      file_key,
      analysis_timestamp: new Date().toISOString(),
      design_system: {},
    };

    try {
      // Get file structure
      const fileData = await this.makeRequest(`/files/${file_key}`);
      analysisResults.design_system.file_info = {
        name: fileData.name,
        version: fileData.version,
        lastModified: fileData.lastModified,
        pages: fileData.document?.children?.length || 0,
      };

      // Get components if requested
      if (include_components) {
        const componentsData = await this.makeRequest(`/files/${file_key}/components`);
        analysisResults.design_system.components = {
          count: Object.keys(componentsData.meta?.components || {}).length,
          components: componentsData.meta?.components || {},
        };
      }

      // Get styles if requested
      if (include_styles) {
        const stylesData = await this.makeRequest(`/files/${file_key}/styles`);
        analysisResults.design_system.styles = {
          count: Object.keys(stylesData.meta?.styles || {}).length,
          styles: stylesData.meta?.styles || {},
        };
      }

      // Analyze document structure for patterns
      if (fileData.document?.children) {
        const pages = fileData.document.children;
        analysisResults.design_system.structure = {
          pages: pages.map((page: any) => ({
            name: page.name,
            type: page.type,
            children_count: page.children?.length || 0,
            frames: page.children?.filter((child: any) => child.type === 'FRAME').length || 0,
          })),
        };
      }

    } catch (error) {
      analysisResults.error = `Analysis failed: ${error}`;
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(analysisResults, null, 2),
        },
      ],
    };
  }

  private async getFigmaVersionHistory(args: any) {
    const schema = z.object({
      file_key: z.string(),
    });
    const { file_key } = schema.parse(args);

    try {
      // Get file versions
      const versionsData = await this.makeRequest(`/files/${file_key}/versions`);
      
      // Get comments
      const commentsData = await this.makeRequest(`/files/${file_key}/comments`);

      const historyData = {
        file_key,
        versions: versionsData.versions || [],
        comments: commentsData.comments || [],
        summary: {
          total_versions: versionsData.versions?.length || 0,
          total_comments: commentsData.comments?.length || 0,
          latest_version: versionsData.versions?.[0]?.created_at || 'Unknown',
        },
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(historyData, null, 2),
          },
        ],
      };
    } catch (error) {
      // If versions/comments endpoints fail, provide basic file info
      const fileData = await this.makeRequest(`/files/${file_key}`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              file_key,
              basic_info: {
                name: fileData.name,
                version: fileData.version,
                lastModified: fileData.lastModified,
              },
              note: 'Full version history may require additional permissions',
            }, null, 2),
          },
        ],
      };
    }
  }

  private async mapFigmaToCodeComponents(args: any) {
    const schema = z.object({
      file_key: z.string(),
      code_directory: z.string(),
      framework: z.enum(['react', 'vue', 'angular', 'svelte', 'vanilla']).default('react'),
      include_props_analysis: z.boolean().default(true),
    });
    const { file_key, code_directory, framework, include_props_analysis } = schema.parse(args);

    try {
      // Get Figma components
      const figmaComponents = await this.makeRequest(`/files/${file_key}/components`);
      
      // Scan code directory for components
      const codeComponents = this.scanCodeComponents(code_directory, framework);
      
      // Create mapping suggestions
      const mappings = this.createComponentMappings(
        figmaComponents.meta?.components || {},
        codeComponents,
        include_props_analysis
      );

      const result = {
        file_key,
        code_directory,
        framework,
        analysis_timestamp: new Date().toISOString(),
        figma_components_count: Object.keys(figmaComponents.meta?.components || {}).length,
        code_components_count: codeComponents.length,
        mappings,
        suggestions: this.generateMappingSuggestions(mappings),
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(ErrorCode.InternalError, `Component mapping failed: ${error}`);
    }
  }

  private async generateComponentUsageGuide(args: any) {
    const schema = z.object({
      file_key: z.string(),
      component_mappings: z.object({}).optional(),
      output_format: z.enum(['markdown', 'json', 'typescript']).default('markdown'),
    });
    const { file_key, component_mappings, output_format } = schema.parse(args);

    try {
      // Get Figma file and components data
      const [fileData, componentsData] = await Promise.all([
        this.makeRequest(`/files/${file_key}`),
        this.makeRequest(`/files/${file_key}/components`),
      ]);

      const usageGuide = this.generateUsageGuideContent(
        fileData,
        componentsData,
        component_mappings || {},
        output_format
      );

      return {
        content: [
          {
            type: 'text',
            text: usageGuide,
          },
        ],
      };
    } catch (error) {
      throw new McpError(ErrorCode.InternalError, `Usage guide generation failed: ${error}`);
    }
  }

  private async analyzeDesignCodeConsistency(args: any) {
    const schema = z.object({
      file_key: z.string(),
      code_directory: z.string(),
      check_styles: z.boolean().default(true),
      check_components: z.boolean().default(true),
    });
    const { file_key, code_directory, check_styles, check_components } = schema.parse(args);

    try {
      const consistencyReport: any = {
        file_key,
        code_directory,
        analysis_timestamp: new Date().toISOString(),
        consistency_score: 0,
        issues: [],
        recommendations: [],
      };

      if (check_components) {
        const componentsAnalysis = await this.checkComponentConsistency(file_key, code_directory);
        consistencyReport.components = componentsAnalysis;
        consistencyReport.issues.push(...componentsAnalysis.issues);
      }

      if (check_styles) {
        const stylesAnalysis = await this.checkStyleConsistency(file_key, code_directory);
        consistencyReport.styles = stylesAnalysis;
        consistencyReport.issues.push(...stylesAnalysis.issues);
      }

      // Calculate overall consistency score
      consistencyReport.consistency_score = this.calculateConsistencyScore(consistencyReport);
      consistencyReport.recommendations = this.generateConsistencyRecommendations(consistencyReport);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(consistencyReport, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(ErrorCode.InternalError, `Consistency analysis failed: ${error}`);
    }
  }

  // Helper methods for component mapping and analysis
  private scanCodeComponents(directory: string, framework: string): any[] {
    const components: any[] = [];
    
    try {
      if (!fs.existsSync(directory)) {
        return [];
      }

      const files = this.getAllFiles(directory, this.getFileExtensions(framework));
      
      files.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const componentInfo = this.extractComponentInfo(file, content, framework);
          if (componentInfo) {
            components.push(componentInfo);
          }
        } catch (error) {
          // Skip files that can't be read
        }
      });
    } catch (error) {
      // Directory doesn't exist or can't be accessed
    }

    return components;
  }

  private getAllFiles(dir: string, extensions: string[]): string[] {
    const files: string[] = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...this.getAllFiles(fullPath, extensions));
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      });
    } catch (error) {
      // Skip directories that can't be read
    }
    
    return files;
  }

  private getFileExtensions(framework: string): string[] {
    const extensionMap: Record<string, string[]> = {
      react: ['.jsx', '.tsx', '.js', '.ts'],
      vue: ['.vue', '.js', '.ts'],
      angular: ['.component.ts', '.ts'],
      svelte: ['.svelte', '.js', '.ts'],
      vanilla: ['.js', '.ts'],
    };
    
    return extensionMap[framework] || ['.js', '.ts'];
  }

  private extractComponentInfo(filePath: string, content: string, framework: string): any | null {
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // Basic component detection patterns
    const patterns = {
      react: /(?:export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)|function\s+(\w+)\s*\()/g,
      vue: /<template>|export\s+default\s*\{/g,
      angular: /@Component\s*\(/g,
      svelte: /<script>|<style>|<[a-zA-Z]/g,
      vanilla: /(?:class\s+(\w+)|function\s+(\w+))/g,
    };

    const pattern = patterns[framework as keyof typeof patterns];
    if (!pattern || !pattern.test(content)) {
      return null;
    }

    return {
      name: fileName,
      path: filePath,
      framework,
      size: content.length,
      exports: this.extractExports(content, framework),
      props: this.extractProps(content, framework),
    };
  }

  private extractExports(content: string, framework: string): string[] {
    // Simple export extraction - can be enhanced
    const exports: string[] = [];
    const exportRegex = /export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)/g;
    let match;
    
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    return exports;
  }

  private extractProps(content: string, framework: string): string[] {
    // Simple props extraction - can be enhanced based on framework
    const props: string[] = [];
    
    if (framework === 'react') {
      const propsRegex = /(?:interface|type)\s+\w*Props\s*\{([^}]+)\}/g;
      const match = propsRegex.exec(content);
      if (match) {
        const propsContent = match[1];
        const propMatches = propsContent.match(/(\w+)(?:\?)?:/g);
        if (propMatches) {
          props.push(...propMatches.map(p => p.replace(/[\?:]/g, '')));
        }
      }
    }
    
    return props;
  }

  private createComponentMappings(figmaComponents: any, codeComponents: any[], includeProps: boolean): any {
    const mappings: any = {
      exact_matches: [],
      similar_matches: [],
      missing_in_code: [],
      missing_in_figma: [],
    };

    // Create mappings based on name similarity
    Object.entries(figmaComponents).forEach(([id, figmaComponent]: [string, any]) => {
      const figmaName = figmaComponent.name.toLowerCase();
      const exactMatch = codeComponents.find(cc => cc.name.toLowerCase() === figmaName);
      
      if (exactMatch) {
        mappings.exact_matches.push({
          figma_id: id,
          figma_name: figmaComponent.name,
          code_component: exactMatch,
          confidence: 1.0,
        });
      } else {
        const similarMatches = codeComponents
          .map(cc => ({
            component: cc,
            similarity: this.calculateNameSimilarity(figmaName, cc.name.toLowerCase()),
          }))
          .filter(match => match.similarity > 0.5)
          .sort((a, b) => b.similarity - a.similarity);

        if (similarMatches.length > 0) {
          mappings.similar_matches.push({
            figma_id: id,
            figma_name: figmaComponent.name,
            suggestions: similarMatches.slice(0, 3),
          });
        } else {
          mappings.missing_in_code.push({
            figma_id: id,
            figma_name: figmaComponent.name,
            description: figmaComponent.description || '',
          });
        }
      }
    });

    // Find code components not in Figma
    const mappedCodeComponents = new Set([
      ...mappings.exact_matches.map((m: any) => m.code_component.name),
      ...mappings.similar_matches.flatMap((m: any) => 
        m.suggestions.map((s: any) => s.component.name)
      ),
    ]);

    mappings.missing_in_figma = codeComponents
      .filter(cc => !mappedCodeComponents.has(cc.name))
      .map(cc => ({
        name: cc.name,
        path: cc.path,
        framework: cc.framework,
      }));

    return mappings;
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    // Simple similarity calculation using longest common subsequence
    const lcs = this.longestCommonSubsequence(name1, name2);
    return (2 * lcs) / (name1.length + name2.length);
  }

  private longestCommonSubsequence(str1: string, str2: string): number {
    const matrix = Array(str1.length + 1).fill(null).map(() => Array(str2.length + 1).fill(0));
    
    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1] + 1;
        } else {
          matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
        }
      }
    }
    
    return matrix[str1.length][str2.length];
  }

  private generateMappingSuggestions(mappings: any): string[] {
    const suggestions: string[] = [];
    
    if (mappings.exact_matches.length > 0) {
      suggestions.push(`Found ${mappings.exact_matches.length} exact component matches. These can be reused directly.`);
    }
    
    if (mappings.similar_matches.length > 0) {
      suggestions.push(`Found ${mappings.similar_matches.length} similar components that might be reusable with modifications.`);
    }
    
    if (mappings.missing_in_code.length > 0) {
      suggestions.push(`${mappings.missing_in_code.length} Figma components need to be implemented in code.`);
    }
    
    if (mappings.missing_in_figma.length > 0) {
      suggestions.push(`${mappings.missing_in_figma.length} code components don't have corresponding Figma designs.`);
    }

    return suggestions;
  }

  private generateUsageGuideContent(fileData: any, componentsData: any, mappings: any, format: string): string {
    if (format === 'markdown') {
      return this.generateMarkdownUsageGuide(fileData, componentsData, mappings);
    } else if (format === 'typescript') {
      return this.generateTypescriptUsageGuide(fileData, componentsData, mappings);
    } else {
      return JSON.stringify({
        file: fileData.name,
        components: componentsData.meta?.components || {},
        mappings,
        generated_at: new Date().toISOString(),
      }, null, 2);
    }
  }

  private generateMarkdownUsageGuide(fileData: any, componentsData: any, mappings: any): string {
    return `# Component Usage Guide for ${fileData.name}

Generated on: ${new Date().toISOString()}

## Available Components

${Object.entries(componentsData.meta?.components || {}).map(([id, component]: [string, any]) => `
### ${component.name}
- **Description**: ${component.description || 'No description available'}
- **Figma ID**: ${id}
- **Usage**: Check your existing components for similar functionality

`).join('')}

## Reusable Component Recommendations

Based on your existing codebase, consider reusing these patterns:

${mappings ? Object.entries(mappings).map(([figmaName, codeComponent]: [string, any]) => `
- **${figmaName}** → Use existing \`${codeComponent}\` component
`).join('') : 'No mappings provided'}

## Next Steps

1. Review the component mappings above
2. Identify which existing components can be reused
3. Plan implementation for missing components
4. Ensure design consistency across implementations
`;
  }

  private generateTypescriptUsageGuide(fileData: any, componentsData: any, mappings: any): string {
    return `// Component usage guide for ${fileData.name}
// Generated on: ${new Date().toISOString()}

export interface ComponentMapping {
  figmaId: string;
  figmaName: string;
  codeComponent?: string;
  status: 'available' | 'similar' | 'missing';
}

export const componentMappings: ComponentMapping[] = [
${Object.entries(componentsData.meta?.components || {}).map(([id, component]: [string, any]) => `
  {
    figmaId: "${id}",
    figmaName: "${component.name}",
    status: "missing", // Update based on your analysis
  },`).join('')}
];

// Usage examples:
// import { Button } from './components/Button';
// import { Card } from './components/Card';
// 
// Use these components based on the Figma designs
`;
  }

  private async checkComponentConsistency(fileKey: string, codeDirectory: string): Promise<any> {
    // Placeholder for component consistency checking
    return {
      total_components: 0,
      consistent_components: 0,
      issues: [],
    };
  }

  private async checkStyleConsistency(fileKey: string, codeDirectory: string): Promise<any> {
    // Placeholder for style consistency checking
    return {
      total_styles: 0,
      consistent_styles: 0,
      issues: [],
    };
  }

  private calculateConsistencyScore(report: any): number {
    // Simple consistency score calculation
    const totalIssues = report.issues?.length || 0;
    return Math.max(0, 100 - (totalIssues * 10));
  }

  private generateConsistencyRecommendations(report: any): string[] {
    const recommendations: string[] = [];
    
    if (report.consistency_score < 70) {
      recommendations.push('Consider refactoring components to match Figma designs more closely');
    }
    
    if (report.issues?.length > 0) {
      recommendations.push('Address the identified consistency issues to improve design-code alignment');
    }
    
    recommendations.push('Regularly sync design changes with code implementations');
    
    return recommendations;
  }

  // Configuration and URL parsing methods
  private loadConfig(): FigmaConfig {
    try {
      // Try multiple config paths
      const configPaths = [
        path.join(process.cwd(), 'src/config/figma.config.json'),
        path.join(process.cwd(), 'figma.config.json'),
      ];
      
      for (const configPath of configPaths) {
        if (fs.existsSync(configPath)) {
          const configContent = fs.readFileSync(configPath, 'utf8');
          return JSON.parse(configContent);
        }
      }
    } catch (error) {
      // Config file doesn't exist or is invalid, use defaults
    }
    
    return {
      default_file_url: process.env.FIGMA_DEFAULT_FILE_URL,
      default_team_url: process.env.FIGMA_DEFAULT_TEAM_URL,
      project_urls: process.env.FIGMA_PROJECT_URLS?.split(',') || [],
    };
  }

  private parseFileKey(input: string): string {
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

  private parseNodeIds(input: string): string[] {
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

  private parseTeamId(input: string): string {
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

  private resolveFileKey(input?: string): string {
    // Priority: input parameter > config default > error
    if (input) {
      return this.parseFileKey(input);
    }
    
    if (this.config.default_file_url) {
      return this.parseFileKey(this.config.default_file_url);
    }

    throw new McpError(
      ErrorCode.InvalidRequest,
      'No file key or URL provided. Either pass a file_key parameter or set default_file_url in config.'
    );
  }

  private resolveTeamId(input?: string): string {
    // Priority: input parameter > config default > error
    if (input) {
      return this.parseTeamId(input);
    }
    
    if (this.config.default_team_url) {
      return this.parseTeamId(this.config.default_team_url);
    }

    throw new McpError(
      ErrorCode.InvalidRequest,
      'No team ID or URL provided. Either pass a team_id parameter or set default_team_url in config.'
    );
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Custom Figma MCP server running on stdio');
  }
}

export { FigmaMCPServer };