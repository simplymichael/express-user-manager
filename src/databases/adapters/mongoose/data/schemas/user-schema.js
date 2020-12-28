const Schema = require('mongoose').Schema;
const emailValidator = require('email-validator');
const { virtualSchemaOptions } = require('./_schema-helper.js');
const schemaDefinition = {
  username: {
    type: String,
    unique: true,
    required: true,
  },
  name: {
    first: { type: String, required: true },
    last: { type: String, required: true },
  },
  email: {
    type: String,
    required: true,
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
  generateSearchQuery: function(str, { by = '', page = 1, limit = 0, orderBy = {} }) {
    by = by.trim();

    // Prepare the searchBy clause
    let searchBy = [];
    const regex = new RegExp(str, 'i');

    //?by=firstname:lastname:username
    if(by && by.length > 0) {
      const byData = by.split(':');

      byData.forEach(key => {
        key = key.trim();

        if(key) {
          switch(key.toLowerCase()) {
          case 'firstname' : searchBy.push({ 'name.first': regex }); break;
          case 'lastname'  : searchBy.push({ 'name.last': regex }); break;
          default          : searchBy.push({ [key]: regex }); break;
          }
        }
      });
    } else {
      searchBy = [
        { username: regex },
        { email: regex },
        { 'name.first': regex },
        { 'name.last': regex }
      ];
    }

    const where = searchBy.length === 1 ? searchBy[0] : { '$or': searchBy };

    return this.generateQuery({ where, page, limit, orderBy });
  },
  countUsers: async function(where) {
    if(typeof where === 'object') {
      return await this.countDocuments(where); //this.count(where);
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
  getById: async function(id) {
    return await this.findById(id);
  },
  deleteUser: async function(id) {
    return await this.findOneAndRemove({ _id: id });
    //return await this.findByIdAndRemove(id);
  },
};

module.exports = UserSchema;
