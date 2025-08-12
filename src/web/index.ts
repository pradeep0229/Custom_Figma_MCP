#!/usr/bin/env node

import 'dotenv/config';
// @ts-ignore - TypeScript file
import { startHttpServer } from './http-server.js';
import { getAppConfig } from '../config/config.js';

const config = getAppConfig();

startHttpServer(config.port as number).catch((error: any) => {
  console.error('Failed to start HTTP server:', error);
  process.exit(1);
}); 