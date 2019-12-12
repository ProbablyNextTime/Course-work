const express = require('express');
const user = require('../models/user');
const passport = require('passport');
const event = require('../models/event');
const calendar = require('../models/cakendarOfEvents');
const bcrypt = require('bcrypt');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bot = require('../telegramBot');
const cron = require("node-cron");
const moment = require('moment');
const schedule = require('node-schedule');

const cloudinary = require('cloudinary');
const cloudinaryStorage = require('multer-storage-cloudinary');
const multer = require("multer");


router.use(express.urlencoded({ extended: false }));

cloudinary.config({
    cloud_name: "drkgnohds",
    api_key: "842838978582521",
    api_secret: "I0U0z120riWu9TaaTVmEHDVjvaw"
});

const storage = cloudinaryStorage({
    cloudinary: cloudinary,
    folder: "lab7",
    allowedFormats: ["jpg", "png"],
    transformation: [{ width: 500, height: 500, crop: "limit" }]
});

let notifications = new Map([]);

const parser = multer({ storage: storage });


function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        console.log("pizxda");
        return next();
    }

    console.log("xyi");
    res.status(401).send("");
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        console.log("here");
        return res.status(401).send("");
    }
    console.log("here1");
    next();
}

function checkAdmin(req, res, next) {
    if (req.user.role)
        return next();

    res.status(403).send("Forbiden");
}

router.get('/v1/logout', (req, res) => {
    res.clearCookie('jwt').send("");
})

router.post('/v1/userauth', checkNotAuthenticated, async (req, res) => {
    user.findUserByLogin(req.body.login)
        .then(user => {
            if (user) {
                return Promise.all([bcrypt.compare(req.body.password, user.password), user]);
            } else
                return null;
        })
        .then(success => {
            if (!success || !(success[0]))
                res.send({ user: null })
            else {
                jwt.sign({ user: success[1] }, 'StRoNGs3crE7', (err, token) => {
                    // Send Set-Cookie header
                    res.cookie('jwt', token, {
                        httpOnly: true,
                        sameSite: true,
                        signed: true
                    });
                    if (success[1].telegramChatId) {
                        let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                        bot.sendMessage(success[1].telegramChatId, `You have just logged in from IP :` + ip + ".\nIf it is not you change your password");
                    }
                    res.send({ user: success[1] })
                });
            }


        })
        .catch(err => console.log(err));
})

router.post('/v1/user', checkNotAuthenticated, parser.single('avaUrl'), (req, res) => {
    if (req.body.password && req.body.login) {
        Promise.all([user.findUserByLogin(req.body.login), bcrypt.hash(req.body.password, 10)])
            .then((data) => {
                if (!data[0]) {
                    let newUser = new user(req.body.login, data[1]);

                    if (req.body.bio)
                        newUser.bio = req.body.bio;

                    if (req.body.fullname)
                        newUser.fullname = req.body.fullname;

                    if (req.file)
                        newUser.avaUrl = req.file.url;

                    return user.insert(newUser);
                }
            })
            .then((resault) => {
                if (!resault)
                    res.status(400).send({ message: 'Such login exists' });
                else
                    res.status(201).send(resault);
            })
            .catch(err => {
                res.status(500).send({ message: "Server error" });
            })
    } else
        res.status(400).send({ message: "Bad request" });
})

router.use(passport.authenticate('jwt', { session: false }));

router.get('/v1/users', checkAuthenticated, checkAdmin, (req, res) => {
    // bot.sendMessage(req.user.)
    let limit = 5;
    let page = 1;
    let searchString = '';

    if (req.query.limit && req.query.limit < 100)
        limit = parseInt(req.query.limit);

    if (req.query.page)
        page = parseInt(req.query.page);

    if (req.query.search)
        searchString = req.query.search;

    if (limit <= 0 || page <= 0)
        res.status(400).send({ message: "Bad request" });
    else
        user.getUsers(limit, page, searchString)
            .then(usersData => {
                console.log(usersData);
                if (usersData.users.length == 0)
                    res.status(200).send(usersData);
                else
                    res.status(200).send(usersData);
            })
            .catch(err => res.status(500).send({ message: 'Server error' }))
})

router.get('/v1/user/:id', checkAuthenticated, (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id) && req.params.id)
        res.status(404).send({ message: "Bad request" });
    else
        user.getUserById(req.params.id)
            .then(user => {
                if (user)
                    res.status(200).send(user);
                else
                    res.status(404).send({ message: "Not found" });
            })
            .catch(err => {
                res.status(500).send({ message: "Server error" });
            });
})


