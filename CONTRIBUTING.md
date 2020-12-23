# Contributing

Thank you for taking the time to contribute. Every type of contribution is welcome.

The following is a set of guidelines for contributing to this project.
These are mostly guidelines, not rules.
Also, feel free to propose changes to this document in a pull request.

## Table of contents

- **[How Can I Contribute?](#how-can-i-contribute)**
- **[Project setup](#project-setup)**
- **[Development](#development)**
    - **[Automated testing](#automated-testing)**
    - **[Manual testing (with Postman or cURL)](#manual-testing)**
    - **[Setting up test databases (with docker)](#setting-up-test-databases)**
    - **[Viewing debug output](#viewing-debug-output)**
    - **[Creating a new database adapter](#creating-a-new-database-adapter)**
- **[Committing and pushing changes](#committing-and-pushing-changes)**
- **[Style-guides](#styleguides)**
    - **[Git Commit Messages](#git-commit-messages)**
- **[Help needed](#help-needed)**

## How Can I Contribute?

- Reporting Bugs
- Suggesting Enhancements
- Pull Requests

To report bugs or suggest enhancements, please use the [issues][issues] page.

To make pull requests:

- [setup the project](#project-setup) locally
- make your changes;
  Please try to follow the [development](#development) guidelines while making your changes
- [commit and push](#committing-and-pushing-changes) the changes
- [submit the pull request][pr]

## Project setup

1.  [Fork the repo][fork] to your GitHub account
2.  Clone the repo: `git clone https://github.com/<your-github-username>/express-user-manager`
3.  Navigate to the repo's directory: `cd express-user-manager`
4.  Run `npm install` to install dependencies
5.  Create a branch for your PR with `git checkout -b pr/your-branch-name`

> Tip: Keep your `master` branch pointing at the original repository while still making
> pull requests from branches on your fork. To do this, run:
>
> ```
> git remote add upstream https://github.com/simplymichael/express-user-manager.git
> git fetch upstream
> git branch --set-upstream-to=upstream/master master
> ```
>
> This does the following:
> 1. adds the original repository as a "remote" called "upstream"
>
> 2. fetches the git information from that remote
>
> 3. sets your local `master` branch to pull the latest changes from the upstream master branch whenever you run `git pull`.
>
> Now you can make all of your pull request branches based on this local `master` branch.
>
> Whenever you want to update your local `master` branch, do a regular `git pull`.
> You can push the updated changes to your remote origin master by running `git push`.

## Development

### Automated testing
To run the tests,
- Ensure you have a MongoDB server running on the **default port (27017)**.
  (See **[Setting up test databases](#setting-up-test-databases)** for an example of how to do this)
- Ensure you have a MySQL server running on the **default port (3306)** and that a table named ***users*** exists in the database.
  (See **[Setting up test databases](#setting-up-test-databases)** for an example of how to do this)
- `cd` into the *express-user-manager* directory.
- Copy the *.env.example* file to *.env* and edit the values for the following variables:
    - `DB_HOST=localhost`
    - `DB_DBNAME=users`
    - `DB_DEBUG=false`
    - `EXIT_ON_DB_CONNECT_FAIL=true`
    - `SESSION_SECRET=secret`
    - `AUTH_TOKEN_SECRET=secret`
    - `AUTH_TOKEN_EXPIRY="60 * 60 * 24"`
    - `PASSWORD_MIN_LENGTH=6`
    - `PASSWORD_MAX_LENGTH=20`
    - `DISALLOWED_PASSWORDS=password,passw0Rd,secret,Passw0rd,Password123`
- Run all tests: `npm test`
- Run all tests with coverage report: `npm run test:coverage`
- Run only the database tests: `npm run test:db:all`
- Run only the end-to-end tests: `npm run test:e2e:all`

**Notes**:
- All non-database-engine-specific tests run the tests on the following databases: **in-memory**, **MongoDB**, **MySQL**, **SQLite**.
- You can run database-engine-specific tests by replacing the `:all` postfix with `:DB_ENGINE` in the database and end-to-end tests. For example:
    - `npm run test:db:memory` will run the database tests using only the **in-memory** database.
    - `npm run test:e2e:mongoose` will run the end-to-end tests using only the **mongoose** database.

  The following post-fixes are supported: `:all`, `:memory`, `:mongoose`, `:mysql`, `:sqlite`.

<a name="manual-testing"></a>
### Manual testing (with Postman or cURL)
You can run end-to-end tests on the routes using Postman or cURL. To do this,
- Start the built-in server. You can start the built-in server in one of two ways:
    1. Follow the steps listed in the **[Usage as a standalone server](README.md#usage-as-a-standalone-server)** section to start the server.
    2. Run `npm` scripts to start the server:
        - `cd` into the *express-user-manager* directory.
        - If you are using a MongoDB or MySQL server, ensure the server is up and running on the port you specified.
        - run `npm run serve` to start the server
        - run `npm run serve:watch` to start the server in watch mode. This watches the `src/` directory's files and
          automatically restarts the server with the latest changes when you edit or update the source files.
- Make http requests to the (default) API routes using Postman or cURL.

<a name="setting-up-test-databases"></a>
### Setting up test databases (with docker)
- **Setup a MongoDB database**:
    - Create the container: `docker run -d -it --rm --name mongodb -p 27017:27017 mongo:4.4.1`
    - You can create volume mappings between your OS and the container using the `-v` flag: `-v path/on/your/host/system:/etc/mongo`
- **Setup a MySQL database**:
    - Create the container:
      `docker run -d -it --rm --name mysql -p 3306:3306 -e MYSQL_ALLOW_EMPTY_PASSWORD=true mysql:5.7 --default-authentication-plugin=mysql_native_password`
    - Log into the container and create the ***users*** database: `docker exec -it mysql mysql -h localhost -u root -e "CREATE DATABASE IF NOT EXISTS users"`
    - You can also create volume mappings between your OS and the container as follows: `-v path/on/your/host/system:/var/lib/mysql`

### Viewing debug output
To see debug output on the console, set the `DEBUG` environment variable to ***express-user-manager***
before running the tests or starting the built-in server: `set DEBUG=express-user-manager`

### Creating a new database adapter
To create a new database adapter, create a new file.
Inside the file, define and export a class with the following methods:

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

Save the file in one of two ways:
- as ***{adapterName}***.js inside the `src/databases/adapters` directory
- as `index.js` inside a directory name ***{adapterName}***,
  then place the directory in the `src/databases/adapters` directory

## Committing and Pushing changes

This project follows the [Conventional Commits Specification][commits] and uses [ESLint][eslint] for linting.

Before committing your changes, run `npm run lint:fix` to check and automatically fix linting errors.
If there are linting errors that cannot be automatically fixed, they are highlighted, so that you can manually fix them.

To commit your changes, run `npm run commit`. This will do the following:

- generate conventional commit messages using [commitizen][commitizen] and [cz-conventional-changelog][changelog]
- check to make sure there are no linting errors
- run the tests to make sure there are no breaking changes
- check that the minimum code-coverage threshold is attained
- apply the commit

Once everything checks out and the commit is applied,
you can then push your changes by running `git push -u remote pr/your-branch-name`.

You can keep making and pushing updates to your pull request branch until you feel ready to have your changes merged into the main project.

When you are ready to have your changes merged, you can then [open a pull request][pr].

## Style guides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line (subject line) to 72 characters or less
- Reference issues and pull requests liberally after the first line
- Consider starting the commit message with an applicable emoji:
    - :art: `:art:` when improving the format/structure of the code
    - :racehorse: `:racehorse:` when improving performance
    - :non-potable_water: `:non-potable_water:` when plugging memory leaks
    - :memo: `:memo:` when writing docs
    - :penguin: `:penguin:` when fixing something on Linux
    - :apple: `:apple:` when fixing something on macOS
    - :checkered_flag: `:checkered_flag:` when fixing something on Windows
    - :bug: `:bug:` when fixing a bug
    - :fire: `:fire:` when removing code or files
    - :green_heart: `:green_heart:` when fixing the CI build
    - :white_check_mark: `:white_check_mark:` when adding tests
    - :lock: `:lock:` when dealing with security
    - :arrow_up: `:arrow_up:` when upgrading dependencies
    - :arrow_down: `:arrow_down:` when downgrading dependencies
    - :shirt: `:shirt:` when removing linter warnings

## Help needed

Please checkout the [the issues][issues] page for any open issues.

Also, please watch the repo and respond to questions/bug reports/feature requests! Thanks!

[commitizen]: https://npm.im/commitizen
[commits]: https://conventionalcommits.org/
[changelog]: https://npm.im/cz-conventional-changelog
[eslint]: https://eslint.org/
[fork]: https://docs.github.com/en/free-pro-team@latest/github/getting-started-with-github/fork-a-repo
[issues]: https://github.com/simplymichael/express-user-manager/issues
[pr]: https://docs.github.com/en/free-pro-team@latest/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request
