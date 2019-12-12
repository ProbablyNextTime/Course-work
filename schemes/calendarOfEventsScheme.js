let mongoose = require('mongoose');
// let validator = require('validator')

let calendarOfEventsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: false
  },
  creationDate: {
      type: Date,
      required: true,
      unique: false
  },
  photoUrl: {
      type:String,
      required: true,
      unique: false
  },
  events: [{
      type : mongoose.Schema.Types.ObjectId, ref: 'events'
  }]
})

module.exports = mongoose.model('calendarsofevents', calendarOfEventsSchema);