module.exports = {};
const fs = require('fs-extra');
const eventScheme = require('../schemes/eventScheme');


class Event {

    constructor(){
        this.themeUrl = 'https://res.cloudinary.com/drkgnohds/image/upload/v1575245354/course-work/noImage_v8gjim.png';
        this.status = 0;
        this.deadLine = "";
        this.name = "name";
        this.description = "description";
        this.difficulty = 0;
    }

    // constructor(deadLine, status, difficulty, name, description, themeUrl){
    //     this.themeUrl = themeUrl;
    //     this.status = status;
    //     this.deadLine = deadLine;
    //     this.difficulty = difficulty;
    //     this.name = name;
    //     this.description = description;
    // }

    static getSome(step, stepNumber, requestedSubString){ ////// rewrite async\
        return new Promise(function(resolve, reject){
            eventScheme.find({ name : { "$regex": requestedSubString, "$options": "i" } })
                .skip(step * stepNumber)
                .limit(step)
                    .then( events => {
                        eventScheme.countDocuments({name : { "$regex": requestedSubString, "$options": "i" }})
                            .then( count => {
                                let eventsData = {
                                    Events: events,
                                    itemsCount : count
                                }
                                resolve(eventsData);
                            })
                    })
                    .catch(err => {
                        reject(err);
                    });
        });
    }

    static getAll() { 
        return new Promise(function(resolve, reject){
            eventScheme.find({})
                .then( events => {
                    resolve(events)
                })
                .catch(err => {
                    reject(err);
                })
        });
    }

    static getNotAssignedEvents(eventsIds, userEvents){
        return eventScheme.find({_id : {$exists: true, $nin: eventsIds, $in: userEvents}});
        
    }

    static getEventById(id){
        return eventScheme.findById(id);
    }

    static getEventByIdApi(userEventsIds, eventId){
        for(let userEventId of userEventsIds)
            if(userEventId == eventId)
                return eventScheme.findById(eventId).exec();
        return Promise.resolve(undefined);
    }

    static insertEvent(event){
        let newItem = new eventScheme(event);
        return newItem.save();
    }

    static deleteEventById(id){
        return eventScheme.deleteOne({ _id : id}).exec();
    }   

    static update(updEvent){
        console.log(updEvent.themeUrl);
        return new Promise(function(resolve, reject){
             resolve(eventScheme.findOneAndUpdate({ _id : updEvent._id} , updEvent, {upsert: true}));
        }); 

    }    
}


module.exports = Event;