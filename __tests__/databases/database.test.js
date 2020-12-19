const chai = require('chai');
const spies = require('chai-spies');
const env = require('../../src/dotenv');
const users = require('./_test-users.json');
const database = require('../../src/databases');
const chaiAsPromised = require('chai-as-promised');
const userModule = require('../../src/user-module');

const { expect } = chai;
const usersBackup = users.slice();
const DataStore = database.getAdapter(env.DB_ADAPTER);
const db = new DataStore();

function getRandomData(array) {
  return array[Math.floor(Math.random() * array.length)];
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

  /*describe('Get Posts', () => {
    beforeEach(done => {
      createTestPosts(function() {
        let counter = 0;

        posts.forEach(post => {
          createTestReplies(post, function() {
            counter++;

            if(counter === posts.length) {
              done();
            }
          });
        });
      });
    });

    afterEach(done => {
      posts = postsBackup;

      done();
    });

    it('should return every post if authorId and parentId are not specified', async () => {
      const posts = await db.getPosts();

      expect(posts).to.be.an('array');

      posts.forEach(post => {
        expect(post).to.have.property('id').to.be.an('object');
        expect(post).to.have.property('authorId').to.be.a('string');
        expect(post).to.have.property('body');
        expect(post).to.have.property('creationDate').to.be.instanceOf(Date);
      });
    });

    it('should return posts by author if authorId is specified as a string', async () => {
      const randomPost = getRandomData(posts);
      const authorId = randomPost.authorId;
      const retrievedPosts = await db.getPosts({ authorId });

      expect(retrievedPosts).to.be.an('array');

      retrievedPosts.forEach(post => {
        expect(post).to.have.property('id').to.be.an('object');
        expect(post).to.have.property('authorId').to.equal(authorId);
        expect(post).to.have.property('body');
        expect(post).to.have.property('creationDate').to.be.instanceOf(Date);
      });
    });

    it('should return posts by author if authorId is specified as a mongoose ObjectId object', async () => {
      const randomPost = getRandomData(posts);
      const authorId = mongoose.Types.ObjectId(randomPost.authorId);
      const retrievedPosts = await db.getPosts({ authorId });

      expect(retrievedPosts).to.be.an('array');

      retrievedPosts.forEach(post => {
        expect(post).to.have.property('id').to.be.an('object');
        expect(post).to.have.property('authorId').to.equal(authorId.toString());
        expect(post).to.have.property('body');
        expect(post).to.have.property('creationDate').to.be.instanceOf(Date);
      });
    });

    it('should return replies for specified post if parentId is specified as a string', async () => {
      const randomPost = getRandomData(posts);
      const postId = randomPost.id.toString();
      const postReplies = await db.getPosts({ parentId: postId });

      expect(postReplies).to.be.an('array').to.have.lengthOf(
        randomPost.replies.length);

      postReplies.forEach(reply => {
        expect(reply).to.have.property('id').to.be.an('object');
        expect(reply).to.have.property('parentId').to.be.a('string');
        expect(reply.parentId).to.equal(postId);
        expect(reply).to.have.property('authorId').to.be.a('string');
        expect(reply).to.have.property('body').to.be.a('string');
        expect(reply).to.have.property('creationDate').to.be.instanceOf(Date);
      });
    });

    it('should return replies for specified post if parentId is specified as a mongoose ObjectId', async () => {
      const randomPost = getRandomData(posts);
      const postId = randomPost.id.toString();
      const postReplies = await db.getPosts({
        parentId: mongoose.Types.ObjectId(postId),
      });

      expect(postReplies).to.be.an('array').to.have.lengthOf(
        randomPost.replies.length);

      postReplies.forEach(reply => {
        expect(reply).to.have.property('id').to.be.an('object');
        expect(reply).to.have.property('parentId').to.be.a('string');
        expect(reply.parentId).to.equal(postId);
        expect(reply).to.have.property('authorId').to.be.a('string');
        expect(reply).to.have.property('body').to.be.a('string');
        expect(reply).to.have.property('creationDate').to.be.instanceOf(Date);
      });
    });

    it('should return replies by specified author to specified post', async () => {
      const randomPost = getRandomData(posts);
      const postId = randomPost.id;
      const randomReply = getRandomData(randomPost.replies);
      const authorId = randomReply.authorId;
      const postAndAuthorReplies = randomPost.replies.filter(reply => {
        return (reply.parentId === postId.toString()
          && reply.authorId === authorId);
      });
      const postReplies = await db.getPosts({
        parentId: postId,
        authorId: authorId,
      });

      expect(postReplies).to.be.an('array').to.have.lengthOf(
        postAndAuthorReplies.length);

      postReplies.forEach(reply => {
        expect(reply).to.have.property('id').to.be.an('object');
        expect(reply).to.have.property('parentId').to.be.a('string')
        expect(reply.parentId).to.equal(postId.toString());
        expect(reply).to.have.property('authorId').to.be.a('string');
        expect(reply.authorId).to.equal(authorId);
        expect(reply).to.have.property('body').to.be.a('string');
        expect(reply).to.have.property('creationDate').to.be.instanceOf(Date);
      });
    });
  });

  describe('Search Posts', () => {
    beforeEach(done => {
      createTestPosts(function() {
        let counter = 0;

        posts.forEach(post => {
          createTestReplies(post, function() {
            counter++;

            if(counter === posts.length) {
              done();
            }
          });
        });
      });
    });

    afterEach(done => {
      posts = postsBackup;

      done();
    });

    it('should reject with an error if the "query" parameter is missing', () => {
      return expect(db.searchPosts()).to.eventually
        .be.rejectedWith(/Please specify the search term/);
    });

    it('should return no results if search by non-existent text', async () => {
      const posts = await db.searchPosts({ query: 'here and there' });

      expect(posts).to.be.an('object');
      expect(posts).to.have.property('total').to.equal(0);
      expect(posts).to.have.property('length').to.equal(0);
      expect(posts).to.have.property('posts').to.be.an('array')
        .and.to.have.lengthOf(0);
    });

    it('should return success data if full text is sent as "query" parameter', async () => {
      const randomPost = getRandomData(posts);
      const searchTerm = randomPost.body;
      const postsWithSearchTerm = posts.filter(post => {
        return post.body.indexOf(searchTerm) > -1
      });
      const retrievedPosts = await db.searchPosts({ query: searchTerm });
      const matchingPostsLength = postsWithSearchTerm.length;

      expect(retrievedPosts).to.be.an('object');
      expect(retrievedPosts).to.have.property('total').to.equal(
        matchingPostsLength);
      expect(retrievedPosts).to.have.property('length').to.equal(
        matchingPostsLength);
      expect(retrievedPosts).to.have.property('posts').to.be.an('array')
        .and.to.have.lengthOf(matchingPostsLength);

      retrievedPosts.posts.forEach(post => {
        expect(post).to.have.property('id').to.be.an('object');
        expect(post).to.have.property('authorId').to.be.a('string');
        expect(post).to.have.property('body').to.equal(searchTerm);
        expect(post).to.have.property('creationDate').to.be.instanceOf(Date);
      });
    });

    it('should return success data if partial text is sent as "query" parameter', async () => {
      const randomPost = getRandomData(posts);
      const searchTerm = randomPost.body.substring(5);
      const postsWithSearchTerm = posts.filter(post => {
        return post.body.indexOf(searchTerm) > -1
      });
      const retrievedPosts = await db.searchPosts({ query: searchTerm });
      const matchingPostsLength = postsWithSearchTerm.length;

      expect(retrievedPosts).to.be.an('object');
      expect(retrievedPosts).to.have.property('total').to.equal(
        matchingPostsLength);
      expect(retrievedPosts).to.have.property('length').to.equal(
        matchingPostsLength);
      expect(retrievedPosts).to.have.property('posts').to.be.an('array')
        .and.to.have.lengthOf(matchingPostsLength);

      retrievedPosts.posts.forEach(post => {
        expect(post).to.have.property('id').to.be.an('object');
        expect(post).to.have.property('authorId').to.be.a('string');
        expect(post).to.have.property('body').to.match(
          new RegExp(searchTerm, 'i'));
        expect(post).to.have.property('creationDate').to.be.instanceOf(Date);
      });
    });

    it('should search case-insensitively', async () => {
      const randomPost = getRandomData(posts);
      const searchTerm = randomPost.body;
      const postsWithSearchTerm = posts.filter(post => {
        return post.body.indexOf(searchTerm) > -1
      });
      const retrievedPosts = await db.searchPosts({
        query: searchTerm.toLowerCase(),
      });
      const matchingPostsLength = postsWithSearchTerm.length;

      expect(retrievedPosts).to.be.an('object');
      expect(retrievedPosts).to.have.property('total').to.equal(
        matchingPostsLength);
      expect(retrievedPosts).to.have.property('length').to.equal(
        matchingPostsLength);
      expect(retrievedPosts).to.have.property('posts').to.be.an('array')
        .and.to.have.lengthOf(matchingPostsLength);

      retrievedPosts.posts.forEach(post => {
        expect(post).to.have.property('id').to.be.an('object');
        expect(post).to.have.property('authorId').to.be.a('string');
        expect(post).to.have.property('body').to.equal(searchTerm);
        expect(post).to.have.property('creationDate').to.be.instanceOf(Date);
      });
    });

    it('should return a maximum of LIMIT posts when "limit" is specified', async () => {
      const LIMIT = 1;
      const randomPost = getRandomData(posts);
      const searchTerm = randomPost.body;
      const postsWithSearchTerm = posts.filter(post => {
        return post.body.indexOf(searchTerm) > -1
      });
      const retrievedPosts = await db.searchPosts({
        query: searchTerm,
        limit: LIMIT,
      });
      const matchingPostsLength = postsWithSearchTerm.length;

      expect(retrievedPosts).to.be.an('object');
      expect(retrievedPosts).to.have.property('total').to.equal(
        matchingPostsLength);
      expect(retrievedPosts).to.have.property('length').to.equal(LIMIT);
      expect(retrievedPosts).to.have.property('posts').to.be.an('array')
        .and.to.have.lengthOf(LIMIT);
    });

    it('should return only posts by author if authorId is specified as a string', async () => {
      const randomPost = getRandomData(posts);
      const searchTerm = randomPost.body;
      const authorId = randomPost.authorId;
      const postsWithSearchTermAndAuthor = posts.filter(post => {
        return (post.body.indexOf(searchTerm) > -1
          && post.authorId === authorId);
      });
      const retrievedPosts = await db.searchPosts({
        query: searchTerm.toLowerCase(),
        authorId,
      });
      const matchingPostsLength = postsWithSearchTermAndAuthor.length;

      expect(retrievedPosts).to.be.an('object');
      expect(retrievedPosts).to.have.property('total').to.equal(
        matchingPostsLength);
      expect(retrievedPosts).to.have.property('length').to.equal(
        matchingPostsLength);
      expect(retrievedPosts).to.have.property('posts').to.be.an('array')
        .and.to.have.lengthOf(matchingPostsLength);

      retrievedPosts.posts.forEach(post => {
        expect(post).to.have.property('id').to.be.an('object');
        expect(post).to.have.property('authorId').to.equal(authorId);
        expect(post).to.have.property('body').to.equal(searchTerm);
        expect(post).to.have.property('creationDate').to.be.instanceOf(Date);
      });
    });

    it('should return only posts by author if authorId is specified as a mongoose ObjectId object', async () => {
      const randomPost = getRandomData(posts);
      const searchTerm = randomPost.body;
      const authorId = randomPost.authorId;
      const postsWithSearchTermAndAuthor = posts.filter(post => {
        return (post.body.indexOf(searchTerm) > -1
          && post.authorId === authorId);
      });
      const retrievedPosts = await db.searchPosts({
        query: searchTerm.toLowerCase(),
        authorId: mongoose.Types.ObjectId(authorId),
      });
      const matchingPostsLength = postsWithSearchTermAndAuthor.length;

      expect(retrievedPosts).to.be.an('object');
      expect(retrievedPosts).to.have.property('total').to.equal(
        matchingPostsLength);
      expect(retrievedPosts).to.have.property('length').to.equal(
        matchingPostsLength);
      expect(retrievedPosts).to.have.property('posts').to.be.an('array')
        .and.to.have.lengthOf(matchingPostsLength);

      retrievedPosts.posts.forEach(post => {
        expect(post).to.have.property('id').to.be.an('object');
        expect(post).to.have.property('authorId').to.equal(authorId);
        expect(post).to.have.property('body').to.equal(searchTerm);
        expect(post).to.have.property('creationDate').to.be.instanceOf(Date);
      });
    });

    it('should return only posts of parent post if parentId is specified as a string', async () => {
      const randomPost = getRandomData(posts);
      const randomReply = getRandomData(randomPost.replies);
      const searchTerm = randomReply.body;
      const parentId = randomReply.parentId;
      const postsWithSearchTermAndParent = posts.reduce((acc, post) => {
        return acc.concat(post.replies.filter(reply => {
          return (reply.body.indexOf(searchTerm) > -1
            && reply.parentId.toString() === parentId.toString());
        }));
      }, []);

      const retrievedPosts = await db.searchPosts({
        query: searchTerm.toLowerCase(),
        parentId,
      });
      const matchingPostsLength = postsWithSearchTermAndParent.length;

      expect(retrievedPosts).to.be.an('object');
      expect(retrievedPosts).to.have.property('total').to.equal(
        matchingPostsLength);
      expect(retrievedPosts).to.have.property('length').to.equal(
        matchingPostsLength);
      expect(retrievedPosts).to.have.property('posts').to.be.an('array')
        .and.to.have.lengthOf(matchingPostsLength);

      retrievedPosts.posts.forEach(post => {
        expect(post).to.have.property('id').to.be.an('object');
        expect(post).to.have.property('authorId').to.be.a('string');
        expect(post).to.have.property('parentId').to.equal(parentId);
        expect(post).to.have.property('body').to.equal(searchTerm);
        expect(post).to.have.property('creationDate').to.be.instanceOf(Date);
      });
    });

    it('should return only posts of parent post if parentId is specified as a mongoose ObjectId object', async () => {
      const randomPost = getRandomData(posts);
      const randomReply = getRandomData(randomPost.replies);
      const searchTerm = randomReply.body;
      const parentId = randomReply.parentId;
      const postsWithSearchTermAndParent = posts.reduce((acc, post) => {
        return acc.concat(post.replies.filter(reply => {
          return (
            reply.body.indexOf(searchTerm) > -1
            && reply.parentId === parentId
          );
        }));
      }, []);

      const retrievedPosts = await db.searchPosts({
        query: searchTerm.toLowerCase(),
        parentId: mongoose.Types.ObjectId(parentId),
      });
      const matchingPostsLength = postsWithSearchTermAndParent.length;

      expect(retrievedPosts).to.be.an('object');
      expect(retrievedPosts).to.have.property('total').to.equal(
        matchingPostsLength);
      expect(retrievedPosts).to.have.property('length').to.equal(
        matchingPostsLength);
      expect(retrievedPosts).to.have.property('posts').to.be.an('array')
        .and.to.have.lengthOf(matchingPostsLength);

      retrievedPosts.posts.forEach(post => {
        expect(post).to.have.property('id').to.be.an('object');
        expect(post).to.have.property('authorId').to.be.a('string');
        expect(post).to.have.property('parentId').to.equal(parentId);
        expect(post).to.have.property('body').to.equal(searchTerm);
        expect(post).to.have.property('creationDate').to.be.instanceOf(Date);
      });
    });

    it('should search only posts of specified parent and author', async () => {
      const randomPost = getRandomData(posts);
      const randomReply = getRandomData(randomPost.replies);
      const searchTerm = randomReply.body;
      const parentId = randomReply.parentId;
      const authorId = randomReply.authorId;
      const postsWithSearchTermParentAndAuthor = posts.reduce((acc, post) => {
        return acc.concat(post.replies.filter(reply => {
          return (
            reply.body.indexOf(searchTerm) > -1
            && reply.parentId === parentId
            && reply.authorId === authorId
          );
        }));
      }, []);

      const retrievedPosts = await db.searchPosts({
        query: searchTerm.toLowerCase(),
        parentId,
        authorId,
      });
      const matchingPostsLength = postsWithSearchTermParentAndAuthor.length;

      expect(retrievedPosts).to.be.an('object');
      expect(retrievedPosts).to.have.property('total').to.equal(
        matchingPostsLength);
      expect(retrievedPosts).to.have.property('length').to.equal(
        matchingPostsLength);
      expect(retrievedPosts).to.have.property('posts').to.be.an('array')
        .and.to.have.lengthOf(matchingPostsLength);

      retrievedPosts.posts.forEach(post => {
        expect(post).to.have.property('id').to.be.an('object');
        expect(post).to.have.property('authorId').to.equal(authorId);
        expect(post).to.have.property('parentId').to.equal(parentId);
        expect(post).to.have.property('body').to.equal(searchTerm);
        expect(post).to.have.property('creationDate').to.be.instanceOf(Date);
      });
    });

    it('should sort by DESC creationDate if no sort order is specified', async () => {
      const randomPost = getRandomData(posts);
      const searchTerm = randomPost.body;
      const postsWithSearchTerm = posts.filter(post => {
        return post.body.indexOf(searchTerm) > -1
      });
      const results = await db.searchPosts({
        query: searchTerm.toLowerCase(),
      });
      const sortedPosts = postsWithSearchTerm.sort((a, b) => {
        return new Date(b.creationDate) - new Date(a.creationDate);
      });
      const matchingPostsLength = postsWithSearchTerm.length;

      expect(results).to.be.an('object');
      expect(results).to.have.property('total').to.equal(
        matchingPostsLength);
      expect(results).to.have.property('length').to.equal(
        matchingPostsLength);
      expect(results).to.have.property('posts').to.be.an('array')
        .and.to.have.lengthOf(matchingPostsLength);

      const retrievedPosts = results.posts;

      retrievedPosts.forEach(post => {
        expect(post).to.have.property('id').to.be.an('object');
        expect(post).to.have.property('authorId').to.be.a('string');
        expect(post).to.have.property('body').to.equal(searchTerm);
        expect(post).to.have.property('creationDate').to.be.instanceOf(Date);
      });

      for(let i = 0; i < retrievedPosts.length; i++) {
        expect(retrievedPosts[i].id.toString()).to.equal(sortedPosts[i].id.toString());
      }
    });

    it('should sort by DESC creationDate if invalid creationDate sort order is specified', async () => {
      const randomPost = getRandomData(posts);
      const searchTerm = randomPost.body;
      const postsWithSearchTerm = posts.filter(post => {
        return post.body.indexOf(searchTerm) > -1
      });
      const results = await db.searchPosts({
        query: searchTerm.toLowerCase(),
        orderBy: {
          creationDate: 'order-can-only-be-ASC-or-DESC',
        }
      });
      const sortedPosts = postsWithSearchTerm.sort((a, b) => {
        return new Date(b.creationDate) - new Date(a.creationDate);
      });
      const matchingPostsLength = postsWithSearchTerm.length;

      expect(results).to.be.an('object');
      expect(results).to.have.property('total').to.equal(
        matchingPostsLength);
      expect(results).to.have.property('length').to.equal(
        matchingPostsLength);
      expect(results).to.have.property('posts').to.be.an('array')
        .and.to.have.lengthOf(matchingPostsLength);

      const retrievedPosts = results.posts;

      retrievedPosts.forEach(post => {
        expect(post).to.have.property('id').to.be.an('object');
        expect(post).to.have.property('authorId').to.be.a('string');
        expect(post).to.have.property('body').to.equal(searchTerm);
        expect(post).to.have.property('creationDate').to.be.instanceOf(Date);
      });

      for(let i = 0; i < retrievedPosts.length; i++) {
        expect(retrievedPosts[i].id.toString()).to.equal(sortedPosts[i].id.toString());
      }
    });

    it('should sort by ASC creationDate if specified', async () => {
      const randomPost = getRandomData(posts);
      const searchTerm = randomPost.body;
      const postsWithSearchTerm = posts.filter(post => {
        return post.body.indexOf(searchTerm) > -1
      });
      const results = await db.searchPosts({
        query: searchTerm.toLowerCase(),
        orderBy: {
          creationDate: 'asc',
        }
      });
      const sortedPosts = postsWithSearchTerm.sort((a, b) => {
        return new Date(a.creationDate) - new Date(b.creationDate);
      });
      const matchingPostsLength = postsWithSearchTerm.length;

      expect(results).to.be.an('object');
      expect(results).to.have.property('total').to.equal(
        matchingPostsLength);
      expect(results).to.have.property('length').to.equal(
        matchingPostsLength);
      expect(results).to.have.property('posts').to.be.an('array')
        .and.to.have.lengthOf(matchingPostsLength);

      const retrievedPosts = results.posts;

      retrievedPosts.forEach(post => {
        expect(post).to.have.property('id').to.be.an('object');
        expect(post).to.have.property('authorId').to.be.a('string');
        expect(post).to.have.property('body').to.equal(searchTerm);
        expect(post).to.have.property('creationDate').to.be.instanceOf(Date);
      });

      for(let i = 0; i < retrievedPosts.length; i++) {
        expect(retrievedPosts[i].id.toString()).to.equal(sortedPosts[i].id.toString());
      }
    });
  });

  describe('Get Post By Id', () => {
    beforeEach(done => {
      createTestPosts(done);
    });

    const post = getRandomData(posts);

    it('should return no result for a non-existent post id', async () => {
      const foundPost = await db.findPostById(post.authorId);

      expect(foundPost).to.be.null;
    });

    it('should return an existent post by its id', async () => {
      const foundPost = await db.findPostById(post.id);

      expect(foundPost).to.be.an('object');
      expect(foundPost).to.have.property('id').to.be.an('object');
      expect(foundPost).to.have.property('authorId').to.equal(post.authorId);
      expect(foundPost).to.have.property('body').to.equal(post.body);
      expect(foundPost).to.have.property('creationDate').to.be.instanceOf(Date);
    });
  });

  describe('Delete Post By Id', () => {
    beforeEach(done => {
      createTestPosts(done);
    });

    it('should delete an existent post by its id', async () => {
      const post = getRandomData(posts);
      let foundPost = null;

      foundPost = await db.findPostById(post.id);

      expect(foundPost).to.be.an('object');
      expect(foundPost).to.have.property('id').to.be.an('object');
      expect(foundPost).to.have.property('authorId').to.equal(post.authorId);
      expect(foundPost).to.have.property('body').to.equal(post.body);
      expect(foundPost).to.have.property('creationDate').to.be.instanceOf(Date);

      await db.deletePost(post.id);

      foundPost = await db.findPostById(post.id);

      expect(foundPost).to.be.null;
    });
  });*/
});
