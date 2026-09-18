const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const jwt = require('jsonwebtoken');
const { getRedisClient } = require('../config/redis');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Set token in HTTP-only Cookie
const sendTokenCookie = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
};

// @desc    Register new user
// @route   POST /api/users
// @access  Public
exports.registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate 6-digit OTP for registration
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const user = await User.create({
            name,
            email,
            password,
            role, // Optional, defaults to 'investigator' if not provided
            otpCode: otp,
            otpExpires: Date.now() + 5 * 60 * 1000 // 5 minutes expiration
        });

        if (user) {
            // Send OTP email
            const { sendOTP } = require('../services/emailService');
            await sendOTP(user.email, otp, 'registration');

            // Audit Log
            await AuditLog.create({
                user: user._id,
                action: 'USER_REGISTER',
                details: `User registered (pending verification): ${user.email} as ${user.role}`,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            res.status(201).json({
                requires2FA: true,
                email: user.email
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            // Generate 6-digit OTP - Enforced globally for all logins
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            user.otpCode = otp;
            user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes expiration
            await user.save();

            // Send OTP email
            const { sendOTP } = require('../services/emailService');
            await sendOTP(user.email, otp);

            // Audit Log MFA Request
            await AuditLog.create({
                user: user._id,
                action: 'MFA_CHALLENGE',
                details: `MFA challenge requested for login: ${user.email}`,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            return res.status(200).json({
                requires2FA: true,
                email: user.email
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            twoFactorEnabled: true // Always return true since 2FA is globally enforced
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users (for admin assignment)
// @route   GET /api/users
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        // Map users to always have twoFactorEnabled as true
        const mappedUsers = users.map(u => {
            const obj = u.toObject();
            obj.twoFactorEnabled = true;
            return obj;
        });
        res.json(mappedUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.avatarUrl = req.body.avatarUrl !== undefined ? req.body.avatarUrl : user.avatarUrl;
            user.department = req.body.department || user.department;
            user.badgeId = req.body.badgeId !== undefined ? req.body.badgeId : user.badgeId;
            user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            // Audit Log
            await AuditLog.create({
                user: user._id,
                action: 'USER_UPDATE',
                details: `User updated profile details`,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            const token = generateToken(updatedUser._id);
            sendTokenCookie(res, token);

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                avatarUrl: updatedUser.avatarUrl,
                department: updatedUser.department,
                badgeId: updatedUser.badgeId,
                bio: updatedUser.bio,
                status: updatedUser.status,
                twoFactorEnabled: true,
                token,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify login OTP code
// @route   POST /api/users/verify-login-otp
// @access  Public
exports.verifyLoginOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.otpCode || user.otpCode !== otp || !user.otpExpires || user.otpExpires < Date.now()) {
            return res.status(401).json({ message: 'Invalid or expired verification code' });
        }

        // Clear OTP code fields
        user.otpCode = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Audit Log login
        await AuditLog.create({
            user: user._id,
            action: 'USER_LOGIN',
            details: `User logged in via 2FA: ${user.email}`,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        const token = generateToken(user._id);
        sendTokenCookie(res, token);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            twoFactorEnabled: true,
            token,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Request to enable 2FA (sends OTP)
// @route   POST /api/users/2fa/request-enable
// @access  Private
exports.requestEnable2FA = async (req, res) => {
    res.status(400).json({ message: 'Two-Factor Authentication is enforced globally and cannot be toggled.' });
};

// @desc    Confirm enabling 2FA
// @route   POST /api/users/2fa/confirm-enable
// @access  Private
exports.confirmEnable2FA = async (req, res) => {
    res.status(400).json({ message: 'Two-Factor Authentication is enforced globally and cannot be toggled.' });
};

// @desc    Disable 2FA
// @route   POST /api/users/2fa/disable
// @access  Private
exports.disable2FA = async (req, res) => {
    res.status(400).json({ message: 'Two-Factor Authentication is enforced globally and cannot be disabled.' });
};

// @desc    Logout user / Clear Cookie and Blocklist JWT token
// @route   POST /api/users/logout
// @access  Private
exports.logoutUser = async (req, res) => {
    try {
        let token;
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        } else if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            const client = getRedisClient();
            if (client) {
                const decoded = jwt.decode(token);
                if (decoded && decoded.exp) {
                    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
                    if (ttl > 0) {
                        await client.set(`blocklist:${token}`, '1', { EX: ttl });
                        console.log(`Token blocklisted for logout. Remaining TTL: ${ttl} seconds`);
                    }
                }
            }
        }

        // Clear cookie
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        // Audit Log
        if (req.user) {
            await AuditLog.create({
                user: req.user._id,
                action: 'USER_LOGOUT',
                details: `User logged out: ${req.user.email}`,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
        }

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
