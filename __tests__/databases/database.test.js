const chai = require('chai');
const spies = require('chai-spies');
const env = require('../../src/dotenv');
let users = require('./_test-users.json');
const { getValidUserId } = require('../_utils');
const database = require('../../src/databases');
const chaiAsPromised = require('chai-as-promised');
const userModule = require('../../src/user-module');

const { expect } = chai;
const usersBackup = users.slice();
const db = database.getAdapter(env.DB_ADAPTER);

function getRandomData(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function createTestUsers(cb) {
  let counter = 0;

  users.forEach(async userData => {
    const user = await db.createUser(userData);
    const targetUser = users.find(curruser => curruser === userData);

    targetUser.id = user.id;
    targetUser.signupDate = user.signupDate;

    counter++;

    if(counter === users.length) {
      cb();
    }
  });
}

function deleteTestUsers(cb) {
  let counter = 0;

  users.forEach(async user => {
    await db.deleteUser(user.id);

    counter++;

    if(counter === users.length) {
      cb();
    }
  });
}

chai.use(spies);
chai.use(chaiAsPromised);

let connection = null;

before(async function() {
  connection = await db.connect({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USERNAME,
    pass: env.DB_PASSWORD,
    engine: env.DB_ENGINE,
    dbName: env.DB_DBNAME,
    storagePath: env.DB_STORAGE_PATH,
    debug: env.DB_DEBUG,
    exitOnFail: env.EXIT_ON_DB_CONNECT_FAIL,
  });
});

after(async function() {
  await db.disconnect();
  connection = null;
});

describe('Users', () => {
  describe('Create User', () => {
    it('should reject with a VALIDATION_ERROR if "firstname" is missing', () => {
      const userData = { ...getRandomData(users) };
      delete userData.firstname;

      return expect(db.createUser(userData)).to.eventually
        .be.rejected
        .and.to.be.an.instanceOf(Object)
        .and.to.have.property('type', 'VALIDATION_ERROR');
    });

    it('should reject with a VALIDATION_ERROR if "lastname" is missing', () => {
      const userData = { ...getRandomData(users) };
      delete userData.lastname;

      return expect(db.createUser(userData)).to.eventually
        .be.rejected
        .and.to.be.an.instanceOf(Object)
        .and.to.have.property('type', 'VALIDATION_ERROR');
    });

    it('should reject with a VALIDATION_ERROR if "username" is missing', () => {
      const userData = { ...getRandomData(users) };
      delete userData.username;

      return expect(db.createUser(userData)).to.eventually
        .be.rejected
        .and.to.be.an.instanceOf(Object)
        .and.to.have.property('type', 'VALIDATION_ERROR');
    });

    it('should reject with a VALIDATION_ERROR if "email" is missing', () => {
      const userData = { ...getRandomData(users) };
      delete userData.email;

      return expect(db.createUser(userData)).to.eventually
        .be.rejected
        .and.to.be.an.instanceOf(Object)
        .and.to.have.property('type', 'VALIDATION_ERROR');
    });

    it('should reject with a VALIDATION_ERROR if "password" is missing', () => {
      const userData = { ...getRandomData(users) };
      delete userData.password;

      return expect(db.createUser(userData)).to.eventually
        .be.rejected
        .and.to.be.an.instanceOf(Object)
        .and.to.have.property('type', 'VALIDATION_ERROR');
    });

    it('should create a user and return an object when every value is supplied', async () => {
      const userData = getRandomData(users);
      const user = await db.createUser(userData);

      expect(user).to.be.an('object');
      expect(user).to.have.property('id');
      expect(user).to.have.property('firstname').to.equal(userData.firstname);
      expect(user).to.have.property('lastname').to.equal(userData.lastname);
      expect(user).to.have.property('username').to.equal(userData.username);
      expect(user).to.have.property('email').to.equal(userData.email);
      expect(user).to.have.property('password');
      expect(user).to.have.property('signupDate').to.be.instanceOf(Date);

      await db.deleteUser(user.id);
    });

    it('userModule should emit a "createUser" event on user creation success', async () => {
      const userData = getRandomData(users);
      const spy = chai.spy.on(userModule, 'emit');
      const user = await db.createUser(userData);

      expect(user).to.be.an('object');

      expect(spy).to.have.been.called.with('createUser');

      chai.spy.restore();

      await db.deleteUser(user.id);
    });
  });

  describe('Get Users', () => {
    beforeEach(function(done) {
      createTestUsers(done);
    });

    afterEach(function(done) {
      deleteTestUsers(function() {
        users = usersBackup;

        done();
      });
    });

    it('should return every user if no filters are specified', async () => {
      const firstnames = usersBackup.map(user => user.firstname);
      const lastnames = usersBackup.map(user => user.lastname);
      const usernames = usersBackup.map(user => user.username);
      const emails = usersBackup.map(user => user.email);
      const result = await db.getUsers();

      expect(result).to.be.an('object');
      expect(result).to.have.property('total').to.equal(users.length);
      expect(result).to.have.property('length').to.equal(users.length);
      expect(result).to.have.property('users').to.be.an('array');

      const fetchedUsers = result.users;

      expect(fetchedUsers.length).to.equal(users.length);

      fetchedUsers.forEach(user => {
        expect(user).to.be.an('object');
        expect(user).to.have.property('id');
        expect(user).to.have.property('firstname').to.be.a('string');
        expect(firstnames).to.include(user.firstname);
        expect(user).to.have.property('lastname').to.be.a('string');
        expect(lastnames).to.include(user.lastname);
        expect(user).to.have.property('username').to.be.a('string');
        expect(usernames).to.include(user.username);
        expect(user).to.have.property('email').to.be.a('string');
        expect(emails).to.include(user.email);
        expect(user).to.have.property('signupDate').to.be.instanceOf(Date);
      });
    });

    it('should return users with the specified firstname filter', async () => {
      const user = getRandomData(users);
      const firstname = user.firstname;
      const matches = users.filter(user => user.firstname === firstname);
      const result = await db.getUsers({ firstname });

      expect(result).to.be.an('object');
      expect(result).to.have.property('total').to.equal(matches.length);
      expect(result).to.have.property('length').to.equal(matches.length);
      expect(result).to.have.property('users').to.be.an('array');

      const fetchedUsers = result.users;

      expect(fetchedUsers).to.be.an('array');
      expect(fetchedUsers.length).to.equal(matches.length);

      fetchedUsers.forEach(user => {
        expect(user).to.be.an('object');
        expect(user).to.have.property('id');
        expect(user).to.have.property('firstname').to.be.a('string');
        expect(user.firstname).to.equal(firstname);
        expect(user).to.have.property('lastname').to.be.a('string');
        expect(user).to.have.property('username').to.be.a('string');
        expect(user).to.have.property('email').to.be.a('string');
        expect(user).to.have.property('signupDate').to.be.instanceOf(Date);
      });
    });

    it('should return users with the specified lastname filter', async () => {
      const user = getRandomData(users);
      const lastname = user.lastname;
      const matches = users.filter(user => user.lastname === lastname);
      const result =await db.getUsers({ lastname });

      expect(result).to.be.an('object');
      expect(result).to.have.property('total').to.equal(matches.length);
      expect(result).to.have.property('length').to.equal(matches.length);
      expect(result).to.have.property('users').to.be.an('array');

      const fetchedUsers = result.users;

      expect(fetchedUsers).to.be.an('array');
      expect(fetchedUsers.length).to.equal(matches.length);

      fetchedUsers.forEach(user => {
        expect(user).to.be.an('object');
        expect(user).to.have.property('id');
        expect(user).to.have.property('firstname').to.be.a('string');
        expect(user).to.have.property('lastname').to.be.a('string');
        expect(user.lastname).to.equal(lastname);
        expect(user).to.have.property('username').to.be.a('string');
        expect(user).to.have.property('email').to.be.a('string');
        expect(user).to.have.property('signupDate').to.be.instanceOf(Date);
      });
    });
  });

  describe('Search Users', () => {
    beforeEach(function(done) {
      createTestUsers(done);
    });

    afterEach(function(done) {
      deleteTestUsers(function() {
        users = usersBackup;

        done();
      });
    });

    function assertOnUser(user) {
      expect(user).to.be.an('object');
      expect(user).to.have.property('id');
      expect(user).to.have.property('firstname');
      expect(user).to.have.property('lastname');
      expect(user).to.have.property('username');
      expect(user).to.have.property('email');
      expect(user).to.have.property('password');
      expect(user).to.have.property('signupDate').to.be.instanceOf(Date);
    }

    it('should reject with an error if the "query" parameter is missing', () => {
      return expect(db.searchUsers()).to.eventually
        .be.rejectedWith(/Please specify the search term/);
    });

    it('should return no results if search by non-existent user details', async () => {
      const users = await db.searchUsers({ query: 'here and there' });

      expect(users).to.be.an('object');
      expect(users).to.have.property('total').to.equal(0);
      expect(users).to.have.property('length').to.equal(0);
      expect(users).to.have.property('users').to.be.an('array')
        .and.to.have.lengthOf(0);
    });

    it('should return matching results if "query" parameter matches registered users', async () => {
      const searchTerm = 'Lanister';
      const matchingUsers = users.filter(user => {
        return (
          user.firstname.indexOf(searchTerm) > -1 ||
          user.lastname.indexOf(searchTerm) > -1 ||
          user.username.indexOf(searchTerm) > -1 ||
          user.email.indexOf(searchTerm) > -1
        );
      });

      const matchingUsersLength = matchingUsers.length;
      const result = await db.searchUsers({ query: searchTerm });

      expect(result).to.be.an('object');
      expect(result).to.have.property('total').to.equal(matchingUsersLength);
      expect(result).to.have.property('length').to.equal(matchingUsersLength);
      expect(result).to.have.property('users').to.be.an('array')
        .and.to.have.lengthOf(matchingUsersLength);

      result.users.forEach(user => {
        assertOnUser(user);
        expect([ user.firstname, user.lastname, user.username, user.email])
          .to.include(searchTerm);
      });
    });

    it('should search case-insensitively', async () => {
      const searchTerm = 'Lanister';
      const matchingUsers = users.filter(user => {
        return (
          user.firstname.indexOf(searchTerm) > -1 ||
          user.lastname.indexOf(searchTerm) > -1 ||
          user.username.indexOf(searchTerm) > -1 ||
          user.email.indexOf(searchTerm) > -1
        );
      });

      const matchingUsersLength = matchingUsers.length;
      const result = await db.searchUsers({
        query: searchTerm.toLowerCase(),
      });

      expect(result).to.be.an('object');
      expect(result).to.have.property('total').to.equal(matchingUsersLength);
      expect(result).to.have.property('length').to.equal(matchingUsersLength);
      expect(result).to.have.property('users').to.be.an('array')
        .and.to.have.lengthOf(matchingUsersLength);

      result.users.forEach(user => {
        assertOnUser(user);
        expect([ user.firstname, user.lastname, user.username, user.email])
          .to.include(searchTerm);
      });
    });

    it('should return no results if search by non-existent firstname', async () => {
      const searchTerm = 'Lanister';
      const result = await db.searchUsers({
        query: searchTerm,
        by: 'firstname',
      });

      expect(result).to.be.an('object');
      expect(result).to.have.property('total').to.equal(0);
      expect(result).to.have.property('length').to.equal(0);
      expect(result).to.have.property('users').to.be.an('array')
        .and.to.have.lengthOf(0);
    });

    it('should return matching success data if search by existing firstname', async () => {
      const searchTerm = 'Jamie';
      const matchingUsers = users.filter(user => {
        return user.firstname.indexOf(searchTerm) > -1;
      });

      const matchingUsersLength = matchingUsers.length;
      const result = await db.searchUsers({
        query: searchTerm,
        by: 'firstname'
      });

      expect(result).to.be.an('object');
      expect(result).to.have.property('total').to.equal(matchingUsersLength);
      expect(result).to.have.property('length').to.equal(matchingUsersLength);
      expect(result).to.have.property('users').to.be.an('array')
        .and.to.have.lengthOf(matchingUsersLength);

      result.users.forEach(user => {
        assertOnUser(user);
        expect([ user.firstname ]).to.include(searchTerm);
      });
    });

    it('should return no results if search by non-existent lastname', async () => {
      const searchTerm = 'Jamie';
      const result = await db.searchUsers({
        query: searchTerm,
        by: 'lastname',
      });

      expect(result).to.be.an('object');
      expect(result).to.have.property('total').to.equal(0);
      expect(result).to.have.property('length').to.equal(0);
      expect(result).to.have.property('users').to.be.an('array')
        .and.to.have.lengthOf(0);
    });

    it('should return matching success data if search by existing lastname', async () => {
      const searchTerm = 'Lanister';
      const matchingUsers = users.filter(user => {
        return user.lastname.indexOf(searchTerm) > -1;
      });

      const matchingUsersLength = matchingUsers.length;
      const result = await db.searchUsers({
        query: searchTerm,
        by: 'lastname'
      });

      expect(result).to.be.an('object');
      expect(result).to.have.property('total').to.equal(matchingUsersLength);
      expect(result).to.have.property('length').to.equal(matchingUsersLength);
      expect(result).to.have.property('users').to.be.an('array')
        .and.to.have.lengthOf(matchingUsersLength);

      result.users.forEach(user => {
        assertOnUser(user);
        expect([ user.lastname ]).to.include(searchTerm);
      });
    });

    it('should return no results if search by non-existent username', async () => {
      const searchTerm = 'Lanister';
      const result = await db.searchUsers({
        query: searchTerm,
        by: 'username',
      });

      expect(result).to.be.an('object');
      expect(result).to.have.property('total').to.equal(0);
      expect(result).to.have.property('length').to.equal(0);
      expect(result).to.have.property('users').to.be.an('array')
        .and.to.have.lengthOf(0);
    });

    it('should return matching success data if search by existing username', async () => {
      const searchTerm = 'kingslayer';
      const matchingUsers = users.filter(user => {
        return user.username.indexOf(searchTerm) > -1;
      });

      const matchingUsersLength = matchingUsers.length;
      const result = await db.searchUsers({
        query: searchTerm,
        by: 'username'
      });

      expect(result).to.be.an('object');
      expect(result).to.have.property('total').to.equal(matchingUsersLength);
      expect(result).to.have.property('length').to.equal(matchingUsersLength);
      expect(result).to.have.property('users').to.be.an('array')
        .and.to.have.lengthOf(matchingUsersLength);

      result.users.forEach(user => {
        assertOnUser(user);
        expect([ user.username ]).to.include(searchTerm);
      });
    });

    it('should return no results if search by non-existent firstname', async () => {
      const searchTerm = 'kingslayer';
      const result = await db.searchUsers({
        query: searchTerm,
        by: 'email',
      });

      expect(result).to.be.an('object');
      expect(result).to.have.property('total').to.equal(0);
      expect(result).to.have.property('length').to.equal(0);
      expect(result).to.have.property('users').to.be.an('array')
        .and.to.have.lengthOf(0);
    });

    it('should return matching success data if search by existing email', async () => {
      const searchTerm = 'arya';
      const matchingUsers = users.filter(user => {
        return user.email.indexOf(searchTerm) > -1;
      });

      const matchingUsersLength = matchingUsers.length;
      const result = await db.searchUsers({
        query: searchTerm,
        by: 'email'
      });

      expect(result).to.be.an('object');
      expect(result).to.have.property('total').to.equal(matchingUsersLength);
      expect(result).to.have.property('length').to.equal(matchingUsersLength);
      expect(result).to.have.property('users').to.be.an('array')
        .and.to.have.lengthOf(matchingUsersLength);

      result.users.forEach(user => {
        assertOnUser(user);
        expect(user.email).to.match(new RegExp(searchTerm, 'i'));
      });
    });

    it('should return matching success data if search by more than one criteria, at least one matching', async () => {
      const searchTerm = 'Lanister';
      const matchingUsers = users.filter(user => {
        return (
          user.firstname.indexOf(searchTerm) > -1 ||
          user.lastname.indexOf(searchTerm) > -1
        );
      });

      const matchingUsersLength = matchingUsers.length;
      const result = await db.searchUsers({
        query: searchTerm,
        by: 'firstname:lastname',
      });

      expect(result).to.be.an('object');
      expect(result).to.have.property('total').to.equal(matchingUsersLength);
      expect(result).to.have.property('length').to.equal(matchingUsersLength);
      expect(result).to.have.property('users').to.be.an('array')
        .and.to.have.lengthOf(matchingUsersLength);

      result.users.forEach(user => {
        assertOnUser(user);
        expect([ user.firstname, user.lastname ]).to.include(searchTerm);
      });
    });

    it('should return no results if search by more than one criteria, none matching', async () => {
      const searchTerm = 'Johnson';
      const result = await db.searchUsers({
        query: searchTerm,
        by: 'firstname:lastname:username:email',
      });

      expect(result).to.be.an('object');
      expect(result).to.have.property('total').to.equal(0);
      expect(result).to.have.property('length').to.equal(0);
      expect(result).to.have.property('users').to.be.an('array')
        .and.to.have.lengthOf(0);
    });

    it('should return a maximum of LIMIT users when "limit" is specified', async () => {
      const LIMIT = 1;
      const searchTerm = 'Lanister';
      const matchingUsers = users.filter(user => {
        return (
          user.firstname.indexOf(searchTerm) > -1 ||
          user.lastname.indexOf(searchTerm) > -1 ||
          user.username.indexOf(searchTerm) > -1 ||
          user.email.indexOf(searchTerm) > -1
        );
      });

      const matchingUsersLength = matchingUsers.length;
      const result = await db.searchUsers({
        query: searchTerm.toLowerCase(),
        limit: LIMIT,
      });

      expect(result).to.be.an('object');
      expect(result).to.have.property('total').to.equal(matchingUsersLength);
      expect(result).to.have.property('length').to.equal(LIMIT);
      expect(result).to.have.property('users').to.be.an('array')
        .and.to.have.lengthOf(LIMIT);

      result.users.forEach(user => {
        assertOnUser(user);
        expect([ user.firstname, user.lastname, user.username, user.email])
          .to.include(searchTerm);
      });
    });

    /*it('should sort by DESC signupDate if no sort order is specified', async () => {
      const searchTerm = 'Lanister';
      const matchingUsers = users.filter(user => {
        return (
          user.firstname.indexOf(searchTerm) > -1 ||
          user.lastname.indexOf(searchTerm) > -1 ||
          user.username.indexOf(searchTerm) > -1 ||
          user.email.indexOf(searchTerm) > -1
        );
      });
      const sortedUsers = matchingUsers.sort((a, b) => {
        return new Date(b.signupDate) - new Date(a.signupDate);
      });
      const matchingUsersLength = matchingUsers.length;
      const result = await db.searchUsers({ query: searchTerm });

      expect(result).to.be.an('object');
      expect(result).to.have.property('total').to.equal(matchingUsersLength);
      expect(result).to.have.property('length').to.equal(matchingUsersLength);
      expect(result).to.have.property('users').to.be.an('array')
        .and.to.have.lengthOf(matchingUsersLength);

      const fetchedUsers = result.users;

      fetchedUsers.forEach(user => {
        assertOnUser(user);
        expect([ user.firstname, user.lastname, user.username, user.email])
          .to.include(searchTerm);
      });

      for(let i = 0; i < fetchedUsers.length; i++) {
        expect(getValidUserId(fetchedUsers[i].id)).to.equal(
          getValidUserId(sortedUsers[i].id));
      }
    });

    it('should sort by ASC signupDate if specified', async () => {
      const searchTerm = 'Lanister';
      const matchingUsers = users.filter(user => {
        return (
          user.firstname.indexOf(searchTerm) > -1 ||
          user.lastname.indexOf(searchTerm) > -1 ||
          user.username.indexOf(searchTerm) > -1 ||
          user.email.indexOf(searchTerm) > -1
        );
      });
      const sortedUsers = matchingUsers.sort((a, b) => {
        return new Date(a.signupDate) - new Date(b.signupDate);
      });
      const matchingUsersLength = matchingUsers.length;
      const result = await db.searchUsers({
        query: searchTerm,
        sort: 'signupDate:asc',
      });

      expect(result).to.be.an('object');
      expect(result).to.have.property('total').to.equal(matchingUsersLength);
      expect(result).to.have.property('length').to.equal(matchingUsersLength);
      expect(result).to.have.property('users').to.be.an('array')
        .and.to.have.lengthOf(matchingUsersLength);

      const fetchedUsers = result.users;

      fetchedUsers.forEach(user => {
        assertOnUser(user);
        expect([ user.firstname, user.lastname, user.username, user.email])
          .to.include(searchTerm);
      });

      for(let i = 0; i < fetchedUsers.length; i++) {
        expect(getValidUserId(fetchedUsers[i].id)).to.equal(
          getValidUserId(sortedUsers[i].id));
      }
    });

    it('should sort by DESC creationDate if invalid creationDate sort order is specified', async () => {
      const searchTerm = 'Lanister';
      const matchingUsers = users.filter(post => {
        return user.firstname.indexOf(searchTerm) > -1
      });
      const result = await db.searchUsers({
        query: searchTerm,
        orderBy: {
          creationDate: 'order-can-only-be-ASC-or-DESC',
        }
      });
      const sortedUsers = matchingUsers.sort((a, b) => {
        return new Date(b.signupDate) - new Date(a.signupDate);
      });
      const matchingUsersLength = matchingUsers.length;

      expect(result).to.be.an('object');
      expect(result).to.have.property('total').to.equal(
        matchingUsersLength);
      expect(result).to.have.property('length').to.equal(
        matchingUsersLength);
      expect(result).to.have.property('users').to.be.an('array')
        .and.to.have.lengthOf(matchingUsersLength);

      const fetchedUsers = result.users;

      retrievedPosts.forEach(post => {

      });

      for(let i = 0; i < fetchedUsers.length; i++) {
        expect(fetchedUsers[i].id.toString()).to.equal(sortedUsers[i].id.toString());
      }
    });*/
  });

  describe('Get User By Id', () => {
    beforeEach(function(done) {
      createTestUsers(done);
    });

    afterEach(function(done) {
      deleteTestUsers(function() {
        users = usersBackup;

        done();
      });
    });

    it('should return no result for a non-existent user', async () => {
      const user = getRandomData(users);
      const invalidUserId = getValidUserId(user.id).split('').reverse().join('');
      const nullUser = await db.findById(invalidUserId);

      expect(nullUser).to.satisfy(function(user) {
        return user === undefined || user === null;
      });
    });

    it('should return a registered user by their id', async () => {
      const user = getRandomData(users);
      const foundUser = await db.findById(user.id);

      expect(foundUser).to.be.an('object');
      expect(foundUser).to.have.property('id');
      expect(getValidUserId(foundUser.id)).to.equal(getValidUserId(user.id));
      expect(foundUser).to.have.property('firstname').to.equal(user.firstname);
      expect(foundUser).to.have.property('lastname').to.equal(user.lastname);
      expect(foundUser).to.have.property('username').to.equal(user.username);
      expect(foundUser).to.have.property('email').to.equal(user.email);
      expect(foundUser).to.have.property('signupDate').to.be.instanceOf(Date);
      expect(foundUser.signupDate.toString()).to.equal(user.signupDate.toString());
    });
  });

  describe('Delete User By Id', () => {
    beforeEach(function(done) {
      createTestUsers(done);
    });

    afterEach(function(done) {
      deleteTestUsers(function() {
        users = usersBackup;

        done();
      });
    });

    it('should delete a registered user by their id', async () => {
      const user = getRandomData(users);
      let foundUser = null;

      foundUser = await db.findById(user.id);

      expect(foundUser).to.be.an('object');
      expect(foundUser).to.have.property('id');
      expect(getValidUserId(foundUser.id)).to.equal(getValidUserId(user.id));
      expect(foundUser).to.have.property('firstname').to.equal(user.firstname);
      expect(foundUser).to.have.property('lastname').to.equal(user.lastname);
      expect(foundUser).to.have.property('username').to.equal(user.username);
      expect(foundUser).to.have.property('email').to.equal(user.email);
      expect(foundUser).to.have.property('signupDate').to.be.instanceOf(Date);
      expect(foundUser.signupDate.toString()).to.equal(user.signupDate.toString());

      await db.deleteUser(user.id);

      foundUser = await db.findById(user.id);

      expect(foundUser).to.satisfy(function(user) {
        return user === undefined || user === null;
      });
    });
  });
});
