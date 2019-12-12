const express = require('express');
const app = express();
const consolidate = require('consolidate');
const path = require('path');
const user = require('./models/user');
const event = require('./models/event');
const fs = require("fs");
const mustache = require("mustache-express");
const MongoClient = require('mongoose');
const calendar = require('./models/cakendarOfEvents');
const bcrypt = require('bcrypt');
const passport = require('passport');
const initializePassport = require('./passport-config');
const flash = require('express-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const router = express.Router();
const logger = require('morgan');
const jwt = require('jsonwebtoken');
const formData = require('express-form-data');

app.use(express.static(path.join(__dirname, 'build')));
app.use(formData.parse());
app.use(express.static('public'));
app.use(express.json());
app.engine('mst', mustache());
const viewsDir = path.join(__dirname, 'views');
app.engine("mst", mustache(path.join(viewsDir, "partials")));
app.set('views', viewsDir);
app.set('view engine', 'mst');
app.use(logger('dev'));


initializePassport(passport, user.getUserById);

app.use(express.urlencoded({ extended: false }));
app.use(flash());
MongoClient.set('useCreateIndex', true);

app.use(cookieParser("StRoNGs3crE7"));

app.use(session({
    secret: "ss",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/api', require('./routers/api'));

const port = process.env.port || 4000;

const url = 'mongodb+srv://user-lab6:21212323@cluster0-qsysn.mongodb.net/test?retryWrites=true&w=majority' || 'mongodb://localhost:27017/labs-db';  // Connection URL
const conOptions = { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false };  // Connection options

MongoClient.connect(url, conOptions)
    .then((client) => {
        console.log(`Successfully connected to database server at ${url}`);
        app.listen(port, (err) => {
            if (err)
                return new Promise.reject(err);
            else
                console.log(`Listening port ${port} ...\n`);
        });
    })
    .catch(err => {
        console.log(err);
    });

app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
})


