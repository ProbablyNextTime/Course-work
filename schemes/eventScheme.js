let mongoose = require('mongoose');
// let validator = require('validator')

let eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: false
  },
  status: {
      type : Number,
      required: true,
      min: -1,
      max: 0,
      unique: false
  },
  deadLine: {
      type: String,
      required: true,
      unique: false
  },
  difficulty: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
      unique: false
  },
  description: {
      type: String,
      maxlength: 200,
      unique: false
  },
  themeUrl: {
      type: String,
      unique: false
  }
})

module.exports = mongoose.model('events', eventSchema);