import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Shield, Mail, Lock, Eye, EyeOff, ArrowRight, User, Fingerprint,
  Sun, Moon, Hash, Link2, ScanSearch, Sparkles, ArrowLeft, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BorderBeam, ShimmerButton, Reveal } from '../components/ui';
import { easeOut, spring } from '../components/ui/motion';

const FEATURES = [
  { icon: Hash, title: 'SHA-256 sealed ingest', text: 'Every file is hashed on arrival and bound to a tamper-evident custody ledger.' },
  { icon: Link2, title: 'Hash-linked chain of custody', text: 'Each transfer is a block whose hash covers the previous block and the file itself.' },
  { icon: ScanSearch, title: 'AI forensic inspector', text: 'Entity extraction, timelines and multimodal RAG over case evidence.' },
];

const formVariants = {
  hidden: { opacity: 0, x: 24, filter: 'blur(4px)' },
  visible: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.35, ease: easeOut } },
  exit: { opacity: 0, x: -24, filter: 'blur(4px)', transition: { duration: 0.2, ease: easeOut } },
};

function PasswordField({ id, value, onChange, autoComplete, placeholder = '••••••••••', helper }) {
  const [show, setShow] = useState(false);
  return (
    <div className="form-group">
      <label className="label" htmlFor={id}>Password <span className="req" aria-hidden="true">*</span></label>
      <div className="input-wrapper input-icon">
        <Lock size={16} className="input-icon-el" aria-hidden="true" />
        <input id={id} className="input" type={show ? 'text' : 'password'} placeholder={placeholder} value={value}
          onChange={onChange} required minLength={8} autoComplete={autoComplete} style={{ paddingRight: 46 }} />
        <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}
          style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, display: 'grid', placeItems: 'center', background: 'none', border: 'none', color: 'var(--text-muted)', borderRadius: 8 }}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {helper && <div className="helper">{helper}</div>}
    </div>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // login | register | otp
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const otpRefs = useRef([]);
  const reduce = useReducedMotion();
  const { login, verifyOTP, register, user } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => { if (user) navigate(from, { replace: true }); }, [user, navigate, from]);
  useEffect(() => { setError(''); }, [mode]);
  useEffect(() => { if (mode === 'otp') setTimeout(() => otpRefs.current[0]?.focus({ preventScroll: true }), 350); }, [mode]);

  const fail = (err, fallback) => {
    const msg = err.response?.data?.message || fallback;
    setError(msg);
    toast.error(msg);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      setMode('otp');
      toast.success('Verification code sent to your email');
    } catch (err) { fail(err, 'Login failed'); } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ name, email, password });
      setMode('otp');
      toast.success('Verify your email to finish creating your account');
    } catch (err) { fail(err, 'Registration failed'); } finally { setLoading(false); }
  };

  const submitOtp = async (code) => {
    if (code.length < 6) { setError('Enter all 6 digits'); return; }
    setLoading(true);
    try {
      await verifyOTP(email, code);
      toast.success('Identity verified — welcome');
      navigate(from, { replace: true });
    } catch (err) { fail(err, 'Invalid code'); setOtp(Array(6).fill('')); otpRefs.current[0]?.focus(); } finally { setLoading(false); }
  };

  const handleOtpChange = (i, raw) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) { const next = [...otp]; next[i] = ''; setOtp(next); return; }
    const next = [...otp];
    // Support paste of the full code into any box
    digits.split('').slice(0, 6 - i).forEach((d, k) => { next[i + k] = d; });
    setOtp(next);
    const lastFilled = Math.min(i + digits.length, 5);
    otpRefs.current[lastFilled]?.focus();
    if (next.every(Boolean)) submitOtp(next.join(''));
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) otpRefs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const heading = { login: 'Welcome back', register: 'Create your account', otp: 'Verify your identity' }[mode];
  const sub = {
    login: 'Sign in to the Secure Digital Evidence platform.',
    register: 'New accounts start as Investigators; an admin can promote you.',
    otp: <>Enter the 6-digit code we sent to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.</>,
  }[mode];

  return (
    <div style={{ minHeight: '100dvh', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', background: 'var(--bg)', position: 'relative', overflowX: 'clip' }} className="auth-grid">
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div className="bg-aurora" />
        <div className="bg-dots" style={{ position: 'absolute', inset: 0, opacity: 0.6, maskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 75%)' }} />
      </div>

      <button className="btn btn-ghost btn-icon" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        style={{ position: 'fixed', top: 16, right: 16, zIndex: 2, background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Left: brand story */}
      <section className="auth-hero" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(32px, 6vw, 80px)' }}>
        <Reveal each={0.08}>
          <Reveal.Item style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
            <motion.div animate={reduce ? {} : { y: [0, -4, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 44, height: 44, borderRadius: 13, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, var(--brand-600), var(--cyan-500))', boxShadow: 'var(--shadow-glow)' }}>
              <Shield size={22} color="#fff" />
            </motion.div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>SecureEvidence</div>
              <div className="eyebrow" style={{ fontSize: 10 }}>Digital Forensics Platform</div>
            </div>
          </Reveal.Item>

          <Reveal.Item>
            <h1 style={{ fontSize: 'clamp(30px, 3.6vw, 46px)', lineHeight: 1.08, letterSpacing: '-0.02em', marginBottom: 16, maxWidth: 560 }}>
              Court-ready evidence custody,{' '}
              <span className="gradient-text">cryptographically sealed.</span>
            </h1>
          </Reveal.Item>
          <Reveal.Item>
            <p style={{ fontSize: 16, maxWidth: 520, marginBottom: 36, color: 'var(--text-muted)' }}>
              Ingest, hash, transfer and present digital evidence with an immutable audit trail and AI-assisted forensic analysis.
            </p>
          </Reveal.Item>

          <div style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
            {FEATURES.map(f => (
              <Reveal.Item key={f.title}>
                <motion.div whileHover={reduce ? {} : { x: 4 }} transition={spring}
                  style={{ display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 14, background: 'color-mix(in srgb, var(--surface) 70%, transparent)', border: '1px solid var(--border)', backdropFilter: 'blur(10px)' }}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'var(--primary-soft)', color: 'var(--primary)' }}><f.icon size={18} /></span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--text-primary)' }}>{f.title}</div>
                    <div style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.45 }}>{f.text}</div>
                  </div>
                </motion.div>
              </Reveal.Item>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Right: auth card */}
      <section style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(20px, 4vw, 48px)' }}>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: easeOut }}
          style={{ position: 'relative', width: '100%', maxWidth: 440, borderRadius: 24, background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
        >
          {!reduce && <BorderBeam radius={24} />}
          <div style={{ padding: 'clamp(24px, 4vw, 40px)' }}>
            <AnimatePresence mode="wait">
              <motion.div key={mode + '-head'} variants={formVariants} initial="hidden" animate="visible" exit="exit" style={{ marginBottom: 24 }}>
                <span className="badge badge-info" style={{ marginBottom: 14 }}>
                  {mode === 'otp' ? <><Fingerprint size={12} /> Two-factor</> : <><Sparkles size={12} /> Secure access</>}
                </span>
                <h2 style={{ fontSize: 26, marginBottom: 6 }}>{heading}</h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{sub}</p>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div className="alert alert-error" role="alert" initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 16 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--danger)' }} /><span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {mode === 'login' && (
                <motion.form key="login" variants={formVariants} initial="hidden" animate="visible" exit="exit" onSubmit={handleLogin} noValidate={false}>
                  <div className="form-group">
                    <label className="label" htmlFor="login-email">Email address <span className="req" aria-hidden="true">*</span></label>
                    <div className="input-wrapper input-icon">
                      <Mail size={16} className="input-icon-el" aria-hidden="true" />
                      <input id="login-email" className="input" type="email" inputMode="email" autoComplete="username" placeholder="you@agency.gov" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
                    </div>
                  </div>
                  <PasswordField id="login-password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
                  <ShimmerButton type="submit" loading={loading} className="btn-block" style={{ marginTop: 4 }}>
                    Continue <ArrowRight size={16} />
                  </ShimmerButton>
                  <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
                    No account?{' '}
                    <button type="button" onClick={() => setMode('register')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: 14, padding: 4 }}>Request access</button>
                  </p>
                </motion.form>
              )}

              {mode === 'register' && (
                <motion.form key="register" variants={formVariants} initial="hidden" animate="visible" exit="exit" onSubmit={handleRegister}>
                  <div className="form-group">
                    <label className="label" htmlFor="reg-name">Full name <span className="req" aria-hidden="true">*</span></label>
                    <div className="input-wrapper input-icon">
                      <User size={16} className="input-icon-el" aria-hidden="true" />
                      <input id="reg-name" className="input" type="text" autoComplete="name" placeholder="Jane Doe" value={name} onChange={e => setName(e.target.value)} required autoFocus />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="label" htmlFor="reg-email">Email address <span className="req" aria-hidden="true">*</span></label>
                    <div className="input-wrapper input-icon">
                      <Mail size={16} className="input-icon-el" aria-hidden="true" />
                      <input id="reg-email" className="input" type="email" inputMode="email" autoComplete="email" placeholder="you@agency.gov" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                  </div>
                  <PasswordField id="reg-password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" helper="At least 8 characters." />
                  <ShimmerButton type="submit" loading={loading} className="btn-block" style={{ marginTop: 4 }}>
                    <Shield size={16} /> Create account
                  </ShimmerButton>
                  <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
                    Already registered?{' '}
                    <button type="button" onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: 14, padding: 4 }}>Sign in</button>
                  </p>
                </motion.form>
              )}

              {mode === 'otp' && (
                <motion.form key="otp" variants={formVariants} initial="hidden" animate="visible" exit="exit" onSubmit={(e) => { e.preventDefault(); submitOtp(otp.join('')); }}>
                  <fieldset style={{ border: 'none' }}>
                    <legend className="sr-only">Six-digit verification code</legend>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
                      {otp.map((digit, i) => (
                        <motion.input
                          key={i}
                          ref={el => { otpRefs.current[i] = el; }}
                          value={digit}
                          onChange={e => handleOtpChange(i, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(i, e)}
                          onFocus={e => e.target.select()}
                          inputMode="numeric" pattern="[0-9]*" autoComplete={i === 0 ? 'one-time-code' : 'off'}
                          aria-label={`Digit ${i + 1}`}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, ...spring }}
                          className="otp-box"
                          style={{
                            width: 'clamp(40px, 11vw, 52px)', height: 58, textAlign: 'center', fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)',
                            borderRadius: 12, border: `2px solid ${digit ? 'var(--primary)' : 'var(--border-strong)'}`,
                            background: digit ? 'var(--primary-soft)' : 'var(--surface)', color: 'var(--text-primary)', outline: 'none',
                            transition: 'border-color 120ms, background 120ms, box-shadow 120ms',
                          }}
                        />
                      ))}
                    </div>
                  </fieldset>
                  <ShimmerButton type="submit" loading={loading} className="btn-block">
                    <Fingerprint size={16} /> Verify & sign in
                  </ShimmerButton>
                  <button type="button" onClick={() => setMode('login')} className="btn btn-ghost btn-block" style={{ marginTop: 10, color: 'var(--text-muted)' }}>
                    <ArrowLeft size={15} /> Back to sign in
                  </button>
                  <p className="helper" style={{ textAlign: 'center', marginTop: 12 }}>Codes expire after 5 minutes. Check your spam folder if it hasn't arrived.</p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      <style>{`
        .otp-box:focus { box-shadow: 0 0 0 3px var(--ring); border-color: var(--primary) !important; }
        @media (max-width: 900px) {
          .auth-grid { grid-template-columns: 1fr !important; }
          .auth-hero { display: none !important; }
        }
      `}</style>
    </div>
  );
}
