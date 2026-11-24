// Load and validate environment configuration FIRST (before any dependent imports)
import { env } from './config/env.js';
import dns from 'dns';
import mongoose from 'mongoose';
import { createApp } from './app.js';

const app = createApp();
let server;

async function connectDatabase() {
  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  } catch (err) {
    if (err?.code === 'ECONNREFUSED' && err?.syscall === 'querySrv') {
      console.warn('⚠️  Local DNS refused MongoDB SRV lookup; retrying with public DNS resolvers...');
      dns.setServers(['8.8.8.8', '1.1.1.1']);
      await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    } else {
      throw err;
    }
  }
}

async function startServer() {
  if (!env.MONGODB_URI) {
    console.error('❌ FATAL: MONGODB_URI environment variable is not defined.');
    process.exit(1);
  }

  try {
    await connectDatabase();
    console.log('✅ Connected to MongoDB');

    server = app.listen(env.PORT, () => {
      console.log(`🏥 HealthCore Medical Center API listening on port ${env.PORT} (${env.NODE_ENV})`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.connection.close();
    console.log('✅ Clean shutdown complete');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err.message);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});

startServer();

export default app;
