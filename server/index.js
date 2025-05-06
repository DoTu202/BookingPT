const express = require('express')
const cors = require('cors')
const app = express()
const authRouter = require('./src/routers/authRouter')
const connectDB = require('./src/configs/connectDB')
const dotenv = require('dotenv')
dotenv.config()



const PORT = 3001;

app.use(express.json());
app.use(cors());



//api
app.use('/auth', authRouter)


connectDB();

app.listen(PORT, (err) => {
    if (err) {
        console.error('Error starting server:', err);
    } else {
        console.log(`Server is running on http://localhost:${PORT}`);
    }
}
);