const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
    getUsers,
    updateUserProfile,
    verifyLoginOTP,
    logoutUser,
    adminUpdateUser,
    adminDeleteUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const rateLimiter = require('../middlewares/rateLimiter');

const registerLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many accounts created from this address. Try again later.' });
const loginLimiter = rateLimiter({ windowMs: 60 * 1000, max: 5, message: 'Too many login attempts. Please try again after 1 minute.' });
const otpLimiter = rateLimiter({ windowMs: 5 * 60 * 1000, max: 5, message: 'Too many verification attempts. Please request a new code.' });

router.post('/', registerLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/verify-login-otp', otpLimiter, verifyLoginOTP);
router.post('/logout', protect, logoutUser);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateUserProfile);
router.get('/', protect, authorize('admin', 'investigator'), getUsers);

router.route('/:id')
    .put(protect, authorize('admin'), adminUpdateUser)
    .delete(protect, authorize('admin'), adminDeleteUser);

module.exports = router;
