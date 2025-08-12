// @ts-nocheck
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { spawn } from 'child_process';

const app = express();
const PORT = process.env.PORT || 3000;
const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    hasToken: !!FIGMA_TOKEN 
  });
});

// Serve a simple web interface
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Figma MCP Server</title></head>
      <body>
        <h1>🎨 Custom Figma MCP Server</h1>
        <p><strong>Status:</strong> Running</p>
        <p><strong>File Key:</strong> B6Vm4ntBjI08oWreSfnBhT</p>
        
        <h2>Available Endpoints:</h2>
        <ul>
          <li><a href="/api/tools">GET /api/tools</a> - List all tools</li>
          <li><a href="/api/file">GET /api/file</a> - Get Figma file data</li>
          <li><a href="/api/components">GET /api/components</a> - Get components</li>
        </ul>
        
        <h2>Test MCP Communication:</h2>
        <button onclick="testTools()">Test Tools List</button>
        <pre id="result"></pre>
        
        <script>
          async function testTools() {
            const response = await fetch('/api/tools');
            const data = await response.json();
            document.getElementById('result').textContent = JSON.stringify(data, null, 2);
          }
        </script>
      </body>
    </html>
  `);
});

// API endpoints that communicate with MCP server
app.get('/api/tools', async (req, res) => {
  try {
    const result = await callMCPServer('tools/list', {});
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/file', async (req, res) => {
  try {
    const result = await callMCPServer('tools/call', {
      name: 'get_figma_file',
      arguments: {}
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/components', async (req, res) => {
  try {
    const result = await callMCPServer('tools/call', {
      name: 'get_figma_components',
      arguments: { file_key: 'B6Vm4ntBjI08oWreSfnBhT' }
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Function to communicate with MCP server
function callMCPServer(method: string, params: any) {
  return new Promise((resolve, reject) => {
    const mcpProcess = spawn('node', ['build/index.js'], {
      env: {
        ...process.env,
        FIGMA_ACCESS_TOKEN: FIGMA_TOKEN
      }
    });

    let output = '';
    let errorOutput = '';

    mcpProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    mcpProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    mcpProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`MCP server exited with code ${code}: ${errorOutput}`));
        return;
      }

      try {
        // Parse the JSON-RPC response
        const lines = output.split('\n').filter(line => line.trim());
        const jsonResponse = lines.find(line => {
          try {
            const parsed = JSON.parse(line);
            return parsed.jsonrpc === '2.0';
          } catch {
            return false;
          }
        });

        if (jsonResponse) {
          resolve(JSON.parse(jsonResponse));
        } else {
          reject(new Error('No valid JSON-RPC response found'));
        }
      } catch (error) {
        reject(error);
      }
    });

    // Send the JSON-RPC request
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    };

    mcpProcess.stdin.write(JSON.stringify(request) + '\n');
    mcpProcess.stdin.end();
  });
}

export function startHttpServer(port: number = PORT) {
  return new Promise<void>((resolve) => {
    app.listen(port, () => {
      console.log(`🌐 Figma MCP Web Interface running at: http://localhost:${port}`);
      console.log(`📡 MCP Server communication via stdio`);
      resolve();
    });
  });
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startHttpServer().catch(console.error);
} 