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

module.exports = {
  base: baseApiRoute,
  paths: apiPaths,
};
