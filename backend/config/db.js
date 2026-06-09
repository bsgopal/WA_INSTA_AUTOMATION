// renic-automation-backend/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.NODE_ENV === 'development' 
      ? process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/renic-automation'
      : process.env.MONGODB_ATLAS_URI;

    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;