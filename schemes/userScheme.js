let mongoose = require('mongoose');
// let validator = require('validator')

let userSchema = new mongoose.Schema({
  login: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 20,
    unique: true
  },
  role: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    unique: false
  },
  fullname: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 30,
    unique: false
  },
  registeredAt: {
    type: Date,
    required: true,
    unique: false
  },
  isDisabled: {
    type: Boolean,
    required: true,
    unique: false
  },
  avaUrl: {
    type: String,
    required: true,
    unique: false
  },
  bio: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 1000,
    unique: false
  },
  password: {
    type: String,
    required: true,
    unique: false
  },
  events: [{
    type: mongoose.Schema.Types.ObjectId, ref: 'events',
    required: true
  }],
  calendars: [{
    type: mongoose.Schema.Types.ObjectId, ref: 'calendarsofevents',
    required: true
  }],
  telegramLogin: {
    type: String,
    required: false,
    unique: false
  },
  telegramChatId: {
    type: String,
    required: false,
    unique: false
  }
})

module.exports = mongoose.model('users', userSchema);