const mongoose = require('mongoose');
const UserSchema = require('../schemas/user-schema');

module.exports = mongoose.model('User', UserSchema);
