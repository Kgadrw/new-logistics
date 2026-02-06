import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('❌ MongoDB connection error: MONGODB_URI is not defined in environment variables');
      console.error('Please create a .env file in the backend directory with:');
      console.error('MONGODB_URI=your_connection_string_here');
      process.exit(1);
    }

    console.log('🔄 Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(mongoURI, {
      // Remove deprecated options - mongoose 6+ handles these automatically
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    // Provide helpful troubleshooting information
    if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
      console.error('\n🔍 Troubleshooting steps:');
      console.error('1. Verify your MongoDB Atlas username and password are correct');
      console.error('2. Check if your IP address is whitelisted in MongoDB Atlas:');
      console.error('   - Go to MongoDB Atlas → Network Access → Add IP Address');
      console.error('   - Add "0.0.0.0/0" to allow all IPs (for development only)');
      console.error('3. Verify the database user exists and has proper permissions');
      console.error('4. Check if the password contains special characters that need URL encoding');
      console.error('\n💡 Connection string format:');
      console.error('   mongodb+srv://<username>:<password>@cluster0.anfwvi8.mongodb.net/<database>');
    }
    
    // Don't exit in development - allow server to continue (useful for testing without DB)
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️ Continuing without database connection (development mode)');
    }
  }
};

export default connectDB;
