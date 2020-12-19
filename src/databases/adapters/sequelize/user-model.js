const { Model } = require('sequelize');
const userSchema = require('./user-schema');

class User extends Model {
  get fullname() {
    return [this.firstname, this.lastname].join(' ');
  }

  get signupDate() {
    return this.createdAt;
  }
}

async function createUserModel(sequelize, tableName) {
  User.init(userSchema, {
    sequelize,
    tableName,
  });

  await User.sync();

  return User;
}

module.exports = createUserModel;
