# User Management
A package for user management: registration, login, get, search

## Usage
- Method 1: require in application
  ```
  const userModule = require('user-management');

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
     *   - debug {boolean} determines whether or not to show debugging output
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
    const app = userModule.initApiRoutes(expressApp);

    // 3. Proceed with normal server initialization, e.g:
    const server = http.createServer(app);
    server.listen(port);
    server.on('error', function onError(error) {...});
    server.on('listening', function onListening() {...});
  }())
  ```
- Method 2: standalone
  **Note**: This may lead to the user-management server running on a different
  port from your app's port.

## Supported database drivers
- Mongoose (MongoDB)
