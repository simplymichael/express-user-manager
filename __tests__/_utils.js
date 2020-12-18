module.exports = {
  getValidUserId,
};


function getValidUserId(userId) {
  return typeof userId === 'number' ? userId + '1354' : userId.toString();
}
