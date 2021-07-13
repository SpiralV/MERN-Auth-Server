const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  name: String, 
  password: String,
  email: String,
  friends: Array
}, {
  timestamps: true
})

module.exports = UserSchema