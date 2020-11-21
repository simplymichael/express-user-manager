# User Management
A package for user management: registration, login, get, search

## Usage
  ```
  const userManager = require('user-management');

  (async () => {
    // 1. Initialize the database
    /**
     * @param object with members:
     *   - driver {string} the db driver
     *   - host {string} the db server host
     *   - port {number} the db server port
     *   - user {string} the db server username
     *   - pass {string} the db server user password
     *   - dbName {string} the name of the database to connect to
     *   - debug {number (int | 0)} determines whether or not to show debugging output
     *
     * Parameters can be supplied via different methods:
     *  - By specifying the connection parameters as env variables
     *     (e.g, using the .env file (default))
     *  - By specifying them when calling the function (overrides the env variables)
     *
     * @return {resource} a database connection instance
     */
    const db = await userModule.initDb(options);

    // 2. Create the /api/v[N]/users/ routes
    /**
     * The `expressApp` parameter has the following constraints:
     *   - It must be an express app (that is created with `var app = express()`)
     *   - It MUST NOT be an express server, that is,
     *     it must not have been passed to `http.createServer(app)`
     */
    const listener = userManager.listen(expressApp);

    // 3. Proceed with normal server initialization, e.g:
    const server = http.createServer(app);
    server.listen(port);
    server.on('error', function onError(error) {...});
    server.on('listening', function onListening() {...});

    // 4. Listening for and handling events
    listener.on(EVENT_NAME, function(data) {
      // do something with data
    });
  }())
  ```

## Supported database drivers
- Mongoose (MongoDB)

## Emitted events
- signupError
- signupSuccess
- loginError
- loginSuccess
- getAllUsersError
- getAllUsersSuccess
- searchUsersError
- searchUsersSuccess
- permissionError

## Password constraints
- minimum length of 6
- maximum length of 20
- must contain at least one number
- must contain at least an uppercase character
- must contain at least a lowercase character
- must not be either of the following: ['Passw0rd', 'Password123']
