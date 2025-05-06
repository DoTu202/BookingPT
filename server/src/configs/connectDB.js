require('dotenv').config();

const { mongoose } = require('mongoose');




const dbURL = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.zgfg3pd.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

// const dbURL = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.zgfg3pd.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(dbURL); 
        console.log('connected to DB');
       
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};


module.exports = connectDB;