router.delete('/v1/user/:id', checkAuthenticated, checkAdmin, (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id) && req.params.id)
        res.status(400).send({ message: "Bad request" });
    else
        user.deleteUserById(req.params.id)
            .then((success) => {
                if (success)
                    res.status(204).send();
                else
                    res.status(404).send({ message: "Not found" })
            })
            .catch(err => res.status(500).send({ message: "Server error" }));
})

router.put('/v1/user/:id', checkAuthenticated, async (req, res) => {
    let image = Object.values(req.files);
    let uploadedImage = undefined;
    try {
        if (image.length !== 0)
            uploadedImage = await cloudinary.uploader.upload(image[0].path);

        if (!mongoose.Types.ObjectId.isValid(req.params.id) && req.params.id)
            res.status(400).send({ message: "Bad request" });
        else
            user.getUserById(req.params.id)
                .then(user => {
                    if (user) {
                        if (req.body.bio)
                            user.bio = req.body.bio;

                        if (req.body.fullname)
                            user.fullname = req.body.fullname;

                        if (image.length !== 0)
                            user.avaUrl = uploadedImage.secure_url;


                        if (req.body.role == 1 || req.body.role == 0)
                            user.role = req.body.role;

                        if (req.body.telegram)
                            user.telegramLogin = req.body.telegram;

                        if (req.body.isDisabled)
                            user.isDisabled = req.body.isDisabled;

                        return user.update(user);
                    } else
                        return undefined;
                })
                .then((success) => {
                    if (success)
                        return user.getUserById(req.params.id);
                    else
                        return undefined;
                })
                .then(updUser => {
                    if (updUser)
                        res.status(200).send(updUser);
                    else
                        res.status(404).send({ message: "Not found" });
                })
                .catch(err => { res.status(500).send({ message: "Server error" }); console.log(err); });

    } catch (err) {
        console.log(err);
    }
})


router.get('/v1/events', checkAuthenticated, (req, res) => {
    let limit = 5;
    let page = 1;
    let search = '';

    if (req.query.limit)
        limit = req.query.limit;

    if (req.query.page)
        page = req.query.page;

    if (req.query.search)
        search = req.query.search;

    if (limit <= 0 || page <= 0)
        res.status(400).send({ message: "Bad request" });
    else
        user.getUsersEvents(req.user.id, limit, page - 1, search)
            .then(events => {
                if (events.length === 0)
                    res.status(404).send({ message: "Not found" });
                else
                    res.status(200).send({ events: events.items, count: events.itemsCount });
            })
            .catch(err => { res.status(500).send({ message: "Server error" }); console.log(err); });
})

router.get('/v1/events/:id', checkAuthenticated, (req, res) => {
    console.log(req.params.id, req.user.events);
    if (!mongoose.Types.ObjectId.isValid(req.params.id) && req.params.id)
        res.status(404).send({ message: "Not Found" });
    else
        user.getUserById(req.user.id)
            .then(user => {
                return event.getEventByIdApi(user.events, req.params.id);
            })
            .then(event => {
                console.log(event);
                if (event)
                    res.status(200).send(event);
                else
                    res.status(404).send({ message: "Not found" });
            })
            .catch(err => res.status(500).send({ message: "Server error" }));
})

router.post('/v1/events', checkAuthenticated, async (req, res) => {
    let image = Object.values(req.files);
    let uploadedImage = undefined;
    try {
        if (image.length !== 0)
            uploadedImage = await cloudinary.uploader.upload(image[0].path);

        let newEvent = new event();

        if (req.body.name)
            newEvent.name = req.body.name;

        if (req.body.description)
            newEvent.description = req.body.description;

        if (req.body.deadline)
            newEvent.deadLine = req.body.deadline;

        if (req.body.difficulty)
            newEvent.difficulty = req.body.difficulty;

        if (image.length !== 0)
            newEvent.themeUrl = uploadedImage.secure_url;

        let fetchedUser = await user.getUserById(req.user.id);


        let date = moment(newEvent.deadLine);
        let schDate = new Date(parseInt(date.year()), parseInt(date.month()), parseInt(date.date()), parseInt(date.hour()), parseInt(date.minute()));

        event.insertEvent(newEvent)
            .then(insEvent => Promise.all([user.insertEvent(req.user.id, insEvent.id), insEvent]))
            .then(resault => {
                let scheduleItem;
                if (fetchedUser.telegramChatId)
                    scheduleItem = schedule.scheduleJob(resault[1].id, schDate, function () {
                        bot.sendMessage(fetchedUser.telegramChatId, `Event: ${newEvent.name} is failed.\nYou lost!!`);
                        let eventDel = resault[1];
                        eventDel.status = -1;
                        event.update(eventDel);
                    });
                res.status(201).send(resault[1])
            })
            .catch(err => {
                res.status(500).send({ message: "Server error" })
                console.log(err);
            });
    } catch (err) {
        console.log(err);
    }
})

