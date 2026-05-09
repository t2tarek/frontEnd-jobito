import {
  MailIcon,
  LockIcon,
  LoaderIcon,
  MessageCircleIcon,
  ArrowLeftIcon,
} from "lucide-react";
import image from "../../../assets/login.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Style from "./Login.module.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import MyLoginPage from "../MyLoginPage/MyLoginPage";
import { useJobitoAuth } from "../../../context/LinkContxt.js";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "../../../context/translation-context";
import { useToast } from "../../../context/ToastContext";

import { API_BASE_URL } from "../../../services/api.js";
import { jwtDecode } from "jwt-decode";


interface LoginPageProps {
  setShowLogin: (value: boolean) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ setShowLogin }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { googleClientId } = useJobitoAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [isResetMode, setIsResetMode] = useState(false);
  const [resetMethod, setResetMethod] = useState<"google" | "email" | null>(
    null,
  );
  const [resetStep, setResetStep] = useState(1); // 1: Verify, 2: New Password

  const [resetEmail, setResetEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [googleToken, setGoogleToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  const handleGoogleLogin = async (response: CredentialResponse) => {
    if (!response.credential) return;

    if (isResetMode && resetMethod === "google" && resetStep === 1) {
      setGoogleToken(response.credential);
      setResetStep(2);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
        },
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Google login failed");

      const token = data.AccessToken || data.access_token || data.token;
      if (!token) throw new Error("No token received");

      localStorage.setItem("token", token);
      window.dispatchEvent(new Event("auth-changed"));
      setShowLogin(false);

      try {
        const decoded: any = jwtDecode(token);
        const rawRole = decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        const finalRole = rawRole === "company" ? "company" : "user";

        const isNewUser = localStorage.getItem("isNewUser");
        if (isNewUser) {
          localStorage.removeItem("isNewUser");
          navigate("/complete-profile", { replace: true });
        } else if (finalRole === "company") {
          navigate("/home", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch (e) {
        navigate("/");
      }

    } catch (err: unknown) {
      showToast(err instanceof Error ? t(err.message) : t("حدث خطأ ما"), "error");
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    try {
      setIsSendingCode(true);
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
        },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t("فشل إرسال الرمز"));
      showToast(t("تم إرسال رمز التحقق إلى بريدك الإلكتروني!"), "success");
      setResetStep(2); // Step 2 for email is code entry + new password
    } catch (err: unknown) {
      showToast(err instanceof Error ? t(err.message) : t("حدث خطأ ما"), "error");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast(t("كلمات المرور غير متطابقة!"), "error");
      return;
    }

    try {
      setIsResetting(true);
      let res;
      if (resetMethod === "google") {
        res = await fetch(`${API_BASE_URL}/api/auth/reset-password-google`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "69420",
          },
          body: JSON.stringify({ googleToken, new_password: newPassword }),
        });
      } else {
        res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "69420",
          },
          body: JSON.stringify({
            email: resetEmail,
            code: otpCode,
            new_password: newPassword,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Reset failed");

      showToast(t("Password reset success! Please login with your new password."), "success");
      setIsResetMode(false);
      setResetStep(1);
      setResetMethod(null);
      setGoogleToken("");
      setOtpCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      showToast(err instanceof Error ? t(err.message) : t("فشل إعادة تعيين كلمة المرور"), "error");
    } finally {
      setIsResetting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setIsLoggingIn(true);

      console.log(`🚀 [Login] Attempting to login to: ${API_BASE_URL}/api/auth/login`, { email });
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
        },
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        // If not JSON, use a generic message if the response is not OK
        if (!response.ok) {
          throw new Error(t("Login failed (Server Error)"));
        }
      }

      if (!response.ok) throw new Error(data?.message || t("Login failed"));

      const token = data.AccessToken || data.access_token || data.token;
      if (!token) throw new Error(t("Login failed (No token received)"));

      localStorage.setItem("token", token);
      window.dispatchEvent(new Event("auth-changed"));
      setShowLogin(false);
      
      try {
        const decoded: any = jwtDecode(token);
        const rawRole = decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        const finalRole = rawRole === "company" ? "company" : "user";

        const isNewUser = localStorage.getItem("isNewUser");
        if (isNewUser) {
          localStorage.removeItem("isNewUser");
          navigate("/complete-profile", { replace: true });
        } else if (finalRole === "company") {
          navigate("/home", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch (e) {
        navigate("/");
      }

    } catch (err: unknown) {
      const message =
        err instanceof Error ? t(err.message) : t("حدث خطأ ما");
      showToast(message, "error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const resetState = () => {
    setIsResetMode(false);
    setResetMethod(null);
    setResetStep(1);
    setGoogleToken("");
    setOtpCode("");
    setResetEmail("");
  };

  return (
    <div className={Style.loginWrapper}>
      <motion.div
        className={Style.loginLeft}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className={Style.centeredBox}>
          <div className={Style.header}>
            <div className={Style.logoIcon}>
              <MessageCircleIcon size={32} />
            </div>
            <h2 className={Style.title}>
              {isResetMode ? t("إعادة تعيين كلمة المرور") : t("مرحبا بك مجددا")}
            </h2>
            <p className={Style.subtitle}>
              {isResetMode
                ? t("اختر طريقة لإعادة تعيين كلمة المرور الخاصة بك")
                : t("تسجيل الدخول للوصول إلى حسابك")}
            </p>
          </div>

          {!isResetMode ? (
            <AnimatePresence mode="wait">
              <motion.form
                key="login-form"
                className={Style.form}
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className={Style.inputGroup}>
                  <label>{t("البريد الإلكتروني")}</label>
                  <div className={Style.relativeInput}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("johndoe@gmail.com")}
                      required
                    />
                  </div>
                </div>

                <div className={Style.inputGroup}>
                  <label>{t("كلمة المرور")}</label>
                  <div className={Style.relativeInput}>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("أدخل كلمة المرور الخاصة بك")}
                      required
                    />
                  </div>
                  <div className={Style.forgotLink}>
                    <button type="button" onClick={() => setIsResetMode(true)}>
                      {t("هل نسيت كلمة المرور؟")}
                    </button>
                  </div>
                </div>

                <button
                  className={Style.authbtn}
                  type="submit"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? <LoaderIcon className="loader" /> : t("تسجيل الدخول")}
                </button>

                <div className={Style.googleWrapper}>
                  {googleClientId && (
                    <div className={Style.GoogleOAuthProvide}>
                      <GoogleOAuthProvider clientId={googleClientId}>
                        <MyLoginPage onGoogleLogin={handleGoogleLogin} />
                      </GoogleOAuthProvider>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className={Style.secondaryBtn}
                  onClick={() => setShowLogin(false)}
                >
                  {t("ليس لديك حساب؟")}{" "}
                  <span style={{ fontWeight: 700, marginLeft: 6 }}>
                    {t("إنشاء حساب")}
                  </span>
                </button>
              </motion.form>
            </AnimatePresence>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key="reset-flow"
                className={Style.form}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {!resetMethod && (
                  <>
                    <div className={Style.methodGrid}>
                      <button
                        className={`${Style.methodBtn} ${Style.googleBtn}`}
                        onClick={() => setResetMethod("google")}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                        {t("التحقق عبر Google")}
                      </button>
                      <button
                        className={`${Style.methodBtn} ${Style.emailBtn}`}
                        onClick={() => setResetMethod("email")}
                      >
                        <MailIcon size={20} />
                        {t("التحقق عبر كود البريد الإلكتروني")}
                      </button>
                    </div>
                    <button onClick={resetState} className={Style.backBtn}>
                      <ArrowLeftIcon
                        size={16}
                        style={{ display: "inline", marginRight: 4 }}
                      />{" "}
                      {t("العودة لتسجيل الدخول")}
                    </button>
                  </>
                )}

                {resetMethod === "google" && (
                  <div>
                    {resetStep === 1 ? (
                      <>
                        <p
                          className={Style.subtitle}
                          style={{ marginBottom: 16 }}
                        >
                          {t("الخطوة 1: قم بتسجيل الدخول باستخدام Google للتحقق من هويتك")}
                        </p>
                        <div className={Style.googleWrapper}>
                          {googleClientId && (
                            <GoogleOAuthProvider clientId={googleClientId}>
                              <MyLoginPage onGoogleLogin={handleGoogleLogin} />
                            </GoogleOAuthProvider>
                          )}
                        </div>
                      </>
                    ) : (
                      <form
                        onSubmit={handleResetPassword}
                        className={Style.form}
                      >
                        <p className={Style.successText}>
                          {t("✓ تم التحقق من الهوية! أدخل كلمة المرور الجديدة.")}
                        </p>
                        <div className={Style.inputGroup}>
                          <label>{t("كلمة المرور الجديدة")}</label>
                          <div className={Style.relativeInput}>
                            <LockIcon className={Style.inputIcon} />
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder={t("6 أحرف على الأقل")}
                              required
                            />
                          </div>
                        </div>
                        <div className={Style.inputGroup}>
                          <label>{t("تأكيد كلمة المرور")}</label>
                          <div className={Style.relativeInput}>
                            <LockIcon className={Style.inputIcon} />
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              placeholder={t("تأكيد كلمة المرور الجديدة")}
                              required
                            />
                          </div>
                        </div>
                        <button
                          className={Style.authbtn}
                          type="submit"
                          disabled={isResetting}
                        >
                          {isResetting ? (
                            <LoaderIcon className="loader" />
                          ) : (
                            t("تحديث كلمة المرور")
                          )}
                        </button>
                      </form>
                    )}
                    <button
                      onClick={() => {
                        setResetMethod(null);
                        setResetStep(1);
                      }}
                      className={Style.backBtn}
                    >
                      <ArrowLeftIcon
                        size={16}
                        style={{ display: "inline", marginRight: 4 }}
                      />{" "}
                      {t("تغيير الطريقة")}
                    </button>
                  </div>
                )}

                {resetMethod === "email" && (
                  <div>
                    {resetStep === 1 ? (
                      <form onSubmit={handleRequestOtp} className={Style.form}>
                        <p
                          className={Style.subtitle}
                          style={{ marginBottom: 16 }}
                        >
                          {t("أدخل بريدك الإلكتروني لتلقي رمز تحقق مكون من 6 أرقام.")}
                        </p>
                        <div className={Style.inputGroup}>
                          <div className={Style.relativeInput}>
                            <MailIcon className={Style.inputIcon} />
                            <input
                              type="email"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              placeholder={t("بريدك@الإلكتروني.com")}
                              required
                            />
                          </div>
                        </div>
                        <button
                          className={Style.authbtn}
                          type="submit"
                          disabled={isSendingCode}
                        >
                          {isSendingCode ? (
                            <LoaderIcon className="loader" />
                          ) : (
                            t("إرسال رمز التحقق")
                          )}
                        </button>
                      </form>
                    ) : (
                      <form
                        onSubmit={handleResetPassword}
                        className={Style.form}
                      >
                        <p
                          className={Style.subtitle}
                          style={{ marginBottom: 16 }}
                        >
                          {t("لقد أرسلنا رمزًا إلى")} {resetEmail}
                        </p>
                        <div className={Style.inputGroup}>
                          <label>{t("رمز التحقق")}</label>
                          <input
                            type="text"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder="000000"
                            required
                            maxLength={6}
                            className={Style.otpInput}
                          />
                        </div>
                        <div className={Style.inputGroup}>
                          <label>{t("كلمة المرور الجديدة")}</label>
                          <div className={Style.relativeInput}>
                            <LockIcon className={Style.inputIcon} />
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder={t("6 أحرف على الأقل")}
                              required
                            />
                          </div>
                        </div>
                        <div className={Style.inputGroup}>
                          <label>{t("تأكيد كلمة المرور")}</label>
                          <div className={Style.relativeInput}>
                            <LockIcon className={Style.inputIcon} />
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              placeholder={t("تأكيد كلمة المرور الجديدة")}
                              required
                            />
                          </div>
                        </div>
                        <button
                          className={Style.authbtn}
                          type="submit"
                          disabled={isResetting}
                        >
                          {isResetting ? (
                            <LoaderIcon className="loader" />
                          ) : (
                            t("تحديث كلمة المرور")
                          )}
                        </button>
                      </form>
                    )}
                    <button
                      onClick={() => {
                        setResetMethod(null);
                        setResetStep(1);
                      }}
                      className={Style.backBtn}
                    >
                      <ArrowLeftIcon
                        size={16}
                        style={{ display: "inline", marginRight: 4 }}
                      />{" "}
                      {t("تغيير الطريقة")}
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      <div className={Style.loginRight}>
        <motion.img
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          src={image}
          alt="Login Illustration"
        />
      </div>
    </div>
  );
};

export default LoginPage;
