# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.0.0](https://github.com/simplymichael/express-user-manager/compare/v1.1.0...v2.0.0) (2020-12-20)


### ⚠ BREAKING CHANGES

* **supported databases:** Calls to `express-user-manager.getDbDriver('mysql')` will fail. Passing connection
parameters to the constructor returned by the call to `express-user-manager.getDbDriver()` no longer
connects to the database, the `connect()` method must be explicitly called on the instantiated
object and passed the connection parameters. `express-user-manager.getDbDriver()` is now deprecated
and will be removed in an upcoming release, use `express-user-manager.getDbAdapter()` instead.

### Features

* **supported databases:** add support for more databases ([ad39a98](https://github.com/simplymichael/express-user-manager/commit/ad39a987f62bd5d57c315726d5c0cea50f0b31eb))


### Bug Fixes

* **databases:adapter:mongoose:** fix the getUsers() filtering bug ([bfcb508](https://github.com/simplymichael/express-user-manager/commit/bfcb5081625ce40f66b31d3d207c7500dfd7b055))

## [1.1.0](https://github.com/simplymichael/express-user-manager/compare/v0.0.8-custom-base-route...v1.1.0) (2020-12-19)


### Features

* **supported database engines:** add support for MySQL Database using MySQL2 and Sequelize adapter ([f86217b](https://github.com/simplymichael/express-user-manager/commit/f86217bcc58ee90c4fc87fcce4be3848bfef62ef))
