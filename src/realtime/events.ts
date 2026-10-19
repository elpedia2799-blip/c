import { Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';

export interface RealtimeEvent {
  type: string;
  payload: any;
  timestamp: string;
}

class RealtimeHub {
  private sseClients: Set<Response> = new Set();
  private wsClients: Set<WebSocket> = new Set();

  public addSseClient(res: Response) {
    this.sseClients.add(res);
    res.on('close', () => {
      this.sseClients.delete(res);
    });
  }

  public attachWebSocketServer(wss: WebSocketServer) {
    wss.on('connection', (ws: WebSocket) => {
      this.wsClients.add(ws);
      ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));

      ws.on('close', () => {
        this.wsClients.delete(ws);
      });
      ws.on('error', () => {
        this.wsClients.delete(ws);
      });
    });
  }

  public broadcast(type: string, payload: any) {
    const event: RealtimeEvent = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    const sseFormatted = `event: ${type}\ndata: ${JSON.stringify(event)}\n\n`;

    // Broadcast to SSE clients
    for (const client of this.sseClients) {
      try {
        client.write(sseFormatted);
      } catch (err) {
        this.sseClients.delete(client);
      }
    }

    // Broadcast to WebSocket clients
    const wsFormatted = JSON.stringify(event);
    for (const ws of this.wsClients) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(wsFormatted);
        } catch (err) {
          this.wsClients.delete(ws);
        }
      }
    }
  }
}

export const realtimeHub = new RealtimeHub();
