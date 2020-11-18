/**
 * Object to encapsulate HTTP status codes
 */
const statusCodes = {
  ok: 200,
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  conflict: 409,
  serverError: 500,
};

module.exports = {
  statusCodes,
};
