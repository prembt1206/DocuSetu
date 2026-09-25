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
  Sparkles
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    validateGmail,
    sendOtp,
    verifyOtp,
    loginAsDemo,
    isLoading
  } = useAuth();

  // Step state: 'email' | 'otp'
  const [step, setStep] = useState<'email' | 'otp'>('email');

  // Input states
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);

  // UI / Feedback states
  const [emailTouched, setEmailTouched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(0);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const from = location.state?.from?.pathname || '/dashboard';

  // Strict Real-time Gmail validation
  const validationResult = validateGmail(email);
  const isGmailValid = validationResult.isValid;

  // Countdown timer effect for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // Focus first OTP input when moving to OTP step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Handle Requesting OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isGmailValid) {
      setErrorMsg(validationResult.error || 'Please enter a valid @gmail.com address.');
      return;
    }

    try {
      const res = await sendOtp(email);
      setSuccessMsg(res.message || `A 6-digit security code has been sent to ${email}`);
      setResendTimer(60);
      setStep('otp');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch verification code. Please verify your email and try again.');
    }
  };

  // Handle OTP Digit Input changes
  const handleDigitChange = (index: number, val: string) => {
    // Only accept numeric characters
    const cleanVal = val.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (cleanVal.length > 1) {
      // Pasted multi-digit OTP
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

    // Auto advance to next box
    if (cleanVal && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Submit OTP Verification strictly
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const fullOtp = otpDigits.join('');

    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code received in your Gmail.');
      return;
    }

    try {
      await verifyOtp(email, fullOtp, fullName.trim() || undefined);
      setSuccessMsg('Gmail verified successfully! Authenticating portal session...');
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check the code in your Gmail inbox.');
    }
  };

  // Handle Resend OTP
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setErrorMsg(null);
    try {
      const res = await sendOtp(email);
      setSuccessMsg(res.message || `A new 6-digit code has been sent to ${email}`);
      setResendTimer(60);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend code.');
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-10 right-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-sky-400 shadow-glow-primary mb-2">
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
        <div className="glass-panel-glow p-8 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-2xl space-y-6">
          {/* Card Title & Supabase Status Badge */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">
                {step === 'email' ? 'Strict Gmail Verification' : 'Enter Verification Code'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {step === 'email'
                  ? 'Enter your verified @gmail.com account'
                  : 'Enter the 6-digit code received in your Gmail inbox'}
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Supabase Auth
            </span>
          </div>

          {/* Feedback Messages */}
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

          {/* STEP 1: Enter Gmail & Name */}
          {step === 'email' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              {/* Email Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Google / Gmail Address <span className="text-rose-400">*</span>
                  </label>
                  {/* Real-time Gmail status badge */}
                  {email.length > 0 && (
                    <span
                      className={`text-[10px] font-medium flex items-center gap-1 ${
                        isGmailValid ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isGmailValid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Verified @gmail.com
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
                      isGmailValid
                        ? 'text-emerald-400'
                        : emailTouched && !isGmailValid
                        ? 'text-rose-400'
                        : 'text-slate-500'
                    }`}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="yourname@gmail.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                      isGmailValid
                        ? 'border-emerald-500/60 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                        : emailTouched && email.length > 0
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-slate-700/80 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                    }`}
                  />
                </div>

                {/* Validation helper hint */}
                {emailTouched && !isGmailValid && email.length > 0 && (
                  <p className="mt-1.5 text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {validationResult.error || 'Only genuine @gmail.com addresses can be verified.'}
                  </p>
                )}
                {!emailTouched && (
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    A strictly verified 6-digit OTP will be dispatched to your Gmail inbox.
                  </p>
                )}
              </div>

              {/* Full Name / Officer Designation */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name / Officer Designation <span className="text-slate-500 text-[10px]">(Stored in Supabase)</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Capt. Rajesh Sharma"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !isGmailValid}
                className={`w-full py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                  isGmailValid
                    ? 'bg-brand-600 hover:bg-brand-500 shadow-glow-primary cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching Verification Code to Gmail...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Send Verification Code to Gmail</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Verify 6-Digit OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-5">
              {/* Back to Email toggle */}
              <div className="flex items-center justify-between text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-slate-300 truncate">
                  <Mail className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                  <span className="truncate font-mono text-[11px]">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setErrorMsg(null);
                  }}
                  className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Edit
                </button>
              </div>

              {/* Instructions banner directing user to check their real Gmail inbox */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-brand-500/30 text-slate-200 text-xs space-y-2">
                <div className="flex items-center gap-2 text-brand-300 font-bold text-xs">
                  <Inbox className="w-4 h-4 text-brand-400" />
                  <span>Check Your Gmail Inbox</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  We have dispatched your 6-digit one-time passcode to <strong className="text-white">{email}</strong>. Please check your inbox or Spam/Junk folder.
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-medium pt-1">
                  <Lock className="w-3 h-3 shrink-0" />
                  <span>Code expires in 5 minutes &bull; Maximum 3 attempts</span>
                </div>
              </div>

              {/* 6-Digit Input Boxes */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 text-center">
                  Enter 6-Digit Code
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

              {/* Verify & Login Button */}
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
                    <span>Verifying Code &amp; Syncing with Supabase...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify Code &amp; Access Dashboard</span>
                  </>
                )}
              </button>

              {/* Resend Timer */}
              <div className="text-center pt-1">
                {resendTimer > 0 ? (
                  <span className="text-[11px] text-slate-400">
                    Resend code in <span className="font-mono text-brand-400 font-bold">{resendTimer}s</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-2 cursor-pointer"
                  >
                    Didn&apos;t receive the code? Resend OTP
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Quick Demo Login Option for testing */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-center text-xs text-slate-400">
              <span className="h-px bg-slate-800 flex-1" />
              <span>Developer Evaluation</span>
              <span className="h-px bg-slate-800 flex-1" />
            </div>

            <button
              onClick={() => {
                loginAsDemo();
                navigate(from, { replace: true });
              }}
              type="button"
              className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Instant Test Demo Access (Apex Global Brokerage)</span>
            </button>
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
            <span>Encrypted Supabase Storage</span>
          </div>
        </div>
      </div>
    </div>
  );
};
