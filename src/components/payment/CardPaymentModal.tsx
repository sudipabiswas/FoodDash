"use client";

import React, { useState, useEffect } from "react";
import { 
  X, Lock, CreditCard, ShieldCheck, CheckCircle2, 
  AlertCircle, ArrowRight, RefreshCw, Smartphone, 
  Clock, Mail, Key, Sparkles, Check, Info 
} from "lucide-react";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";

interface CardPaymentModalProps {
  orders: any[]; // The orders created during checkout
  preferredGateway?: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "SELECT_PAYMENT" | "CARD_INPUT" | "REDIRECTING" | "OTP_VERIFICATION" | "SUCCESS" | "FAILURE";

// Luhn Algorithm helper for offline simulator
const validateLuhn = (num: string): boolean => {
  const clean = num.replace(/\s/g, "");
  if (!/^\d+$/.test(clean) || clean.length < 15 || clean.length > 16) return false;
  
  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

// Expiry date validation helper for offline simulator
const validateExpiry = (expiry: string): boolean => {
  if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
  const [monthStr, yearStr] = expiry.split("/");
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10) + 2000;
  if (month < 1 || month > 12) return false;
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  return true;
};

export default function CardPaymentModal({ orders, preferredGateway, onClose, onSuccess }: CardPaymentModalProps) {
  const [step, setStep] = useState<Step>(preferredGateway ? "REDIRECTING" : "SELECT_PAYMENT");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // Simulator Mode Flag
  const [isSimulatorMode, setIsSimulatorMode] = useState(false);
  const [simulatedIntentId, setSimulatedIntentId] = useState("");

  // Card Form State (for simulator fallback)
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);

  // Real-time Field Validity states (for simulator fallback)
  const [cardNumberValid, setCardNumberValid] = useState(false);
  const [cardNumberTouched, setCardNumberTouched] = useState(false);
  const [expiryValid, setExpiryValid] = useState(false);
  const [expiryTouched, setExpiryTouched] = useState(false);
  const [cvvValid, setCvvValid] = useState(false);
  const [cvvTouched, setCvvTouched] = useState(false);
  const [cardholderValid, setCardholderValid] = useState(false);
  const [cardholderTouched, setCardholderTouched] = useState(false);

