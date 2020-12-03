# User Management
A package for user management: registration, login, get, search

## Usage
1. `const listener = require('user-management');`
2. Create the ***/api/v[N]/users/ routes***:
   The `expressApp` parameter has the following constraints:
    - It must be an express app (that is created with `var app = express()`)
    - It MUST NOT be an express server, that is,
      it must not have been passed to `http.createServer(app)`
   `listener.listen(expressApp);`
   **NOTE**: If your ***expressApp*** has its own custom routing in place,
   make sure to call `listener.listen(expressApp)` before setting up
   your app's custom 404 route handler. Setting up your app's 404 route handler
   before calling `listener.listen()` will lead to every route not in
   your custom app's route handlers being handled by the
   404 handler and thus prevent any requests from getting to the
   routes that are supposed to be handled by calling `listener.listen().`
3. Create a data store
   A. You can use one of the built-in ones:
   ```
   const MongooseStore = userModule.getDbDriver('mongoose');
   const storeObject = new MongooseStore(optionalConnectOptions);
   //await storeObject.connect(connectionOptions); // use this only if optionalConnectionOptions is not specified during instantiation
   ```
   B. Use a custom storeObject.
   The storeObject should implement the following async methods
   (See section on **Methods and parameters of the storeObject** below):
    - async connect(options = {})
    - async disconnect()
    - async createUser(userData)
    - async getUsers(options)
    - async searchUsers(options)
    - async findByEmail(email)
    - findByUsername(username)
4. Set the datastore:
   `listener.set('store', storeObject);`
5. Proceed with normal server initialization, e.g:
   ```
   const server = http.createServer(app);
   server.listen(port);
   server.on('error', function onError(error) {...});
   server.on('listening', function onListening() {...});
   ```
6. Listen for and handle events
   ```
   listener.on(EVENT_NAME, function(data) {
      // do something with data
   });
   ```

## Built-in data stores (database drivers)
- Mongoose (MongoDB)

## Methods and parameters of the storeObject
- `async connect(config)`: `config` should be an object with members:
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
