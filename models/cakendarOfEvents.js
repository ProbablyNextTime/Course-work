const fs = require('fs-extra');
const calendarOfEventsScheme = require('../schemes/calendarOfEventsScheme');


class CalendarOfEvents {
    
    constructor() {
        this.events = [];
        this.creationDate = new Date();
        this.name = "name";
        this.photoUrl = 'https://res.cloudinary.com/drkgnohds/image/upload/v1575245354/course-work/noImage_v8gjim.png';
    }

    static getAllCalendars(){
        return  calendarOfEventsScheme.find({})
    }

    static insertCalendar(calendar){
        let newItem = new calendarOfEventsScheme(calendar);
        return newItem.save();
    }

    static insertEventToCalendar(calendar, event){
        calendar.events.push(event.id);
        return calendarOfEventsScheme.findByIdAndUpdate(calendar._id, calendar).exec();       
    }

    static insertEventToCalendarApi(calendar, eventId){
        calendar.events.push(eventId);
        return calendarOfEventsScheme.findByIdAndUpdate(calendar._id, calendar).exec();  
    }
    static deleteEventFromCalendarApi(calendar, eventId){
        calendar.events = calendar.events.filter(item => item != eventId);
        return calendarOfEventsScheme.findByIdAndUpdate(calendar._id, calendar).exec(); 
    }

    static deleteEventFromCalendar(calendar, event){
        calendar.events = calendar.events.filter(item => item != event.id);
        return calendarOfEventsScheme.findByIdAndUpdate(calendar._id, calendar).exec(); 
    }

    static getCalendarById(id){
        return new Promise(function(resolve, reject){
            calendarOfEventsScheme.findById({_id : id})
                .then( calendar => {
                    if(calendar)
                        resolve(calendar.toObject({getters : true}));
                    else 
                        resolve(undefined);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    static getCalendarByIdApi(userCalendarsIds, calendarId){
        for(let userCalendarId of userCalendarsIds)
            if(userCalendarId == calendarId)
                return calendarOfEventsScheme.findById(calendarId).populate('events').exec();
        return Promise.resolve(undefined);
    }
    static getCalendarsEvents(id){
        return new Promise(function(resolve, reject){
            calendarOfEventsScheme.findById(id).populate('events').exec()
                .then( calendar => {
                    resolve(calendar.events)
                })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        }); 
    } 

    static clearUp(eventId){
        return new Promise(function(resolve, reject){
            calendarOfEventsScheme.find({})
                .then(calendars => {
                    let promises = [];
                    for(let calendar of calendars)
                        for(let i = 0; i < calendar.events.length; i++){
                            if(calendar.events[i] == eventId){
                                calendar.events.splice(i, 1);
                                promises.push(calendarOfEventsScheme.findByIdAndUpdate(calendar._id, calendar));
                                break;
                            }                                
                        }
                return Promise.all(promises);
                })
                .then( () => {
                    resolve(200);
                })  
                .catch(err =>{
                    console.log(err);
                    reject(err);
                })
        });
    }


    static updateCalendar(calendarUpd){
        return  calendarOfEventsScheme.findByIdAndUpdate(calendarUpd._id, calendarUpd).exec();
    }

    static deleteCalendarById(id){
        return calendarOfEventsScheme.deleteOne({_id : id});
    }
}


module.exports = CalendarOfEvents;