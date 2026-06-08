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
    disable2FA
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/', registerUser);
router.post('/login', loginUser);
router.post('/verify-login-otp', verifyLoginOTP);
router.post('/2fa/request-enable', protect, requestEnable2FA);
router.post('/2fa/confirm-enable', protect, confirmEnable2FA);
router.post('/2fa/disable', protect, disable2FA);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateUserProfile);
router.get('/', protect, authorize('admin'), getUsers);

module.exports = router;
