import app from './app.js';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';

async function startServer() {
  try {
    await connectDB();

    const server = app.listen(ENV.PORT, () => {
      console.log(`====================================================`);
      console.log(`🛡️  BRANDTRACE API Server running on port ${ENV.PORT}`);
      console.log(`🌐 Environment: ${ENV.NODE_ENV}`);
      console.log(`🔗 Detection microservice URL: ${ENV.DETECTION_SERVICE_URL}`);
      console.log(`====================================================`);
    });

    const shutdown = () => {
      console.log('\nShutting down BRANDTRACE server gracefully...');
      server.close(() => {
        console.log('Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