  // Real-time User/Session Auth states
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // OTP State (for simulator fallback)
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpTimer, setOtpTimer] = useState(180); // 3 minutes

  // Calculate total price in BDT
  const totalAmount = orders.reduce((sum, order) => sum + order.totalPrice, 0);

  // OTP Timer countdown for simulator
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "OTP_VERIFICATION" && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  // Card brand detection (for simulator fallback)
  const getCardBrand = (num: string) => {
    const cleanNum = num.replace(/\s/g, "");
    if (cleanNum.startsWith("4")) return "VISA";
    if (cleanNum.startsWith("5")) return "MASTERCARD";
    if (cleanNum.startsWith("3")) return "AMEX";
    if (cleanNum.startsWith("6")) return "DISCOVER";
    return "GENERIC";
  };

  const cardBrand = getCardBrand(cardNumber);

  // Real-time Validation Side Effects
  useEffect(() => {
    setCardNumberValid(validateLuhn(cardNumber));
  }, [cardNumber]);

  useEffect(() => {
    setExpiryValid(validateExpiry(expiryDate));
  }, [expiryDate]);

  useEffect(() => {
    const limit = cardBrand === "AMEX" ? 4 : 3;
    setCvvValid(/^\d+$/.test(cvv) && cvv.length === limit);
  }, [cvv, cardBrand]);

  useEffect(() => {
    setCardholderValid(cardholderName.trim().length >= 3);
  }, [cardholderName]);

  const isFormValid = cardNumberValid && expiryValid && cvvValid && cardholderValid;

  // Format Card Number
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 16) val = val.substring(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join(" ") || "";
    setCardNumber(formatted);
  };

  // Format Expiry Date
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 4) val = val.substring(0, 4);

    if (val.length >= 2) {
      const month = val.substring(0, 2);
      const year = val.substring(2);
      const numMonth = parseInt(month, 10);
      if (numMonth > 12) {
        setExpiryDate("12/" + year);
      } else if (numMonth === 0) {
        setExpiryDate("01/" + year);
      } else {
        setExpiryDate(`${month}/${year}`);
      }
    } else {
      setExpiryDate(val);
    }
  };

  // CVV Input limit
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    const limit = cardBrand === "AMEX" ? 4 : 3;
    if (val.length > limit) val = val.substring(0, limit);
    setCvv(val);
  };

  // Verify User/Session Status in Real-time
  const verifySession = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const session = await res.json();
      return !!(session && session.user);
    } catch {
      return false;
    }
  };

  // Initiate SSLCOMMERZ Hosted Redirection
  const handleRedirectPayment = async () => {
    setPaymentError("");
    setIsPaying(true);

    // Verify session state
    const isSessionActive = await verifySession();
    if (!isSessionActive) {
      setIsPaying(false);
      setShowAuthOverlay(true);
      return;
    }

    try {
      setStep("REDIRECTING");

      // Generate secure client-side Idempotency-Key
      const idempotencyKey = typeof crypto !== "undefined" && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2) + Date.now().toString(36);

      // Check if this is a single order retry or cart checkout
      const isRetry = orders.length === 1 && orders[0].paymentStatus !== "PAID";
      const endpoint = isRetry 
        ? `/api/user/orders/${orders[0].id}/pay`
        : `/api/payment/create-intent`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify({
          orderIds: orders.map(o => o.id),
          preferredGateway
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gateway initialization failed.");
      }

      // Check if backend returned simulator instructions due to missing API keys
      if (data.simulator) {
        setIsSimulatorMode(true);
        setSimulatedIntentId(data.paymentIntentId);
        setIsPaying(false);
        setStep("CARD_INPUT");
        toast.success("Credentials missing. Running sandbox simulator mode.", { icon: "🔧" });
        return;
      }

      // Redirect browser to SSLCOMMERZ Hosted Portal
      if (data.gatewayUrl) {
        window.location.href = data.gatewayUrl;
      } else {
        throw new Error("Invalid gateway response payload.");
      }
    } catch (err: any) {
      setIsPaying(false);
      setStep("SELECT_PAYMENT");
      setPaymentError(err.message || "Failed to initialize SSLCOMMERZ payment.");
      toast.error(err.message || "Gateway initialization failed.", { icon: "❌" });
    }
  };

  // Auto-trigger gateway redirection if a preferred gateway (BKASH / SSLCOMMERZ) was pre-selected
  useEffect(() => {
    if (preferredGateway && step === "REDIRECTING") {
      handleRedirectPayment();
    }
  }, [preferredGateway]);

  // Submit Simulator Card details (Fallback Path)
  const handleSimulatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");

    if (!isFormValid) {
      setCardNumberTouched(true);
      setExpiryTouched(true);
      setCvvTouched(true);
      setCardholderTouched(true);
      setPaymentError("Please fix card input errors.");
      return;
    }

    setIsPaying(true);
    const isSessionActive = await verifySession();
    if (!isSessionActive) {
      setIsPaying(false);
      setShowAuthOverlay(true);
      return;
    }

    setStep("REDIRECTING");

    setTimeout(() => {
      setIsPaying(false);
      setStep("OTP_VERIFICATION");
      setOtpTimer(180);
      toast.success("Security SMS Sent! Use code 123456.", { icon: "📱" });
    }, 1500);
  };

  // Verify Simulator OTP (Fallback Path)
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    setIsPaying(true);

    const isSessionActive = await verifySession();
    if (!isSessionActive) {
      setIsPaying(false);
      setShowAuthOverlay(true);
      return;
    }

    try {
      // Direct call to order pay route passing details and OTP code
      const promises = orders.map(async (order) => {
        const res = await fetch(`/api/user/orders/${order.id}/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardNumber,
            cardholderName,
            expiryDate,
            cvv,
            otp,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Payment failed");
        }
        return data;
      });

      await Promise.all(promises);
      setStep("SUCCESS");
      toast.success("Payment settled successfully!", { icon: "🎉" });
    } catch (err: any) {
      setOtpError(err.message || "OTP verification failed.");
      if (!err.message?.includes("Incorrect OTP")) {
        setStep("FAILURE");
      }
    } finally {
      setIsPaying(false);
    }
  };

  // Re-authentication submit handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const result = await signIn("credentials", {
        email: authEmail,
        password: authPassword,
        redirect: false,
      });

      if (result?.error) {
        setAuthError("Invalid credentials.");
      } else {
        const sessionActive = await verifySession();
        if (sessionActive) {
          setShowAuthOverlay(false);
          setAuthEmail("");
          setAuthPassword("");
          toast.success("Session restored! Resuming payment...", { icon: "🔐" });
          
          // Re-trigger payment process
          if (isSimulatorMode) {
            setStep("CARD_INPUT");
          } else {
            handleRedirectPayment();
          }
        } else {
          setAuthError("Failed to restore session.");
        }
      }
    } catch (err) {
      setAuthError("An unexpected error occurred.");
    } finally {
      setAuthLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  const getInputStyles = (isValid: boolean, isTouched: boolean) => {
    if (!isTouched) return "border-input bg-muted/20 focus:ring-primary/20 focus:border-primary";
    return isValid 
      ? "border-emerald-500 bg-emerald-500/5 focus:ring-emerald-500/20 focus:border-emerald-500" 
      : "border-rose-500 bg-rose-500/5 focus:ring-rose-500/20 focus:border-rose-500";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-card border w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col relative max-h-[90vh]">
        
        <style jsx>{`
          .flip-card { perspective: 1000px; }
          .flip-card-inner {
            transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            transform-style: preserve-3d;
          }
          .flip-card.flipped .flip-card-inner { transform: rotateY(180deg); }
          .flip-card-front, .flip-card-back {
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
          }
          .flip-card-back { transform: rotateY(180deg); }
        `}</style>

        {/* Modal Header */}
        <div className="p-6 border-b flex justify-between items-center bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black leading-none">FoodDash Payment Gateway</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Bangladesh Bank PSO Compliant checkout</p>
            </div>
          </div>
          {!isPaying && step !== "REDIRECTING" && step !== "SUCCESS" && !showAuthOverlay && (
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Real-time Session Re-Authentication Overlay */}
        {showAuthOverlay && (
          <div className="absolute inset-0 bg-background/95 z-50 flex flex-col justify-center p-8 animate-in fade-in duration-300">
            <div className="w-full max-w-md mx-auto space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-xl font-black">Re-authentication Required</h3>
                <p className="text-sm text-muted-foreground">
                  Your session is expired or unauthenticated. Enter credentials to authorize this charge of **৳{totalAmount.toFixed(2)}** BDT.
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border bg-muted/10 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border bg-muted/10 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAuthOverlay(false);
                      onClose();
                    }}
                    className="flex-1 py-3 border rounded-xl font-bold text-sm hover:bg-muted transition-colors"
                  >
                    Cancel Checkout
                  </button>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-black text-sm hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {authLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Re-Authenticate
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Scroll Container */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">

          {/* STEP 0: SELECT SSLCOMMERZ SECURE PAYMENT */}
          {step === "SELECT_PAYMENT" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-primary">Payment Summary</p>
                <h3 className="text-4xl font-extrabold font-mono text-foreground">৳{totalAmount.toFixed(2)} <span className="text-xs font-bold text-muted-foreground uppercase">BDT</span></h3>
                <p className="text-xs text-muted-foreground">Order total: {orders.length} order{orders.length > 1 ? "s" : ""}</p>
              </div>

              {paymentError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Supported payment icons card */}
              <div className="p-6 bg-muted/20 border border-dashed rounded-3xl space-y-4">
                <div className="text-center">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Supported Payment Methods</p>
                </div>
                <div className="flex flex-wrap justify-center gap-4 text-xs font-black text-muted-foreground">
                  <span className="px-3 py-1.5 bg-background border rounded-xl shadow-sm flex items-center gap-1.5 text-primary-foreground bg-primary/5">💳 Cards</span>
                  <span className="px-3 py-1.5 bg-background border rounded-xl shadow-sm flex items-center gap-1.5 text-pink-600">📱 bKash</span>
                  <span className="px-3 py-1.5 bg-background border rounded-xl shadow-sm flex items-center gap-1.5 text-orange-500">🔥 Nagad</span>
                  <span className="px-3 py-1.5 bg-background border rounded-xl shadow-sm flex items-center gap-1.5 text-purple-700">🚀 Rocket</span>
                  <span className="px-3 py-1.5 bg-background border rounded-xl shadow-sm flex items-center gap-1.5">🏦 Net Banking</span>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <button
                  onClick={handleRedirectPayment}
                  disabled={isPaying}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/15"
                >
                  {isPaying ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Loading Gateway...
                    </>
                  ) : (
                    <>
                      Pay via SSLCOMMERZ
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground font-mono">
                    You will be securely redirected to the SSLCOMMERZ Hosted Page to authenticate card / mobile bank transactions.
                  </p>
                </div>
              </div>

              {/* Compliance & Security badge footer */}
              <div className="pt-6 border-t flex justify-around text-center">
                <div className="space-y-1">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto" />
                  <p className="text-[9px] font-bold uppercase tracking-wider">PCI-DSS Compliant</p>
                  <p className="text-[8px] text-muted-foreground">Level 1 certified layers</p>
                </div>
                <div className="space-y-1">
                  <Lock className="w-5 h-5 text-primary mx-auto" />
                  <p className="text-[9px] font-bold uppercase tracking-wider">Bangladesh Bank</p>
                  <p className="text-[8px] text-muted-foreground">Authorized PSO channel</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: CARD DETAIL INPUT (ONLY SHOWN FOR SIMULATOR FALLBACK MODE) */}
          {step === "CARD_INPUT" && isSimulatorMode && (
            <div className="space-y-6">
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-800 dark:text-yellow-400 text-xs font-bold rounded-2xl flex items-center gap-2">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>SSLCOMMERZ not configured. Sandbox simulator is active.</span>
              </div>

              {/* Card visualizer */}
              <div className="flex justify-center py-2">
                <div className={`flip-card w-full max-w-[360px] h-[210px] rounded-2xl shadow-xl cursor-pointer ${isFlipped ? "flipped" : ""}`} onClick={() => setIsFlipped(!isFlipped)}>
                  <div className="flip-card-inner w-full h-full relative">
                    {/* Front */}
                    <div className="flip-card-front absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-tr from-purple-700 via-indigo-700 to-blue-600 text-white p-6 flex flex-col justify-between overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
                      <div className="flex justify-between items-start z-10">
                        <div className="w-10 h-8 rounded-md bg-gradient-to-r from-amber-300 to-yellow-500 relative flex items-center justify-center shadow-md">
                          <div className="w-full h-[1px] bg-amber-900/20 absolute top-1/4" />
                          <div className="w-full h-[1px] bg-amber-900/20 absolute top-1/2" />
                          <div className="w-full h-[1px] bg-amber-900/20 absolute top-3/4" />
                        </div>
                        <div className="font-black italic tracking-wider text-sm flex items-center gap-1.5">
                          {cardNumberValid && <Sparkles className="w-3.5 h-3.5 text-yellow-300" />}
                          {cardBrand === "VISA" && <span>VISA</span>}
                          {cardBrand === "MASTERCARD" && <span className="text-orange-400">Mastercard</span>}
                          {cardBrand === "AMEX" && <span className="text-sky-300">AMEX</span>}
                          {cardBrand === "DISCOVER" && <span className="text-amber-400">Discover</span>}
                          {cardBrand === "GENERIC" && <CreditCard className="w-6 h-6 opacity-75" />}
                        </div>
                      </div>
                      <div className="text-xl font-bold tracking-[0.15em] font-mono py-2 text-center drop-shadow-sm z-10">
                        {cardNumber || "•••• •••• •••• ••••"}
                      </div>
                      <div className="flex justify-between items-end z-10">
                        <div className="flex-1 max-w-[70%]">
                          <p className="text-[8px] uppercase tracking-widest text-indigo-200">Cardholder</p>
                          <p className="text-sm font-extrabold truncate uppercase font-mono mt-0.5">{cardholderName || "CARD OWNER"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] uppercase tracking-widest text-indigo-200">Expires</p>
                          <p className="text-sm font-extrabold font-mono mt-0.5">{expiryDate || "MM/YY"}</p>
                        </div>
                      </div>
                    </div>
                    {/* Back */}
                    <div className="flip-card-back absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-tr from-purple-800 via-indigo-900 to-indigo-950 text-white p-6 flex flex-col justify-between overflow-hidden">
                      <div className="absolute top-6 left-0 right-0 h-10 bg-black/90" />
                      <div className="mt-14 flex items-center gap-3">
                        <div className="flex-1 h-9 bg-white/10 rounded-md border border-white/5 flex items-center px-3 justify-end text-xs italic text-indigo-300">Authorized Signature</div>
                        <div className="w-14 h-9 bg-yellow-100 text-slate-900 font-extrabold rounded-md flex items-center justify-center font-mono tracking-widest text-sm shadow-inner">{cvv || "•••"}</div>
                      </div>
                      <div className="text-[7px] text-indigo-300 leading-normal text-center mt-6">Secure sandbox simulated payment layers active.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Input fields */}
              <form onSubmit={handleSimulatorSubmit} className="space-y-4">
                {paymentError && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold rounded-2xl flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cardholder Name</label>
                  </div>
                  <input
                    type="text"
                    required
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    onFocus={() => setIsFlipped(false)}
                    onBlur={() => setCardholderTouched(true)}
                    className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all font-semibold ${getInputStyles(cardholderValid, cardholderTouched)}`}
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Card Number</label>
                    {cardNumberTouched && (
                      <span className={`text-[10px] font-bold ${cardNumberValid ? "text-emerald-600" : "text-rose-500"}`}>
                        {cardNumberValid ? "Luhn Validated" : "Invalid Card"}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      onFocus={() => setIsFlipped(false)}
                      onBlur={() => setCardNumberTouched(true)}
                      className={`w-full pl-12 pr-10 py-3 border rounded-xl outline-none focus:ring-2 transition-all font-mono font-bold ${getInputStyles(cardNumberValid, cardNumberTouched)}`}
                      placeholder="4000 1234 5678 9010"
                    />
                    <CreditCard className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Expiry Date</label>
                    <input
                      type="text"
                      required
                      value={expiryDate}
                      onChange={handleExpiryChange}
                      onFocus={() => setIsFlipped(false)}
                      onBlur={() => setExpiryTouched(true)}
                      className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all font-mono text-center font-bold ${getInputStyles(expiryValid, expiryTouched)}`}
                      placeholder="MM/YY"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">CVV / CVC</label>
                    <input
                      type="password"
                      required
                      value={cvv}
                      onChange={handleCvvChange}
                      onFocus={() => setIsFlipped(true)}
                      onBlur={() => {
                        setIsFlipped(false);
                        setCvvTouched(true);
                      }}
                      className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all font-mono text-center font-bold ${getInputStyles(cvvValid, cvvTouched)}`}
                      placeholder={cardBrand === "AMEX" ? "••••" : "•••"}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPaying || !isFormValid}
                  className="w-full mt-6 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-xl"
                >
                  Pay ৳{totalAmount.toFixed(2)}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: REDIRECTING LOADER */}
          {step === "REDIRECTING" && (
            <div className="py-16 text-center space-y-6 flex flex-col items-center justify-center">
              <RefreshCw className="h-16 w-16 text-primary animate-spin" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Redirecting to SSLCOMMERZ...</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Connecting to secure payment portal. Please do not refresh or close this browser window.
                </p>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/30 border rounded-xl text-xs text-muted-foreground font-mono">
                <Lock className="w-3.5 h-3.5 text-primary" />
                <span>SSL Secured • 256-bit Encrypted Session</span>
              </div>
            </div>
          )}

          {/* STEP 3: OTP VERIFICATION (ONLY FOR SIMULATOR FALLBACK) */}
          {step === "OTP_VERIFICATION" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-[2rem] space-y-3">
                <h3 className="font-extrabold text-blue-700 text-sm tracking-widest uppercase">SafePay Sandbox Gateway</h3>
                <p className="text-sm">A test One-Time Password (OTP) has been issued for this retry session.</p>
                <p className="text-xs text-muted-foreground">Amount: <strong>৳{totalAmount.toFixed(2)} BDT</strong></p>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-800 rounded-2xl text-xs">
                <Smartphone className="w-5 h-5 inline mr-1 text-amber-500" />
                <strong>Sandbox Testing:</strong> Enter code <strong className="underline text-sm font-black">123456</strong> to verify transaction.
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-6 text-center">
                {otpError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold rounded-xl">
                    {otpError}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Enter verification OTP</label>
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").substring(0, 6))}
                    className="w-full max-w-[200px] mx-auto text-center px-4 py-4 rounded-xl border-2 border-primary bg-muted/20 text-2xl font-black font-mono tracking-[0.25em]"
                    placeholder="••••••"
                  />
                  <div className="text-xs text-muted-foreground pt-1 flex justify-center items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Code expires in <strong className="font-bold text-primary">{formatTime(otpTimer)}</strong></span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep("CARD_INPUT")}
                    className="flex-1 py-3 border rounded-xl font-bold hover:bg-muted"
                  >
                    Change Card
                  </button>
                  <button
                    type="submit"
                    disabled={isPaying || otpTimer === 0}
                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-black hover:opacity-90"
                  >
                    {isPaying ? "Verifying..." : "Confirm & Pay"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === "SUCCESS" && (
            <div className="py-12 text-center space-y-6 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 text-green-600 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-green-600">Payment Completed!</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Your payment of <strong>৳{totalAmount.toFixed(2)} BDT</strong> has been authorized.
                </p>
              </div>
              <button
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black text-lg hover:opacity-90"
              >
                Go to Order History
              </button>
            </div>
          )}

          {/* STEP 5: FAILURE */}
          {step === "FAILURE" && (
            <div className="py-12 text-center space-y-6 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 text-red-600 rounded-full flex items-center justify-center">
                <AlertCircle className="h-10 w-10 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-red-600">Payment Failed</h3>
                <p className="text-sm text-muted-foreground">The transaction could not be authorized.</p>
              </div>
              <div className="flex gap-4 w-full">
                <button
                  onClick={() => setStep("CARD_INPUT")}
                  className="flex-1 py-4 bg-muted rounded-2xl font-bold text-sm hover:bg-muted/80"
                >
                  Retry Card
                </button>
                <button
                  onClick={() => {
                    onSuccess();
                    onClose();
                  }}
                  className="flex-1 py-4 border rounded-2xl font-bold text-sm hover:bg-muted"
                >
                  Manage Orders
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
