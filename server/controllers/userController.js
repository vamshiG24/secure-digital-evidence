const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { getRedisClient } = require('../config/redis');
const { sendOTP } = require('../services/emailService');

const OTP_TTL_MS = 5 * 60 * 1000;
const TOKEN_TTL_DAYS = 7;

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: `${TOKEN_TTL_DAYS}d` });

const cookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
});

const sendTokenCookie = (res, token) => {
    res.cookie('token', token, { ...cookieOptions(), maxAge: TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000 });
};

// Cryptographically secure 6-digit code
const generateOtp = () => String(crypto.randomInt(100000, 1000000));

const audit = (req, user, action, details) =>
    AuditLog.create({
        user: user ? user._id : null,
        action,
        details,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
    }).catch(err => console.error('Audit log error:', err.message));

const publicUser = (user) => ({
    _id: user._id,
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    department: user.department,
    badgeId: user.badgeId,
    bio: user.bio,
    status: user.status,
    createdAt: user.createdAt
});

// @desc    Register new user (always created as investigator; admins promote later)
// @route   POST /api/users
// @access  Public
exports.registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        const userExists = await User.findOne({ email: String(email).toLowerCase() });
        if (userExists) {
            return res.status(400).json({ message: 'An account with this email already exists' });
        }

        const otp = generateOtp();
        const user = await User.create({
            name,
            email,
            password,
            otpCode: otp,
            otpExpires: Date.now() + OTP_TTL_MS
        });

        await sendOTP(user.email, otp, 'registration');
        await audit(req, user, 'USER_REGISTER', `User registered (pending verification): ${user.email}`);

        res.status(201).json({ requires2FA: true, email: user.email });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: Object.values(error.errors).map(e => e.message).join(', ') });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate a user (step 1: password → OTP challenge)
// @route   POST /api/users/login
// @access  Public
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+password +otpCode');

        // Same response for unknown email and wrong password to avoid user enumeration
        if (!user || !(await user.matchPassword(password || ''))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (user.status !== 'active') {
            await audit(req, user, 'LOGIN_BLOCKED', `Login blocked for ${user.status} account: ${user.email}`);
            return res.status(403).json({ message: 'This account is suspended. Contact an administrator.' });
        }

        const otp = generateOtp();
        user.otpCode = otp;
        user.otpExpires = Date.now() + OTP_TTL_MS;
        await user.save();

        await sendOTP(user.email, otp);
        await audit(req, user, 'MFA_CHALLENGE', `MFA challenge requested for login: ${user.email}`);

        res.status(200).json({ requires2FA: true, email: user.email });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify OTP (step 2) and issue session
// @route   POST /api/users/verify-login-otp
// @access  Public
exports.verifyLoginOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+otpCode');

        const supplied = String(otp || '');
        const stored = user?.otpCode || '';
        const codeMatches =
            supplied.length === stored.length && stored.length > 0 &&
            crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(stored));

        if (!user || !codeMatches || !user.otpExpires || user.otpExpires < Date.now()) {
            return res.status(401).json({ message: 'Invalid or expired verification code' });
        }

        if (user.status !== 'active') {
            return res.status(403).json({ message: 'This account is suspended. Contact an administrator.' });
        }

        user.otpCode = undefined;
        user.otpExpires = undefined;
        await user.save();

        await audit(req, user, 'USER_LOGIN', `User logged in via 2FA: ${user.email}`);

        const token = generateToken(user._id);
        sendTokenCookie(res, token);
        res.json(publicUser(user));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res) => {
    res.status(200).json(publicUser(req.user));
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, Investigator — needed for case assignment)
exports.getUsers = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const users = await User.find(isAdmin ? {} : { status: 'active' }).sort({ createdAt: -1 });
        // Non-admins only need enough to pick an assignee; keep emails and status admin-only
        const directoryEntry = (u) => ({ _id: u._id, id: u._id, name: u.name, role: u.role, avatarUrl: u.avatarUrl, department: u.department, badgeId: u.badgeId });
        res.json(users.map(isAdmin ? publicUser : directoryEntry));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update own profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('+password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { name, avatarUrl, department, badgeId, bio, password, currentPassword } = req.body;

        if (name) user.name = name;
        if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
        if (department) user.department = department;
        if (badgeId !== undefined) user.badgeId = badgeId;
        if (bio !== undefined) user.bio = bio;

        if (password) {
            if (!currentPassword || !(await user.matchPassword(currentPassword))) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
            user.password = password;
        }

        const updated = await user.save();
        await audit(req, user, 'USER_UPDATE', `User updated profile details${password ? ' (password changed)' : ''}`);

        // A password change invalidates every other session; re-issue this one
        if (password) sendTokenCookie(res, generateToken(updated._id));

        res.json(publicUser(updated));
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: Object.values(error.errors).map(e => e.message).join(', ') });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin: update another user's role / status / details
// @route   PUT /api/users/:id
// @access  Private (Admin)
exports.adminUpdateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { role, status, name, department, badgeId, bio } = req.body;
        const isSelf = String(user._id) === String(req.user._id);

        if (role && ['admin', 'investigator', 'analyst'].includes(role)) {
            if (isSelf && role !== 'admin') {
                return res.status(400).json({ message: 'You cannot remove your own admin role' });
            }
            user.role = role;
        }
        if (status && ['active', 'suspended', 'inactive'].includes(status)) {
            if (isSelf && status !== 'active') {
                return res.status(400).json({ message: 'You cannot suspend your own account' });
            }
            user.status = status;
        }
        if (name) user.name = name;
        if (department) user.department = department;
        if (badgeId !== undefined) user.badgeId = badgeId;
        if (bio !== undefined) user.bio = bio;

        await user.save();
        await audit(req, req.user, 'ADMIN_UPDATE_USER', `Admin updated user ${user.email} (role=${user.role}, status=${user.status})`);

        res.json(publicUser(user));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin: delete a user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
exports.adminDeleteUser = async (req, res) => {
    try {
        if (String(req.params.id) === String(req.user._id)) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await user.deleteOne();
        await audit(req, req.user, 'ADMIN_DELETE_USER', `Admin deleted user ${user.email}`);
        res.json({ message: 'User removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Logout: blocklist JWT and clear cookie
// @route   POST /api/users/logout
// @access  Private
exports.logoutUser = async (req, res) => {
    try {
        const token = req.cookies?.token ||
            (req.headers.authorization?.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : null);

        if (token) {
            const client = getRedisClient();
            const decoded = jwt.decode(token);
            if (client && decoded?.exp) {
                const ttl = decoded.exp - Math.floor(Date.now() / 1000);
                if (ttl > 0) {
                    // Key on a digest so the raw token never sits in Redis
                    const digest = crypto.createHash('sha256').update(token).digest('hex');
                    await client.set(`blocklist:${digest}`, '1', { EX: ttl });
                }
            }
        }

        res.clearCookie('token', cookieOptions());
        await audit(req, req.user, 'USER_LOGOUT', `User logged out: ${req.user.email}`);
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