router.delete('/v1/events/:id', checkAuthenticated, (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id) && req.params.id)
        res.status(400).send({ message: "Bad request" });
    else
        Promise.all([event.getEventById(req.params.id), user.getUserById(req.user)])
            .then((res) => {
                return Promise.all([event.deleteEventById(req.params.id), user.deleteEvent(req.user.id, req.params.id), calendar.clearUp(req.params.id), res[0].status, res[1]]);
            })
            .then(resault => {
                if (resault[0].deletedCount == 0)
                    res.status(400).send({ message: "Bad request" });
                else {
                    if (resault[3].telegramChatId && resault[2] ==  0) {
                        let my_job = schedule.scheduledJobs[req.params.id];
                        my_job.cancel();
                    }
                    res.status(204).send();
                }
            })
            .catch(err => {console.log(err);res.status(500).send({ message: "Server error" })});
})

router.put('/v1/events/:id', checkAuthenticated, async (req, res) => {
    let image = Object.values(req.files);
    let uploadedImage = undefined;
    try {
        if (image.length !== 0)
            uploadedImage = await cloudinary.uploader.upload(image[0].path);

        let fetchedUser = await user.getUserById(req.user.id);

        if (!mongoose.Types.ObjectId.isValid(req.params.id) && req.params.id)
            res.status(400).send({ message: "Bad request" });
        else
            event.getEventById(req.params.id)
                .then(event => {
                    if (event) {

                        if (req.body.name)
                            event.name = req.body.name;

                        if (req.body.description)
                            event.description = req.body.description;

                        if (image.length !== 0)
                            event.themeUrl = uploadedImage.secure_url;

                        if (parseInt(req.body.difficulty) >= 0 && parseInt(req.body.difficulty) <= 10)
                            event.difficulty = parseInt(req.body.difficulty);

                        if (parseInt(req.body.status) >= -1 && parseInt(req.body.status) <= 1){
                            event.status = parseInt(req.body.status);
                            if(parseInt(req.body.status) == 1){
                                let my_job = schedule.scheduledJobs[req.params.id];
                                my_job.cancel();
                            }
                        }

                        if (req.body.deadline)
                            event.deadLine = req.body.deadline;

                        return event.update(event);
                    } else
                        return undefined;
                })
                .then(success => {
                    if (success)
                        return event.getEventById(req.params.id)
                    else
                        return undefined
                })
                .then(updEvent => {
                    if (updEvent) {
                        console.log("here", fetchedUser.telegramChatId, updEvent.status);
                        if (fetchedUser.telegramChatId && updEvent.status == 0) {
                            console.log("here");
                            let my_job = schedule.scheduledJobs[req.params.id];
                            my_job.cancel();
                            let date = moment(updEvent.deadLine);
                            let schDate = new Date(parseInt(date.year()), parseInt(date.month()), parseInt(date.date()), parseInt(date.hour()), parseInt(date.minute()));
                            let scheduleItem = schedule.scheduleJob(req.params.id, schDate, function () {
                                bot.sendMessage(fetchedUser.telegramChatId, `Event: ${updEvent.name} is failed.\nYou lost!!`);
                                let eventDel = updEvent;
                                eventDel.status = -1;
                                event.update(eventDel);
                            });
                        }
                        res.status(200).send(updEvent);
                    }
                    else
                        res.status(404).send({ message: "Not found" });
                })
                .catch(err => { console.log(err); res.status(500).send({ message: "Server error" }) });
    } catch (err) {
        console.log(err);
    }
})

router.get('/v1/calendars/:id', checkAuthenticated, (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id) && req.params.id)
        res.status(404).send({ message: "Not Found" });
    else
        user.getUserById(req.user.id)
            .then(user => {
                return Promise.all([calendar.getCalendarByIdApi(user.calendars, req.params.id), user.events])
            })
            .then(data => {
                let ids = [];
                if (data[0]) {
                    for (let event of data[0].events) {
                        ids.push(event._id);
                    }
                    return Promise.all([event.getNotAssignedEvents(ids, data[1]), data[0]]);
                }
                else
                    return undefined;
            })
            .then(calendarData => {
                if (calendarData) {
                    let ongoingEv = [];
                    for (let i = 0; i < calendarData[0].length; i++)
                        if (calendarData[0][i].status == 0)
                            ongoingEv.push(calendarData[0][i]);
                    res.status(200).send({ calendar: calendarData[1], notCalendarEvents: ongoingEv });
                }
                else
                    res.status(404).send({ message: "Not found" });
            })
            .catch(err => { res.status(500).send({ message: "Server error" }); console.log(err) });
})
router.get('/v1/calendars', checkAuthenticated, (req, res) => {
    let limit = 5;
    let page = 1;
    let search = '';

    if (req.query.limit)
        limit = req.query.limit;

    if (req.query.page)
        page = req.query.page;

    if (req.query.search)
        search = req.query.search;

    if (limit <= 0 || page <= 0)
        res.status(400).send({ message: "Bad request" });
    else
        user.getUsersCalendarsApi(req.user.id, limit, page - 1, search)
            .then(calendarsData => {
                if (calendarsData.count === 0)
                    res.status(200).send({ calendars: [], count: 0 });
                else
                    res.status(200).send({ calendars: calendarsData.calendars, count: calendarsData.count });
            })
            .catch(err => res.status(500).send({ message: "Server error" }));
})

