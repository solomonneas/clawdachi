import http, { IncomingMessage, ServerResponse } from 'http';
import { BrowserWindow } from 'electron';
import { ClaudeSession, ClaudeStatus, IPC_CHANNELS } from '../shared/types';

const DEFAULT_PORT = 9876;

let server: http.Server | null = null;

/**
 * Start HTTP server for receiving remote state updates
 */
export function startRemoteServer(
  mainWindow: BrowserWindow,
  port: number = DEFAULT_PORT
): { port: number; stop: () => void } {
  server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
    // CORS headers for flexibility
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Health check endpoint
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', app: 'clawdachi' }));
      return;
    }

    // State update endpoint
    if (req.method === 'POST' && req.url === '/state') {
      let body = '';

      req.on('data', (chunk: Buffer) => {
        body += chunk.toString();
        // Limit body size to prevent abuse
        if (body.length > 10000) {
          res.writeHead(413);
          res.end('Payload too large');
          req.destroy();
        }
      });

      req.on('end', () => {
        try {
          const data = JSON.parse(body);

          // Validate and normalize the session data
          const session: ClaudeSession = {
            session_id: data.session_id || 'remote',
            status: validateStatus(data.status),
            timestamp: data.timestamp || Math.floor(Date.now() / 1000),
            cwd: data.cwd || 'remote',
            tty: data.tty || 'remote',
            tool_name: data.tool_name,
            message: data.message,
          };

          // Send to renderer
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send(IPC_CHANNELS.CLAUDE_STATE_CHANGE, session);
            console.log('[RemoteServer] State update:', session.status);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          console.error('[RemoteServer] Parse error:', error);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });

      return;
    }

    // Unknown endpoint
    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[RemoteServer] Listening on port ${port}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[RemoteServer] Port ${port} already in use`);
    } else {
      console.error('[RemoteServer] Error:', err);
    }
  });

  return {
    port,
    stop: () => stopRemoteServer(),
  };
}

/**
 * Stop the HTTP server
 */
export function stopRemoteServer(): void {
  if (server) {
    server.close();
    server = null;
    console.log('[RemoteServer] Stopped');
  }
}

/**
 * Validate status string
 */
function validateStatus(status: string): ClaudeStatus {
  const validStatuses: ClaudeStatus[] = [
    'idle',
    'thinking',
    'using-tool',
    'waiting',
    'completed',
    'error',
  ];

  if (validStatuses.includes(status as ClaudeStatus)) {
    return status as ClaudeStatus;
  }

  return 'idle';
}
