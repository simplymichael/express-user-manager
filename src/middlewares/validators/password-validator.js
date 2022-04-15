const { body } = require('express-validator');
const { env, appModule } = require('../_utils');

module.exports = () => {
  const [MIN, MAX, DISALLOWED_LIST ] = getPasswordValidationData();

  return [
    body('password').trim()
      .isLength({
        min: MIN,
        max: MAX
      }).withMessage(`must be between ${MIN} and ${MAX} characters long`)
      .matches(/\d/).withMessage('must contain a number')
      .matches(/[A-Z]+/).withMessage('must contain an uppercase character')
      .matches(/[a-z]+/).withMessage('must contain a lowercase character')
      .not().isIn(DISALLOWED_LIST).withMessage('Do not use a common word as the password')
      .escape()
  ];
};


// Wrap the call to appModule.get('password') inside a function
// so that by the time we call the function, the appModule will be available and fully initialized.
// Placing the call outside leads to the call being made before
// the appModule have fully initialized and registered its config properties.
function getPasswordValidationData() {
  const passwordConfig = appModule.get('password') || {};
  const disallowed = passwordConfig.disallowed;
  const minLength = passwordConfig.minLength;
  const maxLength = passwordConfig.maxLength;

  const [ MIN ] = [ minLength || env.PASSWORD_MIN_LENGTH ]
    .map(parseInt)
    .map(val => Number.isNaN(val) ? 6 : val);

  const [ MAX ] = [ maxLength || env.PASSWORD_MAX_LENGTH ]
    .map(parseInt)
    .map(val => Number.isNaN(val) ? 20 : val);

  let disallowedList = disallowed;

  if(typeof disallowedList === 'string') {
    disallowedList = disallowedList.trim();
  }

  if(!disallowedList || disallowedList.length === 0) {
    disallowedList = env.DISALLOWED_PASSWORDS;
  }

  const DISALLOWED_LIST = Array.isArray(disallowedList)
    ? disallowedList
    : typeof disallowedList === 'string'
      ? disallowedList.split(',').map(str => str.trim())
      : [];

  return [MIN, MAX, DISALLOWED_LIST];
}