router.post('/v1/calendars', checkAuthenticated, async (req, res) => {
    console.log("here");
    let image = Object.values(req.files);
    let uploadedImage = undefined;
    try {
        if (image.length !== 0)
            uploadedImage = await cloudinary.uploader.upload(image[0].path);

        let newCalendar = new calendar();

        if (req.body.name)
            newCalendar.name = req.body.name;

        if (image.length !== 0)
            newCalendar.photoUrl = uploadedImage.secure_url;

        calendar.insertCalendar(newCalendar)
            .then(insCalendar => Promise.all([user.insertCalendar(req.user.id, insCalendar.id), insCalendar]))
            .then(resault => res.status(201).send(resault[1]))
            .catch(err => {
                console.log(err);
                res.status(500).send({ message: "Server error" });

            });
    } catch (err) {
        res.status(500).send({ message: "Server error" });
        console.log(err);
    }
})

router.put('/v1/calendars/:id', checkAuthenticated, async (req, res) => {
    let image = Object.values(req.files);
    let uploadedImage = undefined;
    try {
        if (image.length !== 0)
            uploadedImage = await cloudinary.uploader.upload(image[0].path);

        if (!mongoose.Types.ObjectId.isValid(req.params.id) && req.params.id)
            res.status(400).send({ message: "Bad request" });
        else
            calendar.getCalendarById(req.params.id)
                .then(fCalendar => {
                    if (fCalendar) {

                        if (req.body.name)
                            fCalendar.name = req.body.name;

                        if (image.length !== 0)
                            fCalendar.photoUrl = uploadedImage.secure_url;

                        return calendar.updateCalendar(fCalendar);
                    } else
                        return undefined;
                })
                .then(success => {
                    if (success)
                        return calendar.getCalendarById(req.params.id)
                    else
                        return undefined
                })
                .then(updCalendar => {
                    if (updCalendar)
                        res.status(200).send(updCalendar);
                    else
                        res.status(404).send({ message: "Not found" });
                })
                .catch(err => {
                    res.status(500).send({ message: "Server error" });
                    console.log(err);
                });
    } catch (err) {
        console.log(err);
    }
})

router.delete('/v1/calendars/:id', checkAuthenticated, (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id) && req.params.id)
        res.status(400).send({ message: "Bad request" });
    else
        Promise.all([calendar.deleteCalendarById(req.params.id), user.deleteCalendar(req.user.id, req.params.id)])
            .then(resault => {
                if (resault[0].deletedCount == 0)
                    res.status(400).send({ message: "Bad request" });
                else
                    res.status(204).send();
            })
            .catch(err => res.status(500).send({ message: "Server error" }));
})

router.post('/v1/links', checkAuthenticated, (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.body.eventId) || !mongoose.Types.ObjectId.isValid(req.body.calendarId))
        res.status(400).send({ message: "Bad request" });
    else
        Promise.all([calendar.getCalendarById(req.body.calendarId), event.getEventById(req.body.eventId)])
            .then(resault => {
                if (!resault[0] || !resault[1])
                    return undefined;
                else
                    return calendar.insertEventToCalendarApi(resault[0], req.body.eventId);
            })
            .then(success => {
                if (success)
                    res.status(201).send();
                else
                    res.status(400).send({ message: "Bad request" })
            })
            .catch(err => {
                res.status(500).send({ message: "Server error" });
                console.log(err);
            });

})

router.delete('/v1/links', checkAuthenticated, (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.body.eventId) || !mongoose.Types.ObjectId.isValid(req.body.calendarId))
        res.status(400).send({ message: "Bad request" });
    else
        Promise.all([calendar.getCalendarById(req.body.calendarId), event.getEventById(req.body.eventId)])
            .then(resault => {
                if (!resault[0] || !resault[1])
                    return undefined;
                else
                    return calendar.deleteEventFromCalendarApi(resault[0], req.body.eventId);
            })
            .then(success => {
                if (success)
                    res.status(204).send();
                else
                    res.status(400).send({ message: "Bad request" })
            })
            .catch(err => {
                res.status(500).send({ message: "Server error" });
                console.log(err);
            });

})


module.exports = router;