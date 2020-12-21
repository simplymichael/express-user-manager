# Express User Manager
[![Travis (.com)](https://img.shields.io/travis/com/simplymichael/express-user-manager)](https://travis-ci.com/github/simplymichael/express-user-manager)
[![Codecov](https://img.shields.io/codecov/c/github/simplymichael/express-user-manager)](https://codecov.io/gh/simplymichael/express-user-manager)
[![npm](https://img.shields.io/npm/dw/express-user-manager)](https://npm.im/express-user-manager)
[![GitHub](https://img.shields.io/github/license/simplymichael/express-user-manager)](https://github.com/simplymichael/express-user-manager/LICENSE.md)

A user management and authentication library for Express apps.

It automatically creates and adds the following API endpoints to an Express app:

- user registration
- user login
- user logout
- user retrieval
- users listing
- user searching
- account deletion

Additional features include:

- customizable API endpoints
- support for multiple database engines and data-storage mechanisms
- customization (via environment variables) of the minimum and maximum length of passwords
- specification (via environment variable) of non-secure passwords blacklist

# Table of Contents

- **[Installation](#installation)**
- **[Quick start](#quick-start)**
- **[Usage](#usage)**
    - **[Prerequisites](#prerequisites)**
    - **[Code setup](#code-setup)**
    - **[Specifying custom API endpoints](#specifying-custom-api-endpoints)**
    - **[Using the middlewares](#using-the-middlewares)**
- **[Built-in data stores (database drivers)](#built-in-data-stores)**
- **[Methods and parameters of the `store` object](#methods-and-parameters-of-the-store-object)**
- **[Emitted events](#emitted-events)**
    - **[Events emitted by the database](#events-emitted-by-the-database)**
    - **[Events emitted by request handlers](#events-emitted-by-request-handlers)**
    - **[Events emitted by middlewares](#events-emitted-by-middlewares)**
- **[Password constraints](#password-constraints)**
- **[Usage as a stand-alone server](#usage-as-a-standalone-server)**
- **[Requests and responses](#requests-and-responses)**
- **[Contributing](#contributing)**
- **[CHANGELOG](#changelog)**

<a name="installation"></a>
## Installation
`npm install --save express-user-manager`

<a name="quick-start"></a>
## Quick start
- Set environment variables:
    - **SESSION_TOKEN_KEY**
    - **AUTH_TOKEN_KEY**
    - **AUTH_TOKEN_EXPIRY**
    - **PASSWORD_MIN_LENGTH**
    - **PASSWORD_MAX_LENGTH**
    - **PASSWORD_BLACK_LIST**: A comma-separated list of weak/non-secure passwords
- ```
  const express = require('express');
  const userManager = require('express-user-manager');
  const app = express();

  /**
   * Setup the datastore using any of the currently supported database adapters:
   *   - mongoose
   *   - sequelize (with in-memory storage or any supported database engine)
   *       (See the section on "Built-in data stores" for supported database engines)
   */
  const dbAdapter = 'mongoose'; // OR 'sequelize'
  const DataStore = userManager.getDbAdapter(dbEngine);
  const store = new DataStore();

  userManager.set('store', store);
  userManager.listen(app);

  (async function() {
    const server = http.createServer(app);

    // Ensure the db is connected before binding the server to the port
    await store.connect({
      host: DB_HOST, // optional, default: 'localhost'
      port: DB_PORT, // optional, default: 27017
      user: DB_USERNAME, // optional
      pass: DB_PASSWORD, // optional
      engine: DB_ENGINE, // optional if the adapter is mongoose or the adapter is sequelize with in-memory storage; required otherwise
      dbName: DB_DBNAME, // optional, default: 'users'
      storagePath: DB_STORAGE_PATH, // optional, required if "engine" is set to "sqlite"
      debug: DB_DEBUG, // optional, default: false
      exitOnFail: EXIT_ON_DB_CONNECT_FAIL // optional, default: true
    });

    server.listen(PORT);
    server.on('error', onError);
    server.on('listening', onListening);
  })();
  ```

<a name="usage"></a>
## Usage

<a name="prerequisites"></a>
### Prerequisites
Set the following environment variables:

- **NODE_ENV** (*string*)
- **SESSION_TOKEN_KEY** (*string*: Session sign key)
- **AUTH_TOKEN_KEY** (*string*: Authorization token sign key)
- **AUTH_TOKEN_EXPIRY** (*number*: Authorization token expiry (in seconds))

**Note**: We use the **dotenv** package,
so these variables can be defined inside a **.env** file and they will automatically be picked up.

<a name="code-setup"></a>
### Code setup
1. `const userManager = require('express-user-manager');`
2. Bind the routes under [baseApiRoute] (default: ***/api/users***):

   `userManager.listen(expressApp, baseApiRoute = '/api/users', customRoutes = {});`

    - The `expressApp` parameter has the following constraints:
        - It must be an express app (that is created with `var app = express()`)
        - It MUST NOT be an express server, that is, it must not have been passed to `http.createServer(app)`
    - The `baseApiRoute` parameter allows you to specify the base API route.
      Every request to the API will be relative to this base route. The default is `/api/users`.
    - The `customRoutes` parameter is an object that allows customization of the routes.

      (See the section on **[Specifying custom routes](#specifying-custom-api-endpoints)** for more)

   **NOTE**: If your ***expressApp*** has its own custom routing in place,
   make sure to call `userManager.listen(expressApp)` before setting up
   your app's custom 404 route handler. This is because setting up your app's 404 route handler
   before calling `userManager.listen()` will lead to every route not in
   your custom app's route handlers being handled by the
   404 handler and thus prevent any requests from getting to the
   routes that are supposed to be handled by calling `userManager.listen().`s
3. Create a data store. This can be done in one of two ways:
    - You can use one of the built-in ones:
      ```
      const DataStore = userManager.getDbAdapter('mongoose'); // for MongoDB
      // OR
      const DataStore = userManager.getDbAdapter('sequelize'); // for one of: MySQL | MariaDB | SQLite | Microsoft SQL Server | Postgres | In-memory DB

      const store = new DataStore();
      await store.connect(connectionOptions);
      ```
      (See the `connect()` method in the section on
      **[Methods and parameters of the store object](#methods-and-parameters-of-the-store-object)**
      for the expected `connectionOptions`)
    - Use a custom store object.
      The store object should implement the following (asynchronous) methods:

        - *connect(options)*
        - *disconnect()*
        - *createUser(userData)*
        - *getUsers(options)*
        - *searchUsers(options)*
        - *findByEmail(email)*
        - *findByUsername(username)*

      (See section on **[Methods and parameters of the store object](#methods-and-parameters-of-the-store-object)** for more)
4. Set the datastore: `userManager.set('store', store);`
5. Proceed with normal server initialization, e.g:
   ```
   const server = http.createServer(app);
   server.listen(port);
   server.on('error', function onError(error) {...});
   server.on('listening', function onListening() {...});
   ```
6. Listen for and handle events
   ```
   userManager.on(EVENT_NAME, function(data) {
      // do something with data
   });
   ```

<a name="specifying-custom-api-endpoints"></a>
### Specifying custom API endpoints
The last parameter to `userManager.listen()` represents an object that lets you customize the API endpoints.
The default object has a number of properties, each corresponding to a request path:
- **list** : Specifies the path to get users listing
- **search** : Specifies the path to search for users
- **getUser** : Specifies the path to get a user by username
(a `/:username` is automatically appended to the end of this route)
- **signup** : Specifies the path for creating (i.e., registering) a new user
- **login** : Specifies the path for logging in a user (an authorization key is returned on successful login)
- **logout** : Specifies the path to log out a user
- **deleteUser** : Specifies the path for deleting user by id
(a `/:userId` is automatically appended to the end of this route)

To customize the request paths,
pass an object (with the above properties as keys, and the custom paths as values)
as the third argument of the `userManager.listen()` call:
```
const customRoutes = {
  list       : '/',       // Resolves to [baseApiRoute]/
  search     : '/search', // Resolves to [baseApiRoute]/search
  getUser    : '/user',   // Resolves to [baseApiRoute]/user/:username
  signup     : '/',       // Resolves to [baseApiRoute]/
  login      : '/login',  // Resolves to [baseApiRoute]/login
  logout     : '/logout', // Resolves to [baseApiRoute]/logout
  deleteUser : '/user',   // Resolves to [baseApiRoute]/user/:userId
};

userManager.listen(expressApp, baseApiRoute, customRoutes);`
```

<a name="using-the-middlewares"></a>
### Using the middlewares
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

<a name="methods-and-parameters-of-the-store-object"></a>
## Methods and parameters of the store object
- `async connect(options)`: `options` should be an object with members:
    - host {string} the db server host
    - port {number} the db server port
    - user {string} the db server username
    - pass {string} the db server user password
    - engine {string} the database engine to use.
        - Possible values are: `memory, mariadb, mssql, mysql, postgres, sqlite`
        - This parameter is not required when using the `mongoose` adapter: `userManager.getDbAdapter('mongoose')`.
    - storagePath {string} The storage location when the `engine` is set to `postgres`.
        - The value is combined with the `dbName` option to set the storage: `${storagePath}/${dbName}.sqlite`
    - dbName {string} the name of the database to connect to
    - debug {boolean | number(int | 0)} determines whether or not to show debugging output
- `async disconnect()`
- `async createUser(userData)`: `userData` should be an object with members:
    - firstname
    - lastname
    - username
    - email
    - password
    - passwordConfirm
- `async getUsers(options)`
- `async searchUsers(options)`
- `async findByEmail(email)`
- `findByUsername(username)`

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
- getAllUsersError
- getAllUsersSuccess
- searchUsersError
- searchUsersSuccess
- getUserSuccess
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
- must not be among the values specified in the `PASSWORD_BLACK_LIST` environment variable

<a name="usage-as-a-standalone-server"></a>
## Usage as a stand-alone server
The package comes with a built-in express server that allows you run it as a stand-alone server.

To run it as a stand-alone server, do the following:  
- Ensure you have a server running for your preferred database engine.
  (See **[Setting up test databases](#setting-up-test-databases)** for some examples)
- Define the environment variables listed in the **[Quick start](#quick-start)** section.
- In addition, define the following environment variables:
    - **PORT**: The port on which the server should run
    - **DB_ENGINE**: The database engine to use. Should be one of the supported databases.
      (See **[Built-in data stores (database drivers)](#built-in-data-stores)**)
    - **DB_ADAPTER**: The adapter to use. Set it to `mongoose` if using MongoDB; Set it to `sequelize` otherwise.
    - **DB_STORAGE_PATH**: Define this only when the **DB_ENGINE** is set to `sqlite`.
    - **DB_HOST**: The database host
    - **DB_USERNAME**: The database user
    - **DB_PASSWORD**: The database user's password
    - **DB_DBNAME**: The name of the database
    - **DB_PORT**: The port on which the database is running
    - **DB_DEBUG**: Set this to `true` or a non-zero integer to display debug output for the database.
    - **EXIT_ON_DB_CONNECT_FAIL**: Set this to `true` or a non-zero integer if the app should exit if it is unable to establish a connection to the database.

  **Note**: A quick and easy way to define the above variables is to create a *.env* file at the root of your project directory, and add them to it.
  For example:
  ```
  NODE_ENV=development
  PORT=3000

  # Database
  DB_ENGINE=
  DB_ADAPTER=
  DB_STORAGE_PATH=
  DB_HOST=localhost
  DB_USERNAME=
  DB_PASSWORD=
  DB_DBNAME=users
  DB_PORT=
  DB_DEBUG=false
  EXIT_ON_DB_CONNECT_FAIL=true

  # Security
  SESSION_TOKEN_KEY=secret

  # Access/Authorization token sign key
  AUTH_TOKEN_KEY=secret

  # Access/Authorization token expiry (in seconds)
  AUTH_TOKEN_EXPIRY="60 * 60 * 24"

  # Password customization
  PASSWORD_MIN_LENGTH=6
  PASSWORD_MAX_LENGTH=20
  PASSWORD_BLACK_LIST=password,passw0Rd,secret,Passw0rd,Password123
  ```
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
    - request parameters: none
    - request body: none
    - response:
      ```
      {
        "data": {
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

<a name="contributing"></a>
## Contributing
See the [Contributing guide](https://github.com/simplymichael/express-user-manager/blob/master/CONTRIBUTING.md)

<a name="changelog"></a>
## CHANGELOG
See [CHANGELOG](https://github.com/simplymichael/express-user-manager/blob/master/CHANGELOG.md)
