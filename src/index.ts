#!/usr/bin/env node

import 'dotenv/config';
import { FigmaMCPServer } from './server/mcp-server.js';

// Start the MCP server.
const server = new FigmaMCPServer();
server.run().catch((error: any) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
}); 