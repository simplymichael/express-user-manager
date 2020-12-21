module.exports = {
  getRandomData,
  getValidUserId,
};


function getValidUserId(userId) {
  return typeof userId === 'number' ? userId + '1354' : userId.toString();
}

function getRandomData(array) {
  return array[Math.floor(Math.random() * array.length)];
}
