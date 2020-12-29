module.exports = {
  getRandomData,
  getValidUserId,
  reverse,
};


function getValidUserId(userId) {
  return typeof userId === 'number' ? userId + '1354' : userId.toString();
}

function getRandomData(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function reverse(str) {
  return str.split('').reverse().join('');
}
