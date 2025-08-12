// Figma API Types
export interface FigmaConfig {
  default_file_url?: string;
  default_team_url?: string;
  project_urls?: string[];
}

export interface FigmaFile {
  name: string;
  version: string;
  lastModified: string;
  document: FigmaDocument;
  components: Record<string, FigmaComponent>;
  componentSets: Record<string, FigmaComponentSet>;
  styles: Record<string, FigmaStyle>;
}

export interface FigmaDocument {
  id: string;
  name: string;
  type: string;
  children: FigmaNode[];
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  fills?: FigmaFill[];
  strokes?: FigmaStroke[];
  effects?: FigmaEffect[];
  absoluteBoundingBox?: FigmaBoundingBox;
  constraints?: FigmaConstraints;
  layoutMode?: string;
  layoutAlign?: string;
  layoutGrow?: number;
  layoutSizingHorizontal?: string;
  layoutSizingVertical?: string;
  itemSpacing?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
}

export interface FigmaComponent {
  key: string;
  name: string;
  description: string;
  componentSetId?: string;
  documentationLinks: FigmaDocumentationLink[];
}

export interface FigmaComponentSet {
  key: string;
  name: string;
  description: string;
}

export interface FigmaStyle {
  key: string;
  name: string;
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
  description: string;
  remote: boolean;
}

export interface FigmaFill {
  blendMode: string;
  type: string;
  color?: FigmaColor;
  gradientHandlePositions?: FigmaVector[];
  gradientStops?: FigmaGradientStop[];
  scaleMode?: string;
  imageRef?: string;
}

export interface FigmaStroke {
  blendMode: string;
  type: string;
  color: FigmaColor;
}

export interface FigmaEffect {
  type: string;
  visible: boolean;
  radius: number;
  color: FigmaColor;
  blendMode: string;
  offset: FigmaVector;
  spread?: number;
  showShadowBehindNode?: boolean;
}

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FigmaVector {
  x: number;
  y: number;
}

export interface FigmaGradientStop {
  color: FigmaColor;
  position: number;
}

export interface FigmaBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FigmaConstraints {
  vertical: string;
  horizontal: string;
}

export interface FigmaDocumentationLink {
  uri: string;
}

export interface FigmaExportSettings {
  suffix: string;
  format: 'JPG' | 'PNG' | 'SVG' | 'PDF';
  constraint: {
    type: 'SCALE' | 'WIDTH' | 'HEIGHT';
    value: number;
  };
}

export interface FigmaImageResponse {
  images: Record<string, string>;
  status?: number;
  err?: string;
}

// Component Analysis Types
export interface ComponentMapping {
  figma_id: string;
  figma_name: string;
  code_component?: CodeComponent;
  confidence: number;
  status: 'exact_match' | 'similar_match' | 'missing_in_code';
}

export interface CodeComponent {
  name: string;
  path: string;
  framework: string;
  size: number;
  exports: string[];
  props: string[];
}

export interface ComponentMappingResult {
  exact_matches: ComponentMapping[];
  similar_matches: ComponentMapping[];
  missing_in_code: FigmaComponent[];
  missing_in_figma: CodeComponent[];
}

export interface DesignSystemAnalysis {
  file_key: string;
  analysis_timestamp: string;
  design_system: {
    file_info: {
      name: string;
      version: string;
      lastModified: string;
      pages: number;
    };
    components?: {
      count: number;
      components: Record<string, FigmaComponent>;
    };
    styles?: {
      count: number;
      styles: Record<string, FigmaStyle>;
    };
    structure?: {
      pages: Array<{
        name: string;
        type: string;
        children_count: number;
        frames: number;
      }>;
    };
  };
}

// MCP Response Types
export interface MCPToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
} 