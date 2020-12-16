# User Management
A package for user management: registration, login, get, search

# Table of Contents

- **[Usage](#usage)**
    - **[Prerequisites](#prerequisites)**
    - **[Code setup](#code-setup)**
    - **[Specifying custom routes](#specifying-custom-routes)**
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
- **[Developing](#developing)**
    - **[Testing](#testing)**
    - **[Viewing debug output](#viewing-debug-output)**

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
1. `const userManager = require('user-management');`
2. Bind the routes under [baseApiRoute] (default: ***/api/users***):

   `userManager.listen(expressApp, baseApiRoute = '/api/users', customRoutes = {});`

    - The `expressApp` parameter has the following constraints:
        - It must be an express app (that is created with `var app = express()`)
        - It MUST NOT be an express server, that is, it must not have been passed to `http.createServer(app)`
    - The `baseApiRoute` parameter allows you to specify the base API route.
      Every request to the API will be relative to this base route. The default is `/api/users`.
    - The `customRoutes` parameter is an object that allows customization of the routes.

      (See the section on **Specifying custom routes** for more)

   **NOTE**: If your ***expressApp*** has its own custom routing in place,
   make sure to call `userManager.listen(expressApp)` before setting up
   your app's custom 404 route handler. This is because setting up your app's 404 route handler
   before calling `userManager.listen()` will lead to every route not in
   your custom app's route handlers being handled by the
   404 handler and thus prevent any requests from getting to the
   routes that are supposed to be handled by calling `userManager.listen().`
3. Create a data store. This can be done in one of two ways:
    - You can use one of the built-in ones:
      ```
      const MongooseStore = userManager.getDbDriver('mongoose');
      const store = new MongooseStore(optionalConnectOptions);

      // use this only if optionalConnectionOptions is not specified during instantiation
      //await store.connect(connectionOptions);
      ```
      (See the `connect()` method in the section on **Methods and parameters of the store object** below for the expected `connectionOptions`)
    - Use a custom store object.
      The store object should implement the following (asynchronous) methods.

      (See section on **Methods and parameters of the store object** below):
        - *connect(options)*
        - *disconnect()*
        - *createUser(userData)*
        - *getUsers(options)*
        - *searchUsers(options)*
        - *findByEmail(email)*
        - *findByUsername(username)*
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

<a name="specifying-custom-routes"></a>
### Specifying custom routes
The last parameter to `userManager.listen()` represents an object that lets you customize the routes.
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
## Built-in data stores (database drivers)
- Mongoose (MongoDB)

<a name="methods-and-parameters-of-the-store-object"></a>
## Methods and parameters of the store object
- `async connect(options)`: `options` should be an object with members:
    - host {string} the db server host
    - port {number} the db server port
    - user {string} the db server username
    - pass {string} the db server user password
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
- minimum length of 6
- maximum length of 20
- must contain at least one number
- must contain at least an uppercase character
- must contain at least a lowercase character
- must not be either of the following: ['Passw0rd', 'Password123']

<a name="usage-as-a-standalone-server"></a>
## Usage as a stand-alone server
The package comes with a built-in express server that allows you run it as a stand-alone server.

To run it as a stand-alone server, do the following:  
- copy the ***.env.example*** file to ***.env*** and edit the values as necessary
- start the server, using one of two methods:
    - run `npm run serve` to start the server
    - run `npm run serve:watch` to start the server in watch mode.
      This watches the `src/` directory's files and
      automatically restarts the server with the latest changes when you edit the source files.

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

<a name="developing"></a>
## Developing

<a name="testing"></a>
### Testing
To run the tests,
- copy the ***.env.example*** file to ***.env*** and edit the values as necessary.

  **Note** The ***.env*** file is only useful for two scenarios:
    - For running the tests (during development)
    - For running as a stand-alone server

  It should not be relied upon in production.
  For production purposes, if you need to define your environment variables using a ***.env*** file,
  you would have to create the file at the root of your project, that is, at the root of the project which uses this package as a dependency;
  and, unless you have to specify environment variables specific to your application's needs,
  you only need to define the variables listed at the **Prerequisites** section.
- Run all tests: `npm test`
- Run all tests with coverage report: `npm run test:coverage`
- Run tests for only the default routes settings: `npm run test:routes`
- Run tests for only the custom routes settings: `npm run test:routes:custom`

<a name="viewing-debug-output"></a>
### Viewing debug output
To see debug output, on the console,
set the `DEBUG` environment variable to *user-manager*:

- `set DEBUG=user-manager`
- `npm run start` on production
- `npm run start:dev` on development
