import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Ship,
  Mail,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  User,
  ArrowLeft,
  Inbox,
  Lock,
  Eye,
  EyeOff,
  Check,
  UserPlus,
  LogIn,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { validateEmail, validatePassword } from '@shared/validations.js';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    sendOtp,
    verifyOtp,
    createAccount,
    login,
    isLoading: isAuthLoading
  } = useAuth();

  // Mode: 'create' (Create account) | 'login' (Login)
  const [mode, setMode] = useState<'create' | 'login'>('create');

  // Create Account Sub-Steps: 'email_name' | 'otp' | 'password'
  const [createStep, setCreateStep] = useState<'email_name' | 'otp' | 'password'>('email_name');

  // Form Inputs for Create Account
  const [fullName, setFullName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form Inputs for Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // UI / Feedback States
  const [createEmailTouched, setCreateEmailTouched] = useState(false);
  const [loginEmailTouched, setLoginEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [wasRealEmailSent, setWasRealEmailSent] = useState<boolean>(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const from = location.state?.from?.pathname || '/dashboard';

  // Real-time email validation
  const createEmailValidation = validateEmail(createEmail);
  const isCreateEmailValid = createEmailValidation.isValid;

  const loginEmailValidation = validateEmail(loginEmail);
  const isLoginEmailValid = loginEmailValidation.isValid;

  // Real-time password strength validation
  const passwordValidation = validatePassword(password);
  const doPasswordsMatch = password.length > 0 && password === confirmPassword;

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // Focus first OTP input when entering OTP step
  useEffect(() => {
    if (mode === 'create' && createStep === 'otp') {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [mode, createStep]);

  // Reset feedback when switching tabs
  const handleSwitchMode = (newMode: 'create' | 'login') => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // ==========================================
  // CREATE ACCOUNT: Step 1 - Send OTP
  // ==========================================
  const handleSendOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateEmailTouched(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!isCreateEmailValid) {
      setErrorMsg(createEmailValidation.error || 'Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendOtp(createEmail, fullName.trim());
      setSuccessMsg(res.message || `A 6-digit security OTP has been generated for ${createEmail}`);
      if (res.devOtp) {
        setDevOtpCode(res.devOtp);
        setWasRealEmailSent(false);
      } else {
        setDevOtpCode(null);
        setWasRealEmailSent(true);
      }
      setResendTimer(60);
      setCreateStep('otp');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch verification code. Please check your email and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP digit changes
  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (cleanVal.length > 1) {
      // Pasted full OTP
      const pastedDigits = cleanVal.slice(0, 6).split('');
      pastedDigits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pastedDigits.length, 5);
      otpInputsRef.current[nextFocus]?.focus();
      return;
    }

    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    // Auto-advance to next input box
    if (cleanVal && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // ==========================================
  // CREATE ACCOUNT: Step 2 - Verify OTP
  // ==========================================
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit code received in your email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyOtp(createEmail, fullOtp);
      setSuccessMsg(res.message || 'Email verified successfully! Now create your account password.');
      setCreateStep('password');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired verification code. Please check your email inbox.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setErrorMsg(null);
    try {
      const res = await sendOtp(createEmail, fullName.trim());
      setSuccessMsg(res.message || `A new 6-digit verification code has been dispatched to ${createEmail}`);
      if (res.devOtp) {
        setDevOtpCode(res.devOtp);
        setWasRealEmailSent(false);
      } else {
        setDevOtpCode(null);
        setWasRealEmailSent(true);
      }
      setResendTimer(60);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend verification code.');
    }
  };

  // ==========================================
  // CREATE ACCOUNT: Step 3 - Set Password & Store in DB
  // ==========================================
  const handleCreatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordTouched(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!passwordValidation.isValid) {
      setErrorMsg(passwordValidation.error || 'Password does not meet the security criteria.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createAccount({
        email: createEmail,
        fullName: fullName.trim(),
        password,
        code: otpDigits.join('')
      });

      setSuccessMsg('Account registered successfully! Redirecting to customs dashboard...');
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Account registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // LOGIN: Authenticate with registered credentials from DB
  // ==========================================
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginEmailTouched(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isLoginEmailValid) {
      setErrorMsg(loginEmailValidation.error || 'Please enter a valid email address.');
      return;
    }

    if (!loginPassword) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
      setSuccessMsg('Credentials verified! Accessing secure portal session...');
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify your email and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isAuthLoading || isSubmitting;

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-10 right-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10 space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-sky-400 shadow-glow-primary mb-1">
            <Ship className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold font-display tracking-tight text-white">
            DocuSetu
          </h2>
          <p className="text-xs text-slate-400">
            Intelligent Document Processing for Global Trade &amp; Customs
          </p>
        </div>

        {/* Auth Glass Card */}
        <div className="glass-panel-glow p-7 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-2xl space-y-5">
          {/* Top Options Switcher: 1. Create account  2. Login */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800">
            <button
              type="button"
              onClick={() => handleSwitchMode('create')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'create'
                  ? 'bg-brand-600 text-white shadow-glow-primary'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create account</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchMode('login')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-brand-600 text-white shadow-glow-primary'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          </div>

          {/* Card Section Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200">
                {mode === 'create'
                  ? createStep === 'email_name'
                    ? 'Create Account'
                    : createStep === 'otp'
                    ? 'Enter Email OTP'
                    : 'Set Account Password'
                  : 'Account Login'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {mode === 'create'
                  ? createStep === 'email_name'
                    ? 'Enter your name & valid email to receive your OTP'
                    : createStep === 'otp'
                    ? 'Enter the 6-digit code received in your email'
                    : 'Create a secure password stored in the database'
                  : 'Enter your registered email and password to log in'}
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Database Auth
            </span>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed font-medium">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMsg}</div>
            </div>
          )}

          {/* ========================================== */}
          {/* OPTION 1: CREATE ACCOUNT FLOW              */}
          {/* ========================================== */}
          {mode === 'create' && (
            <>
              {/* STEP 1: Enter Name & Email */}
              {createStep === 'email_name' && (
                <form onSubmit={handleSendOtpSubmit} className="space-y-4">
                  {/* Full Name Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        placeholder="e.g. Officer Rajesh Sharma"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Valid Email Section */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Email Address <span className="text-rose-400">*</span>
                      </label>
                      {/* Real-time Email Validity Indicator */}
                      {createEmail.length > 0 && (
                        <span
                          className={`text-[10px] font-medium flex items-center gap-1 ${
                            isCreateEmailValid ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isCreateEmailValid ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Valid Email
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 text-rose-400" />
                              Invalid format
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <Mail
                        className={`w-4 h-4 absolute left-3.5 top-3 transition-colors ${
                          isCreateEmailValid
                            ? 'text-emerald-400'
                            : createEmailTouched && !isCreateEmailValid
                            ? 'text-rose-400'
                            : 'text-slate-500'
                        }`}
                      />
                      <input
                        type="email"
                        required
                        value={createEmail}
                        onChange={(e) => {
                          setCreateEmail(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        onBlur={() => setCreateEmailTouched(true)}
                        placeholder="name@company.com or name@gmail.com"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                          isCreateEmailValid
                            ? 'border-emerald-500/60 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                            : createEmailTouched && createEmail.length > 0
                            ? 'border-rose-500/60 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                            : 'border-slate-700/80 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                        }`}
                      />
                    </div>

                    {createEmailTouched && !isCreateEmailValid && createEmail.length > 0 && (
                      <p className="mt-1.5 text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {createEmailValidation.error || 'Please enter a valid, non-disposable email.'}
                      </p>
                    )}
                    {!createEmailTouched && (
                      <p className="mt-1.5 text-[11px] text-slate-500">
                        An email containing your 6-digit OTP will be dispatched to verify your account.
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || !isCreateEmailValid || !fullName.trim()}
                    className={`w-full py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                      isCreateEmailValid && fullName.trim()
                        ? 'bg-brand-600 hover:bg-brand-500 shadow-glow-primary cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending OTP to Email...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Send Verification OTP</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: Enter 6-Digit OTP */}
              {createStep === 'otp' && (
                <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                  {/* Email badge with back option */}
                  <div className="flex items-center justify-between text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-300 truncate">
                      <Mail className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                      <span className="truncate font-mono text-[11px]">{createEmail}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateStep('email_name');
                        setErrorMsg(null);
                      }}
                      className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Edit
                    </button>
                  </div>

                  {/* Instruction banner */}
                  {devOtpCode ? (
                    <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-amber-300">
                          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Evaluation Mode OTP:</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const digits = devOtpCode.slice(0, 6).split('');
                            setOtpDigits(digits);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-400/25 hover:bg-amber-400/35 text-amber-200 text-[11px] font-mono font-bold transition-all cursor-pointer border border-amber-400/40 shadow-sm"
                        >
                          Auto-fill: {devOtpCode}
                        </button>
                      </div>
                      <p className="text-[11px] text-amber-200/90 leading-relaxed">
                        To receive OTPs in your real Gmail inbox, set <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono">SMTP_USER</code> and <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono">SMTP_PASS</code> (16-char Gmail App Password) in your <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono">.env</code> or Vercel Environment Variables.
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-medium pt-0.5">
                        <Lock className="w-3 h-3 shrink-0" />
                        <span>OTP expires in 5 minutes &bull; Maximum 3 attempts</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-brand-500/30 text-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center gap-2 text-brand-300 font-bold text-xs">
                        <Inbox className="w-4 h-4 text-brand-400" />
                        <span>Check Your Email Inbox</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        We have dispatched a 6-digit one-time passcode (OTP) to <strong className="text-white">{createEmail}</strong>. Please check your inbox or Spam/Junk folder.
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium pt-0.5">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>Live Email Dispatched &bull; Valid for 5 minutes</span>
                      </div>
                    </div>
                  )}

                  {/* 6 Digit Inputs */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300 text-center">
                      Enter 6-Digit Verification Code
                    </label>
                    <div className="flex justify-between gap-2">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => { otpInputsRef.current[idx] = el; }}
                          type="text"
                          maxLength={1}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={digit}
                          onChange={(e) => handleDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(idx, e)}
                          className="w-12 h-12 text-center text-lg font-bold font-mono rounded-xl bg-slate-900/90 border border-slate-700 text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/50 transition-all shadow-inner"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Verify Code Button */}
                  <button
                    type="submit"
                    disabled={isLoading || otpDigits.join('').length !== 6}
                    className={`w-full py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                      otpDigits.join('').length === 6
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-glow-primary cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying Security Code...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify OTP &amp; Continue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  {/* Resend OTP */}
                  <div className="text-center pt-1">
                    {resendTimer > 0 ? (
                      <span className="text-[11px] text-slate-400">
                        Resend code in <span className="font-mono text-brand-400 font-bold">{resendTimer}s</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-2 cursor-pointer"
                      >
                        Didn&apos;t receive the code? Resend OTP
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* STEP 3: Create Password & Store in Database */}
              {createStep === 'password' && (
                <form onSubmit={handleCreatePasswordSubmit} className="space-y-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Email verified! Create your account password for DocuSetu.</span>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Create Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        onBlur={() => setPasswordTouched(true)}
                        placeholder="At least 8 characters"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Confirm Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        placeholder="Re-enter password"
                        className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/80 border text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                          confirmPassword && doPasswordsMatch
                            ? 'border-emerald-500/60 focus:border-emerald-500'
                            : confirmPassword && !doPasswordsMatch
                            ? 'border-rose-500/60 focus:border-rose-500'
                            : 'border-slate-700/80 focus:border-brand-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Checklist */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] space-y-1.5">
                    <div className="text-slate-400 font-semibold mb-1">Password Requirements:</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className={`flex items-center gap-1.5 ${passwordValidation.hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Check className="w-3 h-3" />
                        <span>8+ Characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordValidation.hasUppercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Check className="w-3 h-3" />
                        <span>Uppercase (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordValidation.hasLowercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Check className="w-3 h-3" />
                        <span>Lowercase (a-z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordValidation.hasNumberOrSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Check className="w-3 h-3" />
                        <span>Number / Symbol</span>
                      </div>
                    </div>
                  </div>

                  {/* Complete Registration Button */}
                  <button
                    type="submit"
                    disabled={isLoading || !passwordValidation.isValid || !doPasswordsMatch}
                    className={`w-full py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                      passwordValidation.isValid && doPasswordsMatch
                        ? 'bg-brand-600 hover:bg-brand-500 shadow-glow-primary cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Account in Database...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Create Account &amp; Access Dashboard</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          {/* ========================================== */}
          {/* OPTION 2: LOGIN FLOW                       */}
          {/* ========================================== */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Registered Email */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Registered Email <span className="text-rose-400">*</span>
                  </label>
                  {loginEmail.length > 0 && (
                    <span
                      className={`text-[10px] font-medium flex items-center gap-1 ${
                        isLoginEmailValid ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isLoginEmailValid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Valid Email
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-rose-400" />
                          Invalid format
                        </>
                      )}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Mail
                    className={`w-4 h-4 absolute left-3.5 top-3 transition-colors ${
                      isLoginEmailValid
                        ? 'text-emerald-400'
                        : loginEmailTouched && !isLoginEmailValid
                        ? 'text-rose-400'
                        : 'text-slate-500'
                    }`}
                  />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    onBlur={() => setLoginEmailTouched(true)}
                    placeholder="Enter your registered email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !isLoginEmailValid || !loginPassword}
                className={`w-full py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                  isLoginEmailValid && loginPassword
                    ? 'bg-brand-600 hover:bg-brand-500 shadow-glow-primary cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Credentials with Database...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Sign In to Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Toggle Helper Link */}
          <div className="pt-2 text-center border-t border-slate-800/80">
            {mode === 'create' ? (
              <p className="text-xs text-slate-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-2 cursor-pointer ml-1"
                >
                  Login to your account
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Don&apos;t have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('create')}
                  className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-2 cursor-pointer ml-1"
                >
                  Create an account
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Security & RLS Badges */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Row-Level Security (RLS)</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-brand-400" />
            <span>Encrypted Database Storage</span>
          </div>
        </div>
      </div>
    </div>
  );
};
