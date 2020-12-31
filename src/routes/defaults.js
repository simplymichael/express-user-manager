const baseApiRoute = '/api/users';
const apiPaths = {
  list: '/',
  search: '/search',
  getUser: '/user',
  signup: '/',
  login: '/login',
  logout: '/logout',
  updateUser: '/',
  deleteUser: '/user',
};

const pathKeys = Object.keys(apiPaths).reduce((ret, key) => {
  ret[key] = key;
  return ret;
}, {});

module.exports = {
  base: baseApiRoute,
  paths: apiPaths,
  keys: pathKeys,
};
