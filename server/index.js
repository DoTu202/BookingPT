const express = require('express')
const cors = require('cors')
const app = express()
const authRouter = require('./routers/authRouter')


const PORT = 3001;

app.use(express.json());
app.use(cors());

//api
app.use('/auth', authRouter)

app.listen(PORT, (err) => {
    if (err) {
        console.error('Error starting server:', err);
    } else {
        console.log(`Server is running on http://localhost:${PORT}`);
    }
}
);