const baseApiRoute = '/api/users';
const apiPaths = {
  list: '/',
  search: '/search',
  getUser: '/user',
  signup: '/',
  login: '/login',
  logout: '/logout',
  deleteUser: '/user',
};

module.exports = {
  base: baseApiRoute,
  paths: apiPaths,
};
