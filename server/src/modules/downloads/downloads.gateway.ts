import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { QbittorrentService } from './qbittorrent.service';

@WebSocketGateway({
  namespace: 'downloads',
  cors: { origin: 'http://localhost:5172', credentials: true },
})
export class DownloadsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private updateInterval: NodeJS.Timeout;
  private connectedClients = 0;

  constructor(private readonly qbittorrentService: QbittorrentService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.connectedClients++;
    this.startUpdates();
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedClients--;
    if (this.connectedClients <= 0) {
      this.stopUpdates();
    }
  }

  private startUpdates() {
    if (this.updateInterval) return;

    this.updateInterval = setInterval(async () => {
      try {
        const torrents = await this.qbittorrentService.getTorrents();
        this.server.emit('download_progress', {
          type: 'download_progress',
          data: torrents
        });
      } catch (error) {
        console.error('Failed to get torrent updates:', error);
      }
    }, 2000);
  }

  private stopUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}