import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error during MongoDB disconnection:', err);
        process.exit(1);
      }
    });

  } catch (error: any) {
    // Provide clearer guidance for common connection failures
    console.error('Error connecting to MongoDB:', error);

    const code = error?.code;
    const codeName = error?.codeName;
    const errmsg = error?.errorResponse?.errmsg || error?.message;

    // Bad auth / invalid credentials
    if (code === 8000 || codeName === 'AtlasError' || /bad auth|authentication failed/i.test(errmsg || '')) {
      console.error('[MongoDB] Authentication failed. Please verify:');
      console.error('- Database user exists in Atlas and has correct role (Read/Write).');
      console.error('- Username and PASSWORD in your MONGODB_URI are correct.');
      console.error('- If your password contains special characters (@:/?&=#), URL-encode it.');
      console.error('- The cluster host in your URI matches Atlas (e.g., cluster0.xxxxxx.mongodb.net).');
    }

    // Network/IP access list issues
    if (/IP address|not in whitelist|timed out|ECONNREFUSED|ENOTFOUND|DNS/i.test(errmsg || '')) {
      console.error('[MongoDB] Network or IP access issue. Please check:');
      console.error('- Atlas Network Access: add your current IP or use 0.0.0.0/0 for testing.');
      console.error('- Local network allows outbound connections to MongoDB Atlas.');
      console.error('- DNS resolves your cluster host.');
    }

    throw error;
  }
};
