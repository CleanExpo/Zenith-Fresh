import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

export const initSocket = (res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('Client connected');

      socket.on('join-team', (teamId: string) => {
        socket.join(`team-${teamId}`);
      });

      socket.on('leave-team', (teamId: string) => {
        socket.leave(`team-${teamId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  }
  return res.socket.server.io;
};

export const emitTeamUpdate = (
  io: SocketIOServer,
  teamId: string,
  event: string,
  data: any
) => {
  io.to(`team-${teamId}`).emit(event, data);
}; 