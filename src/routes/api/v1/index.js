const router = require('express').Router();
const { statusCodes } = require('../../../utils/http');

router.get('/', (req, res) => {
  res.status(statusCodes.forbidden).json({message: 'Forbidden'});
});

module.exports = router;
