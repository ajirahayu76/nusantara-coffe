import { Response } from 'express';

type Client = {
  id: string;
  res: Response;
};

class RealtimeHub {
  private clients: Client[] = [];

  addClient(id: string, res: Response) {
    this.clients.push({ id, res });
    // Keep connection alive with heartbeat comment every 25 seconds
    const interval = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 25000);

    res.on('close', () => {
      clearInterval(interval);
      this.removeClient(id);
    });
  }

  removeClient(id: string) {
    this.clients = this.clients.filter(c => c.id !== id);
  }

  broadcast(eventType: string, data: any) {
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients) {
      try {
        client.res.write(payload);
      } catch (err) {
        console.error('Failed to send SSE to client', client.id, err);
      }
    }
  }

  getClientCount() {
    return this.clients.length;
  }
}

export const realtimeHub = new RealtimeHub();
