module.exports = {
  convertToBoolean,
};

function convertToBoolean(data) {
  if(data === 'false') {
    return false;
  }

  const parsedData = parseInt(data);
  return (isNaN(parsedData) ? Boolean(data) : !!parsedData);
}
