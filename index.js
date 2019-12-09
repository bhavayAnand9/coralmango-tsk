const express = require("express");
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const config = require('./config');

//middlewares
app.use(bodyParser.json());
app.use(multer({dest: "uploads"}).single('file'));
app.use(cors());

//routes
const userRoutes = require('./routes/user');
const fileRoutes = require('./routes/file');

app.use(express.static(path.join(__dirname, './frontend/dist/')));
app.get('/', (req, res)=> {
    res.send('working');
});
app.use('/user', userRoutes.routes);
app.use('/file', fileRoutes.routes);

app.get('*', (req, res) => {
   return res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

mongoose.connect(config.TEST_MONGODB_URI, {useNewUrlParser: true, useCreateIndex: true})
    .then(result => {
        console.log('Mongoose connected');
        const server = app.listen(config.PORT, (err)=>{
            if(err) throw err;
            else console.log(`Server listening to requests on PORT ${config.PORT}`)
        });
    });

module.exports = app;
