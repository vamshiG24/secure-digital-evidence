const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
    getUsers,
    updateUserProfile,
    verifyLoginOTP,
    requestEnable2FA,
    confirmEnable2FA,
    disable2FA,
    logoutUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const rateLimiter = require('../middlewares/rateLimiter');

// Rate limiters for sensitive authentication routes
const loginLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: 'Too many login attempts. Please try again after 1 minute.'
});

const otpLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: 'Too many OTP verification attempts. Please try again after 1 minute.'
});

router.post('/', registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/verify-login-otp', otpLimiter, verifyLoginOTP);
router.post('/logout', protect, logoutUser);
router.post('/2fa/request-enable', protect, requestEnable2FA);
router.post('/2fa/confirm-enable', protect, confirmEnable2FA);
router.post('/2fa/disable', protect, disable2FA);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateUserProfile);
router.get('/', protect, authorize('admin', 'investigator'), getUsers);

module.exports = router;
