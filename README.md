# Custom Figma MCP Server

A Model Context Protocol (MCP) server that provides integration with the Figma API, allowing AI assistants to interact with Figma files, components, and assets.

## Features

- **File Access**: Get detailed information about Figma files including structure and metadata
- **Component Management**: Retrieve all components from Figma files
- **Asset Export**: Export images from specific nodes in various formats (PNG, JPG, SVG, PDF)
- **Team Management**: Access team projects and search for files
- **Secure Authentication**: Uses Figma API tokens for secure access

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd Custom_Figma_MCP
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Configuration

1. Get your Figma access token:
   - Go to [Figma Account Settings](https://www.figma.com/developers/api#access-tokens)
   - Generate a new personal access token

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your Figma access token
```

## Usage

### Running the Server

```bash
npm run build
node build/index.js
```

### Available Tools

#### 1. `get_figma_file`
Get comprehensive information about a Figma file.

**Parameters:**
- `file_key` (string): The Figma file key found in the URL

**Example:**
```json
{
  "file_key": "ABC123DEF456"
}
```

#### 2. `get_figma_components`
Retrieve all components from a Figma file.

**Parameters:**
- `file_key` (string): The Figma file key found in the URL

#### 3. `export_figma_image`
Export images from specific nodes in a Figma file.

**Parameters:**
- `file_key` (string): The Figma file key
- `node_ids` (array): Array of node IDs to export
- `format` (string, optional): Export format (jpg, png, svg, pdf). Default: png
- `scale` (number, optional): Scale factor (1-4). Default: 1

**Example:**
```json
{
  "file_key": "ABC123DEF456",
  "node_ids": ["1:2", "1:3"],
  "format": "png",
  "scale": 2
}
```

#### 4. `get_figma_team_projects`
Get all projects for a specific team.

**Parameters:**
- `team_id` (string): The Figma team ID

#### 5. `search_figma_files`
Search for files in a Figma team.

**Parameters:**
- `team_id` (string): The Figma team ID
- `query` (string, optional): Search query

#### 6. `get_figma_styles`
Get all design styles (colors, typography, effects, grids) from a Figma file.

**Parameters:**
- `file_key` (string): The Figma file key found in the URL

#### 7. `analyze_figma_design_system`
Comprehensive analysis of the design system including components, styles, and structure.

**Parameters:**
- `file_key` (string): The Figma file key
- `include_components` (boolean, optional): Include component analysis. Default: true
- `include_styles` (boolean, optional): Include style analysis. Default: true

**Example:**
```json
{
  "file_key": "ABC123DEF456",
  "include_components": true,
  "include_styles": true
}
```

#### 8. `get_figma_version_history`
Get version history and comments for a Figma file.

**Parameters:**
- `file_key` (string): The Figma file key found in the URL

---

## 🔄 **Component Reusability Tools**

#### 9. `map_figma_to_code_components`
**Intelligently map Figma components to existing code components** - Perfect for reusing your existing codebase!

**Parameters:**
- `file_key` (string): The Figma file key
- `code_directory` (string): Path to your components directory (e.g., `./src/components`)
- `framework` (string, optional): Frontend framework (`react`, `vue`, `angular`, `svelte`, `vanilla`). Default: `react`
- `include_props_analysis` (boolean, optional): Analyze component properties and variants. Default: `true`

**Example:**
```json
{
  "file_key": "ABC123DEF456",
  "code_directory": "./src/components",
  "framework": "react",
  "include_props_analysis": true
}
```

**What it does:**
- 🔍 Scans your existing components directory
- 🎯 Finds exact matches between Figma and code component names
- 🤖 Suggests similar components that could be reused with modifications
- 📊 Identifies missing components that need to be built
- 📈 Provides confidence scores for component mappings

#### 10. `generate_component_usage_guide`
Generate comprehensive usage guides for reusing existing components based on Figma designs.

**Parameters:**
- `file_key` (string): The Figma file key
- `component_mappings` (object, optional): Manual mappings between Figma and code components
- `output_format` (string, optional): Output format (`markdown`, `json`, `typescript`). Default: `markdown`

#### 11. `analyze_design_code_consistency`
Compare Figma designs with existing code to identify inconsistencies and optimization opportunities.

**Parameters:**
- `file_key` (string): The Figma file key
- `code_directory` (string): Path to your components directory
- `check_styles` (boolean, optional): Check style consistency. Default: `true`
- `check_components` (boolean, optional): Check component consistency. Default: `true`

---

## 🚀 **Real-World Usage Example**

Here's how the LLM can use your existing components when you have a partially built application:

### **Scenario**: You have a React app with existing components and want to implement new Figma designs

```bash
# 1. First, map your Figma components to existing code
custom-figma-mcp map_figma_to_code_components \
  --file_key "ABC123DEF456" \
  --code_directory "./src/components" \
  --framework "react"

# Response might show:
# ✅ Exact matches: Button, Card, Modal (reuse directly!)
# 🔄 Similar matches: HeaderNav → Navbar (modify existing)
# ❌ Missing: ProductGrid, UserProfile (need to build)
```

**The LLM can then:**
- ✅ **Reuse existing components** for exact matches
- 🔄 **Modify existing components** for similar matches  
- 🏗️ **Build only missing components** instead of everything from scratch
- 📐 **Maintain consistency** with your existing design system

### **LLM Workflow Integration:**
1. **Analyze**: `map_figma_to_code_components` → Understand what exists
2. **Guide**: `generate_component_usage_guide` → Get implementation roadmap  
3. **Validate**: `analyze_design_code_consistency` → Ensure alignment
4. **Implement**: Use existing components + build missing ones

---

## Finding Figma IDs

### File Key
The file key can be found in the Figma URL:
```
https://www.figma.com/file/ABC123DEF456/File-Name
                        ^^^^^^^^^^^^
                        This is the file key
```

### Node IDs
Node IDs can be found by:
1. Right-clicking on an element in Figma
2. Selecting "Copy/Paste as" → "Copy link"
3. The node ID is in the URL after `node-id=`

### Team ID
Team IDs can be found in the Figma URL when viewing team projects:
```
https://www.figma.com/files/team/123456789/Team-Name
                              ^^^^^^^^^
                              This is the team ID
```

## Development

### Project Structure
```
src/
  └── index.ts          # Main MCP server implementation
build/                  # Compiled JavaScript output
package.json           # Dependencies and scripts
tsconfig.json          # TypeScript configuration
```

### Building
```bash
npm run build
```

### Testing
The server communicates via stdio. You can test it by running:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node build/index.js
```

## Error Handling

The server includes comprehensive error handling for:
- Missing or invalid Figma access tokens
- Invalid file keys or node IDs
- Network errors and API rate limits
- Malformed requests

## 📚 **Detailed Technical Documentation**

For comprehensive technical details about how each tool works and how LLMs interact with them, see:

**📖 [TOOLS_DOCUMENTATION.md](./TOOLS_DOCUMENTATION.md)**

This includes:
- **Technical Implementation Details**: How each tool works under the hood
- **LLM Integration Patterns**: How LLMs understand and use the tools
- **Code Analysis Algorithms**: Component matching and similarity calculations
- **API Integration Details**: Figma API usage and authentication flows
- **Framework Support**: How different frontend frameworks are handled
- **Best Practices**: Optimization and error handling strategies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License - see package.json for details 