const fs = require("fs-extra");
const userScheme = require('../schemes/userScheme');

class User {

    constructor(login, password) {
        this.login = login; 
        this.fullname = "fullname"  
        this.role = 0
        this.registeredAt = new Date();
        this.avaUrl = 'https://res.cloudinary.com/drkgnohds/image/upload/v1575245354/course-work/noImage_v8gjim.png';
        this.isDisabled = false;
        this.password = password;
        this.bio = "standart bio for created user is here";
        this.events = [];
        this.calendars = [];
        this.telegramLogin = undefined;
        this.telegramChatId = undefined;
    }
 
    static async getUserById(id) {
        return userScheme.findById(id);
    }

    static update(user){
        return userScheme.findByIdAndUpdate(user.id, user).exec();
    }

    static findUserByTlegramLogin(login) {
        return new Promise(function(resolve, reject){
            userScheme.findOne({telegramLogin : login}).populate('events')
                .then(searchedUser => {
                    if(searchedUser)
                        resolve(searchedUser.toObject({getters: true}));
                    else    
                        resolve(null);
                })
                .catch(err => reject(err));
        }); 
    }

    static getUsersEvents(userId, step, stepNumber, requestedSubString){
        return new Promise(function(resolve, reject){
            userScheme.findById(userId).populate('events').exec()
                .then(user => {
                    let userEvents = [];
                    for(let event of user.events){
                        if((event.toObject({getters: true})).name.toLowerCase().includes(requestedSubString.toLowerCase()))
                            userEvents.push(event);
                    }

                    resolve({items: userEvents.slice(step * stepNumber, step*(stepNumber + 1)), itemsCount: userEvents.length});
                })
                .catch(err => reject(err));
        }) 
    }


    static getUsersEventsApi(userId, step, stepNumber, requestedSubString){
        return new Promise(function(resolve, reject){
            userScheme.findById(userId).populate('events').exec()
                .then(user => {
                    let userEvents = [];
                    for(let event of user.events){
                        if((event.toObject({getters: true})).name.toLowerCase().includes(requestedSubString.toLowerCase()))
                            userEvents.push(event);
                    }

                    resolve(userEvents.slice(step * stepNumber, step*(stepNumber + 1)));
                })
                .catch(err => reject(err));
        }) 
    }

    static getUsersCalendarsApi(userId, step, stepNumber, requestedSubString){
        return new Promise(function(resolve, reject){
            userScheme.findById(userId).populate("calendars").exec()
                .then(user => {
                    let userCalendars = [];
                    for(let calendar of user.calendars){
                        if((calendar.toObject({getters: true})).name.toLowerCase().includes(requestedSubString.toLowerCase()))
                            userCalendars.push(calendar);
                    }
                    resolve({ calendars: userCalendars.slice(step * stepNumber, step*(stepNumber + 1)), count : userCalendars.length});
                })
                .catch(err => reject(err));
        })
    }

    static deleteUserById(id){
        return userScheme.findByIdAndDelete(id).exec();
    }

    static getUsers(step, page, searchString){
        return userScheme.find({ login : { "$regex": searchString, "$options": "i" }}).exec()
            .then(users => {
                let usersRes = [];
                for(let i = (page - 1) * step; i < users.length && i < page * step; i++)
                    usersRes.push(users[i]);
                return {users : usersRes, count : users.length};
            })
    }

    static deleteEvent(userId, eventId){
        return userScheme.findOne({_id : userId}).exec()
            .then( searchedUser => {
                for(let i = 0; i < searchedUser.events.length; i++)
                    if(searchedUser.events[i] == eventId){
                        searchedUser.events.splice(i, 1);
                        return searchedUser.save();
                    }
            })
    }

    static deleteCalendar(userId, calendarId){
        return userScheme.findOne({_id : userId}).exec()
            .then( searchedUser => {
                for(let i = 0; i < searchedUser.calendars.length; i++)
                    if(searchedUser.calendars[i] == calendarId){
                        searchedUser.calendars.splice(i, 1);
                        return searchedUser.save();
                    }
            })
    }

    static getUsersCalendars(userId){
        return new Promise(function(resolve, reject){
            userScheme.findById(userId).populate("calendars").exec()
                .then(user => resolve(user.calendars))
                .catch(err => reject(err));
        })
    }

    static insertEvent(userId, eventId){
        return userScheme.findById(userId)
            .then(fUser => {
                fUser.events.push(eventId);
                return fUser.save();
            })
    }

    static insertCalendar(userId, calendarId){
        return userScheme.findById(userId)
            .then(fUser => {
                console.log(fUser.calendars);
                fUser.calendars.push(calendarId);
                return fUser.save();
            })
    }


 
    // returns an array of all users in storage
    static getAll(){
        return userScheme.find({});
    }

    static insert(user){
        console.log(user);
        let newUser = new userScheme(user);
        return newUser.save();
    }

    static async findUserByLogin(login){
        // return userScheme.find({login: login});
        return new Promise(function(resolve, reject){
            userScheme.findOne({login : login})
                .then(searchedUser => {
                    if(searchedUser)
                        resolve(searchedUser.toObject({getters: true}));
                    else    
                        resolve(null);
                })
                .catch(err => reject(err));
        }); 
    } 
            

 };

 module.exports = User;

 