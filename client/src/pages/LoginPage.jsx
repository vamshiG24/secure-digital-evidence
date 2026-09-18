import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Shield, Mail, Lock, Eye, EyeOff, ArrowRight,
  User, ChevronRight, Fingerprint, Zap
} from 'lucide-react';

// Animated background orbs
const Orb = ({ size, color, x, y, delay }) => (
  <motion.div
    style={{
      position: 'absolute', width: size, height: size,
      borderRadius: '50%', background: color,
      filter: 'blur(60px)', left: x, top: y,
      pointerEvents: 'none',
    }}
    animate={{ y: [0, -30, 0], x: [0, 15, 0], scale: [1, 1.1, 1] }}
    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay }}
  />
);

const particles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  delay: Math.random() * 5,
  duration: Math.random() * 8 + 6,
}));

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // login | register | otp
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('investigator');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef([]);
  const { login, verifyOTP, register } = useAuth();
  const navigate = useNavigate();

  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      setMode('otp');
      toast.success('OTP sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { toast.error('Enter 6-digit OTP'); return; }
    setLoading(true);
    try {
      await verifyOTP(email, code);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ name, email, password, role });
      setMode('otp');
      toast.success('OTP sent to verify your account!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, x: 40, scale: 0.97 },
    visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
    exit: { opacity: 0, x: -40, scale: 0.97, transition: { duration: 0.3 } },
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f6ff 0%, #e8f0fe 50%, #f0f4ff 100%)',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* Background Orbs */}
      <Orb size={400} color="rgba(59,130,246,0.15)" x="-10%" y="-10%" delay={0} />
      <Orb size={350} color="rgba(6,182,212,0.12)" x="60%" y="60%" delay={2} />
      <Orb size={250} color="rgba(139,92,246,0.1)" x="80%" y="-5%" delay={4} />

      {/* Floating particles */}
      {particles.map(p => (
        <motion.div key={p.id}
          style={{
            position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size, borderRadius: '50%',
            background: 'rgba(59,130,246,0.4)', pointerEvents: 'none',
          }}
          animate={{ y: [-10, -40, -10], opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Grid overlay */}
      <div className="bg-grid" style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }} />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{
          width: '100%', maxWidth: 440, margin: '20px',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(24px)',
          borderRadius: 28, border: '1px solid rgba(29,78,216,0.12)',
          boxShadow: '0 24px 80px rgba(29,78,216,0.15), 0 4px 16px rgba(0,0,0,0.06)',
          overflow: 'hidden', position: 'relative',
        }}
      >
        {/* Top gradient bar */}
        <div style={{
          height: 4,
          background: 'linear-gradient(90deg, #1d4ed8, #3b82f6, #06b6d4)',
          backgroundSize: '200% 100%',
          animation: 'gradient-shift 3s ease infinite',
        }} />

        <div style={{ padding: '36px 40px 40px' }}>
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 300 }}
            style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(29,78,216,0.35)',
              position: 'relative',
            }}>
              <Shield size={32} color="white" />
              <motion.div style={{
                position: 'absolute', inset: -6, borderRadius: 24,
                border: '2px solid rgba(59,130,246,0.3)',
              }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>

          {/* Title */}
          <AnimatePresence mode="wait">
            <motion.div key={mode + 'title'} variants={formVariants} initial="hidden" animate="visible" exit="exit">
              <h1 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 26, fontWeight: 700, textAlign: 'center',
                background: 'linear-gradient(135deg, #0f172a, #1d4ed8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                marginBottom: 6,
              }}>
                {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Verify Identity'}
              </h1>
              <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginBottom: 28 }}>
                {mode === 'login' ? 'Secure Evidence Management System' :
                  mode === 'register' ? 'Join the evidence platform' :
                    `Enter the 6-digit code sent to ${email}`}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Forms */}
          <AnimatePresence mode="wait">
            {mode === 'login' && (
              <motion.form key="login" variants={formVariants} initial="hidden" animate="visible" exit="exit"
                onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="label">Email Address</label>
                  <div className="input-wrapper input-icon">
                    <Mail size={16} className="input-icon-el" />
                    <input className="input" type="email" placeholder="admin@secureevidence.com"
                      value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Password</label>
                  <div className="input-wrapper input-icon" style={{ position: 'relative' }}>
                    <Lock size={16} className="input-icon-el" />
                    <input className="input" type={showPass ? 'text' : 'password'}
                      placeholder="••••••••••" value={password}
                      onChange={e => setPassword(e.target.value)} required style={{ paddingRight: 44 }} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                  {loading ? (
                    <motion.div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%' }}
                      animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                  ) : (
                    <><Zap size={16} /> Sign In Securely <ArrowRight size={16} /></>
                  )}
                </button>
                <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
                  No account?{' '}
                  <button type="button" onClick={() => setMode('register')}
                    style={{ background: 'none', border: 'none', color: '#1d4ed8', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                    Register here
                  </button>
                </p>
              </motion.form>
            )}

            {mode === 'register' && (
              <motion.form key="register" variants={formVariants} initial="hidden" animate="visible" exit="exit"
                onSubmit={handleRegister}>
                <div className="form-group">
                  <label className="label">Full Name</label>
                  <div className="input-wrapper input-icon">
                    <User size={16} className="input-icon-el" />
                    <input className="input" type="text" placeholder="John Doe"
                      value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Email Address</label>
                  <div className="input-wrapper input-icon">
                    <Mail size={16} className="input-icon-el" />
                    <input className="input" type="email" placeholder="your@email.com"
                      value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Password</label>
                  <div className="input-wrapper input-icon">
                    <Lock size={16} className="input-icon-el" />
                    <input className="input" type={showPass ? 'text' : 'password'}
                      placeholder="••••••••••" value={password}
                      onChange={e => setPassword(e.target.value)} required style={{ paddingRight: 44 }} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Role</label>
                  <select className="input" value={role} onChange={e => setRole(e.target.value)}>
                    <option value="investigator">Investigator</option>
                    <option value="analyst">Analyst</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                  {loading ? (
                    <motion.div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%' }}
                      animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                  ) : (
                    <><Shield size={16} /> Create Account</>
                  )}
                </button>
                <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
                  Have an account?{' '}
                  <button type="button" onClick={() => setMode('login')}
                    style={{ background: 'none', border: 'none', color: '#1d4ed8', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                    Sign in
                  </button>
                </p>
              </motion.form>
            )}

            {mode === 'otp' && (
              <motion.form key="otp" variants={formVariants} initial="hidden" animate="visible" exit="exit"
                onSubmit={handleVerifyOTP}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      width: 56, height: 56, borderRadius: 16,
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(6,182,212,0.1))',
                      border: '2px solid rgba(59,130,246,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    <Fingerprint size={28} color="#1d4ed8" />
                  </motion.div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 28 }}>
                  {otp.map((digit, i) => (
                    <motion.input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      maxLength={1}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.06, type: 'spring', stiffness: 400 }}
                      style={{
                        width: 48, height: 56, textAlign: 'center',
                        fontSize: 22, fontWeight: 700,
                        borderRadius: 12,
                        border: digit ? '2px solid #3b82f6' : '2px solid rgba(29,78,216,0.15)',
                        background: digit ? 'rgba(59,130,246,0.06)' : 'white',
                        color: '#1d4ed8',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        fontFamily: 'inherit',
                      }}
                    />
                  ))}
                </div>
                <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
                  style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? (
                    <motion.div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%' }}
                      animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                  ) : (
                    <><Fingerprint size={16} /> Verify & Access</>
                  )}
                </button>
                <button type="button" onClick={() => setMode('login')}
                  style={{ width: '100%', background: 'none', border: 'none', color: '#64748b', fontSize: 14, marginTop: 16, cursor: 'pointer' }}>
                  ← Back to login
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
