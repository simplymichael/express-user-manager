const Schema = require('mongoose').Schema;
const emailValidator = require('email-validator');
const { virtualSchemaOptions } = require('./_schema-helper.js');
const schemaDefinition = {
  username: {
    type: String,
    unique: true,
    lowercase: true,
    required: true,
  },
  name: {
    first: { type: String, required: true },
    last: { type: String, required: true },
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    validate: [
      (email) => emailValidator.validate(email),
      'Please provide a valid email'
    ],
  },
  password: {
    type: String,
    required: true
  },
  meta: {
    created_at: {
      type: Date,
      required: true,
      'default': Date.now,
      set: function() {
        if(this.isNew) {
          return Date.now();
        } else {
          return this.meta.created_at;
        }
      },
    },
    updated_at: {
      type: Date,
      'default': Date.now
    }
  },
};

const UserSchema = new Schema(schemaDefinition, virtualSchemaOptions);

UserSchema.pre('save', function(next) {
  if(this.isNew) {
    this.meta.created_at = Date.now();
  }

  this.meta.updated_at = undefined;
  next();
});

UserSchema.virtual('id').get(function() {
  return this._id;
});

UserSchema
  .virtual('firstname')
  .get(function() {
    return this.name.first;
  });

UserSchema
  .virtual('lastname')
  .get(function() {
    return this.name.last;
  });

UserSchema
  .virtual('fullname')
  .get(function() {
    return [this.name.first, this.name.last].join(' ');
  })
  .set(function(fullName) {
    var nameParts = fullName.split(' ');
    this.name.last = nameParts.pop();
    this.name.first = nameParts.join(' ');
  });

UserSchema
  .virtual('signupDate')
  .get(function() {
    return this.meta.created_at;
  });

// Create custom versions of:
// find(), count(), findOneAndUpdate(), etc
UserSchema.statics = {
  ...UserSchema.statics,
  generateQuery: function({ where = {}, page = 1, limit = 0, orderBy = {} }) {
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    const SORT = { ASC: '1', DESC: '-1' };
    const OFFSET = ((typeof page === 'number' && page > 0) ? page - 1 : 0);
    const LIMIT = ((typeof limit === 'number' && limit > 0) ? limit : 0);
    const WHERE = (where && typeof where === 'object' ? where : {});
    const query = this.find(WHERE);

    for(let [key, val] of Object.entries(orderBy)) {
      let value = val.toUpperCase();
      query.sort({
        [key]: Object.keys(SORT).includes(value) ? SORT[value] : SORT['ASC']
        // using: sort({<FIELD>: 1/-1})
      });
    }

    // Order by most recent registrations by default,
    // unless client specifies otherwise
    if(!Reflect.has(orderBy, 'signupDate') ||
       !Object.keys(SORT).includes(orderBy.signupDate.toUpperCase())) {
      query.sort({ 'meta.created_at': SORT.DESC });
      // using: sort('[-]<FIELD>');
    } else {
      query.sort({
        'meta.created_at': orderBy.signupDate.toUpperCase() === 'ASC'
          ? SORT.ASC
          : SORT.DESC
      });
    }

    query.skip(OFFSET * LIMIT);

    if(LIMIT > 0) {
      query.limit(LIMIT);
    }

    return query;
  },
  generateSearchQuery: function(str, { page = 1, limit = 0, orderBy = {} }) {
    const regex = new RegExp(str, 'i');
    const where = {
      '$or': [
        { username: regex },
        { email: regex },
        { 'name.first': regex },
        { 'name.last': regex }
      ]
    };

    return this.generateQuery({ where, page, limit, orderBy });
  },
  countUsers: async function(where) {
    if(typeof where === 'object') {
      return await this.count(where);
    } else {
      return await this.estimatedDocumentCount();
    }
  },
  updateUser: async function(id, updateData) {
    return await this.findOneAndUpdate({ _id: id }, updateData);
  },
  updateUsers: async function(where = {}, updateData) {
    return await this.updateMany(where, updateData);
  },
  userExists: async function(id) {
    return await this.findById(id);
  }
};

UserSchema.methods = {
  ...UserSchema.methods,
  getQuestions: async function({ where = {}, page= 1, limit= 0, orderBy= {} }) {
    where = (typeof where === 'object' ? where : {});
    where.author = this._id;

    return (
      await this.model('Question')
        .getQuestions({ where, page, limit, orderBy })
    );
  },

  getAnswers: async function({ where = {}, page= 1, limit= 0, orderBy= {} }) {
    where = (typeof where === 'object' ? where : {});
    where.author = this._id;

    return (
      await this.model('Answer')
        .getAnswers({ where, page, limit, orderBy })
    );
  },
};

module.exports = UserSchema;
