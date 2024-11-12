const express = require('express');
const { signup } = require('../controllers/userController');
const { signupValidation } = require('../middlewares/validation');

const router = express.Router();

router.post('/signup', signupValidation, signup);

module.exports = router;
