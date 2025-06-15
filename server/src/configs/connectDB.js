require('dotenv').config();

const { mongoose } = require('mongoose');




const dbURL = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.zgfg3pd.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

// Local MongoDB (uncomment if you want to use local)
// const dbURL = 'mongodb://localhost:27017/fitness-app';

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(dbURL, {
            serverSelectionTimeoutMS: 30000, // 30 seconds timeout
            connectTimeoutMS: 30000,
            socketTimeoutMS: 30000,
        }); 
        console.log('Connected to MongoDB:', connection.connection.name);
       
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};


module.exports = connectDB;
