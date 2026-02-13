const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, getUsers, updateUserProfile } = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateUserProfile);
router.get('/', protect, authorize('admin'), getUsers);

module.exports = router;
