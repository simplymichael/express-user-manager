# User Management
A package for user management: registration, login, get, search

## Usage
### Prerequisites
Set the following environment variables:
    - **NODE_ENV** (*string*)
    - **API_VERSION** (*number*: The version of the user-management package to use)
    - **SESSION_TOKEN_KEY** (*string*: Session sign key)
    - **AUTH_TOKEN_KEY** (*string*: Authorization tokey sign key)
    - **AUTH_TOKEN_EXPIRY** (*number*: Authorization token expiry (in seconds))
   We use the **dotenv** package,
   so these variables can be defined inside a **.env** file
   and they will automatically be picked up.

### Code setup
1. `const userManager = require('user-management');`
2. Bind the routes under /users (***/api/v[N]/users/***):
   `userManager.listen(expressApp);`
   The `expressApp` parameter has the following constraints:
    - It must be an express app (that is created with `var app = express()`)
    - It MUST NOT be an express server, that is, it must not have been passed to `http.createServer(app)`
   **NOTE**: If your ***expressApp*** has its own custom routing in place,
   make sure to call `userManager.listen(expressApp)` before setting up
   your app's custom 404 route handler. Setting up your app's 404 route handler
   before calling `userManager.listen()` will lead to every route not in
   your custom app's route handlers being handled by the
   404 handler and thus prevent any requests from getting to the
   routes that are supposed to be handled by calling `userManager.listen().`
3. Create a data store. This can be done in one of two ways:
    - You can use one of the built-in ones:
      ```
      const MongooseStore = userManager.getDbDriver('mongoose');
      const store = new MongooseStore(optionalConnectOptions);
      //await store.connect(connectionOptions); // use this only if optionalConnectionOptions is not specified during instantiation
      ```
    - Use a custom store object.
      The store object should implement the following (asynchronous) methods
      (See section on **Methods and parameters of the store object** below):
        - *connect(options)*
        - *disconnect()*
        - *createUser(userData)*
        - *getUsers(options)*
        - *searchUsers(options)*
        - *findByEmail(email)*
        - *findByUsername(username)*
4. Set the datastore:
   `userManager.set('store', store);`
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

### Using the middlewares
The **userManager** module provides some middlewares.
You can get them by calling: `userModule.get('middlewares');`.
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

## Built-in data stores (database drivers)
- Mongoose (MongoDB)

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

## Emitted events
### Events emitted by database object
- dbConnection
- dbDisconnect
- createUser

### Events emitted by route handlers
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

### Events emitted by middlewares
- actionNotPermittedError
- authorizationError
- authenticationError
- getUserError

## Password constraints
- minimum length of 6
- maximum length of 20
- must contain at least one number
- must contain at least an uppercase character
- must contain at least a lowercase character
- must not be either of the following: ['Passw0rd', 'Password123']

## Development
### Testing
To run the tests,
- copy the ***.env.example*** file to ***.env*** and edit the values as necessary
  **Note** The ***.env*** file is only useful for testing during development.
  It should not be relied upon for production purpose.
  For production purposes, if you need to define your enviroment variables using a ***.env*** file,
  you would have to create the file at the root of your project;
  and for that, you only need to define the variables listed at the **Prerequisites** section.
  that is, the project which uses this package as a dependency.
- Run `npm test` (or `npm run test:coverage` to get coverage reports)
