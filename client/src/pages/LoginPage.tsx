import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Ship,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  User,
  ArrowLeft
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
    isLoading,
    lastGeneratedOtp
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
  const [copiedCode, setCopiedCode] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const from = location.state?.from?.pathname || '/dashboard';

  // Real-time Gmail validation
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
      setSuccessMsg(res.message || `Verification code sent to ${email}`);
      setResendTimer(60);
      setStep('otp');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP verification code. Please try again.');
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

  // One-click fill verification code
  const handleAutoFillOtp = (code: string) => {
    const digits = code.slice(0, 6).split('');
    const newDigits = ['', '', '', '', '', ''];
    digits.forEach((d, i) => {
      newDigits[i] = d;
    });
    setOtpDigits(newDigits);
    otpInputsRef.current[5]?.focus();
  };

  // Submit OTP Verification
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const fullOtp = otpDigits.join('');

    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of your verification code.');
      return;
    }

    try {
      await verifyOtp(email, fullOtp, fullName.trim() || undefined);
      setSuccessMsg('Gmail verified! Syncing profile to Supabase...');
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check the code.');
    }
  };

  // Handle Resend OTP
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setErrorMsg(null);
    try {
      const res = await sendOtp(email);
      setSuccessMsg(res.message || `New code sent to ${email}`);
      setResendTimer(60);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend code.');
    }
  };

  // Quick Demo Broker Access
  const handleDemoAccess = () => {
    loginAsDemo();
    navigate(from, { replace: true });
  };

  const currentOtpDisplay = lastGeneratedOtp || '123456';

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-10 right-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Form Container */}
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
                {step === 'email' ? 'Gmail OTP Authentication' : 'Verify 6-Digit Code'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {step === 'email'
                  ? 'Secure passwordless login with Supabase user sync'
                  : 'Enter the verification code sent to your Gmail'}
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
              <div className="flex-1 leading-relaxed">{errorMsg}</div>
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
                        isGmailValid ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {isGmailValid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Valid @gmail.com
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          Must end in @gmail.com
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
                    placeholder="customs.officer@gmail.com"
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
                  <p className="mt-1.5 text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {validationResult.error || 'Only genuine @gmail.com addresses can be verified.'}
                  </p>
                )}
                {!emailTouched && (
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    DocuSetu sends a 6-digit OTP code to verify your Google identity.
                  </p>
                )}
              </div>

              {/* Full Name / Organization Persona */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name / Officer Designation <span className="text-slate-500 text-[10px]">(Optional for Supabase Profile)</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan (Senior Broker)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || (!isGmailValid && email.length > 0)}
                className={`w-full py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                  isGmailValid
                    ? 'bg-brand-600 hover:bg-brand-500 shadow-glow-primary cursor-pointer'
                    : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Verification Code...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Send 6-Digit Verification Code</span>
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
                  className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 shrink-0 ml-2"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Change
                </button>
              </div>

              {/* Instant Verification Helper Banner */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-brand-950/80 to-indigo-950/80 border border-brand-500/40 text-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-brand-300 font-bold text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
                    <span>Generated OTP Code</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAutoFillOtp(currentOtpDisplay)}
                    className="text-[10px] bg-brand-600 hover:bg-brand-500 text-white font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 transition-all"
                  >
                    1-Click Auto-Fill
                  </button>
                </div>
                <div className="flex items-center justify-between bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700/80">
                  <span className="font-mono text-base tracking-widest text-emerald-400 font-extrabold">
                    {currentOtpDisplay}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(currentOtpDisplay);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Enter the 6-digit code above or use the master fallback code <span className="font-mono text-slate-300">123456</span>.
                </p>
              </div>

              {/* 6-Digit Input Boxes */}
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
                    <span>Verifying &amp; Registering in Supabase...</span>
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
                    className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-2"
                  >
                    Didn&apos;t receive the code? Resend OTP
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Quick Demo Login Option */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-center text-xs text-slate-400">
              <span className="h-px bg-slate-800 flex-1" />
              <span>Zero-Config Evaluation</span>
              <span className="h-px bg-slate-800 flex-1" />
            </div>

            <button
              onClick={handleDemoAccess}
              type="button"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950/70 hover:from-slate-800 hover:to-indigo-900 border border-brand-500/30 text-brand-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Instant One-Click Demo Access (Apex Global)</span>
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
            <span>Supabase User Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
};
