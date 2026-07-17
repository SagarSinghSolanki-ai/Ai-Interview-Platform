import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/db.js';
import { Server } from 'http';

let server: Server;

const startServer = (): void => {
  server = app.listen(env.PORT, () => {
    console.log(`🚀 Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
};

const handleExit = async (error: Error, type: string): Promise<void> => {
  console.error(`💥 System error encountered: ${type}. Shutting down server...`);
  console.error(error);

  if (server) {
    server.close(async () => {
      console.log('💤 Express server closed.');
      await prisma.$disconnect();
      console.log('🔌 Database connections severed.');
      process.exit(1);
    });
  } else {
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Listen for syntax/ref errors that happen synchronously outside active requests
process.on('uncaughtException', (error) => {
  handleExit(error, 'uncaughtException');
});

// Capture unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  handleExit(reason instanceof Error ? reason : new Error(String(reason)), 'unhandledRejection');
});

startServer();
