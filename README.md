# Express User Manager
[![npm](https://img.shields.io/npm/v/express-user-manager)](https://npmjs.com/package/express-user-manager)
[![Travis build](https://img.shields.io/travis/com/simplymichael/express-user-manager)](https://travis-ci.com/github/simplymichael/express-user-manager)
[![Codecov](https://img.shields.io/codecov/c/github/simplymichael/express-user-manager)](https://codecov.io/gh/simplymichael/express-user-manager)
[![npm downloads](https://img.shields.io/npm/dw/express-user-manager)](https://npm.im/express-user-manager)
[![GitHub License](https://img.shields.io/github/license/simplymichael/express-user-manager)](https://github.com/simplymichael/express-user-manager/LICENSE.md)
[![Conventional commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-brightgreen.svg)](https://conventionalcommits.org)

A user management and authentication library for Express apps.

It automatically creates and adds the following API endpoints to an Express app:

- user registration
- user login
- user logout
- user retrieval
- users listing
- user searching
- user data update
- user account deletion

Additional features include:

- customizable API endpoints
- support for multiple database engines and data-storage mechanisms
- customization of the minimum and maximum length of passwords
- specification of non-secure passwords that should not be allowed for use as passwords

# Table of Contents

- **[Installation](#installation)**
- **[Quick start](#quick-start)**
- **[The `init` method](#the-init-method)**
- **[Configuration](#configuration)**
    - **[Environment variables](#environment-variables)**
    - **[The `config` method](#the-config-method)**
    - **[Specifying custom API endpoints](#specifying-custom-api-endpoints)**
- **[Built-in middlewares](#built-in-middlewares)**
- **[Built-in data stores (database drivers)](#built-in-data-stores)**
- **[Emitted events](#emitted-events)**
    - **[Events emitted by the database](#events-emitted-by-the-database)**
    - **[Events emitted by request handlers](#events-emitted-by-request-handlers)**
    - **[Events emitted by middlewares](#events-emitted-by-middlewares)**
- **[Password constraints](#password-constraints)**
- **[Usage as a stand-alone server](#usage-as-a-stand-alone-server)**
- **[Requests and responses](#requests-and-responses)**
- **[Contributing](#contributing)**
    - **[Report a bug](#report-a-bug)**
    - **[Request a new feature](#request-a-new-feature)**
    - **[Submit a pull request](#submit-a-pull-request)**
    - **Checkout the [Contributing guide](#contributing-guide)**
- **[CHANGELOG](#changelog)**

## Installation
`npm install --save express-user-manager`

## Quick start
```
const express = require('express');
const userManager = require('express-user-manager');
const app = express();

/**
 * Setup the datastore using any of the currently supported database adapters:
 *   - mongoose: for MongoDB
 *   - sequelize: for any of the other supported database engines:
 *     MySQL | MariaDB | SQLite | Microsoft SQL Server | Postgres | In-memory DB
 *     (See the section on "Built-in data stores" for supported database engines)
 */
const dbAdapter = 'mongoose'; // OR 'sequelize'
const store = userManager.getDbAdapter(dbAdapter);

// Bind the routes under [apiMountPoint] (default: ***/api/users***):
userManager.listen(expressApp, apiMountPoint = '/api/users', customRoutes = {});

(async function() {
  const server = http.createServer(app);

  // Establish a connection to the data store
  // Ensure the db is connected before binding the server to the port
  await store.connect({
    host: DB_HOST, // optional, default: 'localhost'
    port: DB_PORT, // optional, default: 27017
    user: DB_USERNAME, // optional
    pass: DB_PASSWORD, // optional
    engine: DB_ENGINE, // optional if the adapter is "mongoose" or if the value is "memory" and the adapter is "sequelize"; required otherwise
    dbName: DB_DBNAME, // optional, default: 'users'
    storagePath: DB_STORAGE_PATH, // optional, required if "engine" is set to "sqlite"
    debug: DB_DEBUG, // optional, default: false
    exitOnFail: EXIT_ON_DB_CONNECT_FAIL // optional, default: true
  });

  // Proceed with normal server initialization tasks
  server.listen(PORT);
  server.on('error', onError);
  server.on('listening', onListening);
 })();

// Optionally listen for and handle events
// (See the **[Emitted events](#emitted-events)** section for more)
userManager.on(EVENT_NAME, function(data) {
  // do something with data
});
```

**Quick notes**
- The `expressApp` parameter has the following constraints:
    - It must be an express app (that is, an app created using `const app = express()`)
    - It MUST NOT be an express server, that is, it must not have been passed to `http.createServer(app)`
- The `apiMountPoint` parameter allows you to specify the base API route.
  Every request to the API will be relative to this base route. The default is `/api/users`.
- The `customRoutes` parameter is an object that allows customization of the routes.

  (See **[Specifying custom API endpoints](#specifying-custom-api-endpoints)** for more)
- If your ***expressApp*** has its own custom routing in place,
  make sure to call `userManager.listen(expressApp)` before setting up your app's custom 404 handler.

  This is because your app's 404 handler is meant to trap requests sent to routes that have no explicit handler in your app's routing system.

  Consequently, if you setup your app's custom 404 handler before calling `userManager.listen()`,
  requests to routes handled by the `userManager`'s routing system will never get to it as they will be trapped and handled by your 404 handler.

## The `init` method
The `init` method provides a shortcut way to perform the setup and initialization steps above.

It is an `async` function that runs setup and initialization tasks, connects to the database, then starts listening for requests,
all in a single step: `await init(app, options);`.

It takes two parameters:
- an express.js app as the first argument
- an object
  (with the same signature as the object passed to the **[`config`](#the-config-method)** method)
  as the second argument.

## Configuration
express-user-manager can be configured in several ways:

- using environment variables (See the **[Environment variables](#environment-variables)** section)
- using the `config` method (See **[The config method](#the-config-method)**)
- passing configuration options as the second parameter to the `init(app, options)` method
- using a combination of environment variables and the `config` method
    - if configuration is not set via `config`, then configuration values are searched in environment variables.
    - if only some configuration options are set using `config`, then the others are searched for in environment variables.
    - The configuration options set via `config` take precedence over environment variables.
    - the arguments passed to the `listen` or `init` methods take precedence over configuration options set using `config`.

### Environment variables

- **`NODE_ENV`** (*string*): The environment in which the app is running: *development*, *production*, *staging*, *test*, etc.
- **`API_MOUNT_POINT`** (*string*): The route under which to listen for API requests, default is: `/api/users`
- **`PORT`**: The port on which the server is running (or should run, if using as a stand-alone server)
- **`DB_ENGINE`**: The database engine to use. Should be one of the supported databases.
  (See **[Built-in data stores (database drivers)](#built-in-data-stores)**)
- **`DB_ADAPTER`**: The adapter to use. Set it to `mongoose` if using MongoDB; Set it to `sequelize` otherwise.
- **`DB_STORAGE_PATH`**: Define this only when the **DB_ENGINE** is set to `sqlite`.
- **`DB_HOST`**: The database host
- **`DB_USERNAME`**: The database user
- **`DB_PASSWORD`**: The database user's password
- **`DB_DBNAME`**: The name of the database
- **`DB_PORT`**: The port on which the database is running
- **`DB_DEBUG`**: Set to `true` or a non-zero integer to display debug output for the database.
- **`EXIT_ON_DB_CONNECT_FAIL`**: Set to `true` or a non-zero integer if the app should exit if it is unable to establish a connection to the database.
- **`SESSION_SECRET`** (*string*)
- **`AUTH_TOKEN_SECRET`** (*string*)
- **`AUTH_TOKEN_EXPIRY`** (*number*): Authorization token expiry (in seconds)
- **`PASSWORD_MIN_LENGTH`** (*number*)
- **`PASSWORD_MAX_LENGTH`** (*number*)
- **`DISALLOWED_PASSWORDS`**: (*array*): A comma-separated list of weak/non-secure passwords that should not allowed to be used as passwords

**Note**: **express-user-manager** uses the [dotenv][dotenv] package,
so a quick and easy way to define the above variables is to create a ***.env*** file
at the root of your project directory, and add them to the file
and they will automatically be picked up. [Sample .env file][env]

### The `config` method
As stated earlier in the [Configuration](#configuration) section,
one of the ways you can configure *express-user-manager* is by using the `config` method.

This method provides an alternate way to pass configuration values to *express-user-manager**
if you haven't done (or are unable to do) so via environment variables.

Below is an example touching on every setting:
- **`apiMountPoint`**: (*string*) specifies the users API routes base route
- **`password`**: (*object*) for configuring minimum and maximum password length, as well as disallowed passwords
- **`routes`**: (*object*) for setting up [custom API endpoints](#specifying-custom-api-endpoints)
- **`db`**: (*object*) encapsulating database connection information
- **`security`**: (*object*) for configuring session and authorization tokens and expiry

```
const express = require('express');
const userManager = require('express-user-manager');
const app = express();
const dbAdapter = 'mongoose'; // OR 'sequelize'

// Call config(options) to configure the app
userManager.config({
  apiMountPoint: {string}, // The base route under which to listen for API requests

  password: { // {object} for password configuration
    minLength: {number}, // minimum length of user passwords, default: 6,
    maxLength: {number}, // maximum length of user passwords, default: 20
    disallowed: {string | array}, // comma-separated string or array of strings considered weak/non-secure passwords
  },

  routes: { // {object} for configuring custom routes, with members
    list: {string}, // specifies the path for getting users listing
    search: {string}, specifies the path for searching users
    getUser: {string}, // specifies the path for getting a user's details via their username, a /:{username} is appended to this path
    signup: {string}, // specifies the user registration path
    login: {string}, // specifies user authentication path,
    logout: {string}, // defines the logout path
    updateUser: {string} // specifies the path for updating a user's data
    deleteUser: {string} // specifies the path for deleting a user, a /:{userId} is appended to this path
  },

  db: { // {object} for configuring the database connection
    adapter: {string}, // the adapter to use. valid values include 'mongoose', 'sequelize'
    host: {mixed}, // database host
    port: {number}, // database port
    user: {string}, // database user
    pass: {string}, // database user's password
    engine: {string}, // the database engine, when the adapter is set to "sequelize". values: 'memory', 'mariadb', 'mssql', 'mysql', 'postgres', 'sqlite'
    dbName: {string}, // name of the database to connect to
    storagePath: {string}, // the database storage path, only valid when "engine" is "sqlite". combined with `dbName`: `${storagePath}/${dbName}.sqlite`
    debug: {boolean}, // a value of true outputs database debug info
    exitOnFail: {boolean}, // set to true to kill the Node process if database connection fails
  },

  security: { // {object} for configuring security
    sessionSecret: {string}, // a key for encrypting the session
    authTokenSecret: {string}, // a key for signing the authorization token
    authTokenExpiry: {number}, // the expiry time of the authorization token (in seconds), example: 60 * 60 * 24
  }
});

async(() => {
  /**
   * The dbAdapter argument is not required if it is either:  
   *   - specified in the db section of the call to config or as
   *   - set using the DB_ADAPTER environment variable
   */
  const store = userManager.getDbAdapter([dbAdapter]);

  /**
   * The connectionOptions are not required if the values:
   *   - are already specified in the db section of the call to config
   *   - are set using the DB_* environment variables
   */
  await store.connect([connectionOptions]);

  // If the dbAdapter and connection values are already specified
  // via config or via environment variables,
  // then the above two calls can be tersely combined in a single call:
  // await userManager.getDbAdapter().connect();
});

// Bind request listeners
userManager.listen(expressApp);
```

**Notes on configuration settings**:
- Any of the above settings can be omitted in the call to `config` if they are already defined using environment variables.
  The exception to this is **`routes`**, which cannot be set via an environment variable.
  However, you can set it using the third parameter to the call to `listen(app, apiMountPoint, routes)`.
- If a setting is defined as an environment variable and also set in the call to `config`,
  the value set in `config` will take precedence and be used instead.
- The **`apiMountPoint`** can be set (in increasing order of precedence):
    - using the environment variable **API_MOUNT_POINT**
    - using the **`apiMountPoint`** key in the options to `config`
    - as the second parameter to the call to `listen(app, apiMountPoint, routes)`

### Specifying custom API endpoints
To customize the request paths, either:
- pass a `routes` property with the API endpoints to `config`:
  ```
  userManager.config({
    routes: customApiEndpoints
  });

  userManager.listen(expressApp, apiMountPoint);
  ```
- pass an object with the API endpoints as the last parameter to `userManager.listen`
  `userManager.listen(expressApp, apiMountPoint, customApiEndpoints)`

Below is the default definition of the API Endpoints, which can be modified for your custom routes:
```
const customApiEndpoints = {
  list       : '/',       // Resolves to [apiMountPoint]/
  search     : '/search', // Resolves to [apiMountPoint]/search
  getUser    : '/user',   // Resolves to [apiMountPoint]/user/:username
  signup     : '/',       // Resolves to [apiMountPoint]/
  login      : '/login',  // Resolves to [apiMountPoint]/login
  logout     : '/logout', // Resolves to [apiMountPoint]/logout
  updateUser : '/',       // Resolves to [apiMountPoint]/
  deleteUser : '/user',   // Resolves to [apiMountPoint]/user/:userId
};
```

As seen above, the default object has a number of properties, each corresponding to a request path:
- **list** : Specifies the path to get users listing
- **search** : Specifies the path to search for users
- **getUser** : Specifies the path to get a user by username
(a `/:username` is automatically appended to the end of this route)
- **signup** : Specifies the path for creating (i.e., registering) a new user
- **login** : Specifies the path for logging in a user (an authorization key is returned on successful login)
- **logout** : Specifies the path to log out a user
- **deleteUser** : Specifies the path for deleting user by id
(a `/:userId` is automatically appended to the end of this route)

## Built-in middlewares
The **userManager** module provides some middlewares.
You can get them by calling: `userManager.get('middlewares');`.
This will return an object with the following middlewares:
- **authorized**:
  For protected resources.
  It ensures an access/authorization token is sent along with the request
  using the ***Authorization*** header.
- **loadUser**:
  Loads the current user (identified by *username*) into the request,
  to that it is available to other middlewares in the middleware chain.
  The username is sent as part of the request parameters (*request.params*)
- **loggedIn**:
  Ensures a user is logged in before they can perform the requested action.
- **notLoggedIn**
  Ensures that the target action is available only to users who are not logged in.
  For example, registration and login should (normally) not be permissible
  if the current user is already logged in.
- **restrictUserToSelf**:
  Constrains a user to performing certain actions only on their own account.

<a name="built-in-data-stores"></a>
## Built-in data stores (database adapters and engines)
- In-memory (Adapter: [sequelize](https://www.npmjs.com/package/sequelize))
    - **Note**: In-memory storage should be used solely for quick prototyping and testing purposes. It is not recommended for use in production.
- MariaDB (Adapter: [sequelize](https://www.npmjs.com/package/sequelize), Engine: `mariadb`)
- Microsoft SQL Server (Adapter: [sequelize](https://www.npmjs.com/package/sequelize), Engine: `mssql`)
- MongoDB (Adapter: [mongoose](https://www.npmjs.com/package/mongoose))
- MysQL (Adapter: [sequelize](https://www.npmjs.com/package/sequelize), Engine: `mysql`)
- Postgres (Adapter: [sequelize](https://www.npmjs.com/package/sequelize), Engine: `postgres`)
- SQLite (Adapter: [sequelize](https://www.npmjs.com/package/sequelize), Engine: `sqlite`)

<a name="emitted-events"></a>
## Emitted events

<a name="events-emitted-by-the-database"></a>
### Events emitted by the database
- dbConnection
- dbDisconnect
- createUser

<a name="events-emitted-by-request-handlers"></a>
### Events emitted by request handlers
- signupError
- signupSuccess
- loginError
- loginSuccess
- logoutSuccess
- getUsersError
- getUsersSuccess
- searchUsersError
- searchUsersSuccess
- getUserSuccess
- updateUserError
- updateUserSuccess
- deleteUserError
- deleteUserSuccess

<a name="events-emitted-by-middlewares"></a>
### Events emitted by middlewares
- actionNotPermittedError
- authorizationError
- authenticationError
- getUserError

<a name="password-constraints"></a>
## Password constraints
- minimum length of `PASSWORD_MIN_LENGTH` environment variable
- maximum length of `PASSWORD_MAX_LENGTH` environment variable
- must contain at least one number
- must contain at least an uppercase character
- must contain at least a lowercase character
- must not be among the values specified in the `DISALLOWED_PASSWORDS` environment variable

## Usage as a stand-alone server
The package comes with a built-in express server that allows you run it as a stand-alone server.

To run it as a stand-alone server, do the following:  
- Ensure you have a server running for your preferred database engine.
  (See **[Setting up test databases](#setting-up-test-databases)** for some examples)
- Define the environment variables listed in the **[Environment variables](#environment-variables)** section.
- start the server, using one of these two methods:
    - Run `node express-user-manager/src/server` from within the parent directory containing the express-user-manager package.
    - `require('express-user-manager/src/server')();` from within a `node.js` script. For example, inside an `index.js` file.
      Then run the file using node: `node index.js`.

**Note**: The built-in server runs using the default settings. That means:
- it runs under the `/api/users` base route.
- it uses the default request paths. (See the section on **Requests and responses**)

<a name="requests-and-responses"></a>
## Requests and responses
Every route below is assumed to begin (i.e., prefixed) with the base API route.
The default base API route is **`/api/users`**.

- **Create user**
    - route: `POST /`
    - protected: `false`
    - request headers: none
    - request parameters: none
    - request body: `{ firstname, lastname, username, email, password, confirmPassword }`
    - response:
      ```
      {
        "data": {
          "user": { id, firstname, lastname, fullname, email, username, signupDate }
        }
      }
      ```
- **Get user details by username**
    - route: `GET /user/USERNAME`
    - protected: false
    - request headers: none
    - request parameters: none
    - request body: none
    - response:
      ```
      {
        "data": {
          "user": { id, firstname, lastname, fullname, email, username, signupDate }
        }
      }
      ```
- **Retrieve list of users**
    - route: `GET /`
    - protected: `false`
    - request headers: none
    - request parameters:
        - `firstname` (string, optional): get users matching {firstname}
        - `lastname` (string, optional): get users matching {lastname}
        - `sort` (string, optional)
        - `page` (number, optional, default = 1)
        - `limit` (number, optional, default = 20)
    - request body: none
    - response:
      ```
      {
        "data": {
          "total": TOTAL_COUNT_OF_MATCHING_RESULTS,
          "length": COUNT_OF_CURRENT_RESULTS_RETURNED, // determined by "page" and "limit"
          "users": [
            { id, firstname, lastname, fullname, email, username, signupDate },
            { id, firstname, lastname, fullname, email, username, signupDate },
            ...
          ]
        }
      }
      ```
- **Search for users**
    - route: `GET /search?query=SEARCH_TERM`
    - protected: `false`
    - request headers: none
    - request parameters:
        - `query` (string, required)
        - `sort` (string, optional)
        - `by` (string, optional)
        - `page` (number, optional, default = 1)
        - `limit` (number, optional, default = 20)
    - request body: none
    - response:
      ```
      {
        "data": {
          "total": TOTAL_COUNT_OF_MATCHING_RESULTS,
          "length": COUNT_OF_CURRENT_RESULTS_RETURNED, // determined by "page" and "limit"
          "users": [
            { id, firstname, lastname, fullname, email, username, signupDate },
            { id, firstname, lastname, fullname, email, username, signupDate },
            ...
          ]
        }
      }
      ```
    - examples:  
        - Search for users with **james** in their firstname, lastname, username, or email:

          `GET HOST:PORT/api/users/search?query=james`
        - Search for users with **james** in their username or email:

          `GET HOST:PORT/api/users/search?query=james&by=username:email`
        - Sort by firstname (asc), lastname (asc), email (desc), creationDate (asc):

          `GET HOST:PORT/api/users/search?query=james&sort=firstname:asc=lastname=email:desc=creationDate`
        - Return the 3rd page of results and limit returned results to a maximum of 15 users:

          `GET HOST:PORT/api/users/search?query=james&page=3&limit=15`
- **Login**
    - route: `POST /login`
    - protected: `false`
    - request headers: none
    - request parameters: none
    - request body:
      ```
      {
        "login": EMAIL | USERNAME,
        "password": USER_PASSWORD,
      }
      ```
    - response:
      ```
      {
        "data": {
          "user": { id, firstname, lastname, fullname, email, username, signupDate },
          "authorization": {
            "token": "Bearer TOKEN_STRING",
            "expiresIn": "86400s"
          }
        }
      }
      ```
- **Logout**
    - route: `GET /logout`
    - protected: `false`
    - request headers: none
    - request body: none
    - request parameters: none
    - response: `{}`
- **Update user data**
    - route: `PUT /`
    - protected: `true`
    - request headers:
      ```
      {
        "Authorization": "Bearer TOKEN_STRING"
      }
      ```
    - request parameters: none
    - request body: `{ id, firstname, lastname, username, email }`
    - response:
      ```
      {
        "data": {
          "user": { id, firstname, lastname, fullname, email, username, signupDate }
        }
      }
      ```
- **Delete user by ID**
    - route: `DELETE /user/USER_ID`
    - protected: `true`
    - request headers:
      ```
      {
        "Authorization": "Bearer TOKEN_STRING"
      }
      ```
    - request body:
      ```
      {
        "userId": USER_ID
      }
      ```
    - response `{}`

## Contributing
- <a name="report-a-bug">[Report a bug][bug]</a>
- <a name="request-a-new-feature">[Request a new feature][fr]</a>
- <a name="submit-a-pull-request">[Submit a pull request][pr]</a>
- <a name="contributing-guide">Checkout the [Contributing guide][contribute]</a>

## CHANGELOG
See [CHANGELOG][changelog]


[pr]: https://docs.github.com/en/free-pro-team@latest/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request
[fr]: https://github.com/simplymichael/express-user-manager/labels/feature%20request
[bug]: https://github.com/simplymichael/express-user-manager/labels/bug
[env]: https://github.com/simplymichael/express-user-manager/blob/master/.env.example
[dotenv]: https://www.npmjs.com/package/dotenv
[changelog]: https://github.com/simplymichael/express-user-manager/blob/master/CHANGELOG.md
[contribute]: https://github.com/simplymichael/express-user-manager/blob/master/CONTRIBUTING.md
