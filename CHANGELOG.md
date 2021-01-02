# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [3.0.0](https://github.com/simplymichael/express-user-manager/compare/v2.1.0...v3.0.0) (2021-01-02)


### ⚠ BREAKING CHANGES

- **app (new methods):**
    - SESSION_TOKEN_KEY deprecated in favour of SESSION_SECRET
    - AUTH_TOKEN_KEY deprecated in favour of AUTH_TOKEN_SECRET
    - PASSWORD_BLACK_LIST deprecated in favour of DISALLOWED_PASSWORDS
- **app (src/index.js):**
    - `express-user-manager.getDbDriver` has been removed. Calls to it will error.
    - `express-user-manager.getDbAdapter(adapter)` no longer returns a constructor, instead it returns an object.
      This means the following no longer works:
      ```
      const DataStore = userManager.getDbAdapter(adapter);
      const store = new DataStore(); // Error: DataStore is not a constructor

      userManager.set('store', store);
      ```

      Do this instead: `const store = userManager.getDbAdapter(adapter);`

      This still performs all the previous initialization steps, but internally.

### Features

- **app (new methods):** add new configuration and initialization methods ([8e306ef](https://github.com/simplymichael/express-user-manager/commit/8e306ef58a3f36fdf218b569ef197730dc4d1974))
- **hooks:** implement methods to unregister hooks ([2590cc2](https://github.com/simplymichael/express-user-manager/commit/2590cc22ebb81aaf922565719b7201c6e1d1ad7e))
- **hooks:** implement request hooks ([445f32a](https://github.com/simplymichael/express-user-manager/commit/445f32a238b45e6686087b102cfb9ff93ecf801d))
- **hooks:** implement response hooks ([a919078](https://github.com/simplymichael/express-user-manager/commit/a91907886ec1cb5b853ce2ee023b15101e6036e4))
- **routing:** implement user data update route ([f487bf0](https://github.com/simplymichael/express-user-manager/commit/f487bf0ddd46f238f6469ae863b7da36aa960164))
- **app (src/index.js):** simplify the API setup ([e49c432](https://github.com/simplymichael/express-user-manager/commit/e49c432fd84af759a784b071b64cfa7625e88122))

## [2.1.0](https://github.com/simplymichael/express-user-manager/compare/v2.0.0...v2.1.0) (2020-12-21)


### Features

* **passwords:** allow customization of password length and non-secure passwords list ([cf2d977](https://github.com/simplymichael/express-user-manager/commit/cf2d977d11803c142855611e7b9137a70093fe9a))
* **users listing:** implement results filtering, pagination, and limit ([3309734](https://github.com/simplymichael/express-user-manager/commit/3309734e72276473fd87f6e7e16db12a9806e673))

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
