import { useState, useEffect } from "react";
import {
  LoaderIcon,
  Building2Icon,
  EyeIcon,
  EyeOffIcon,
  CheckCircleIcon,
  SmartphoneIcon,
  LinkIcon,
  ShieldCheckIcon,
  ArrowRightIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./CompanyRegister.module.css";
// Use the matching business characters illustration
import signupImage from "../../../../assets/signup.png";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../../context/translation-context";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5200";

interface CompanyRegisterProps {
  setShowLogin: (show: boolean) => void;
}

export const CompanyRegister: React.FC<CompanyRegisterProps> = ({ setShowLogin }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    companyName: "",
    taxNumber: "",
    companyPhone: "",
    companyAddress: "",
    companyEmail: "",
    commercialRegister: "",
    password: "",
    confirmPassword: "",
    nationalId: "",
  });

  const [isCreating, setIsCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Verification states
  const [verifyMethod, setVerifyMethod] = useState<null | "code" | "link">(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedStatus, setVerifiedStatus] = useState<null | "success">(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (formData.password !== formData.confirmPassword) {
      setFormError(t("Passwords do not match"));
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.companyName,
          email: formData.companyEmail,
          password: formData.password,
          role: "company",
          phone: formData.companyPhone,
          address: formData.companyAddress,
          tax_number: formData.taxNumber,
          commercial_register: formData.commercialRegister,
          license_number: formData.commercialRegister,
          national_id: formData.nationalId,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || t("Registration failed"));
      setSuccess(true);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      setIsVerifying(true);
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.companyEmail,
          code: verificationCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t("Failed to activate"));
      setVerifiedStatus("success");
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className={styles.signupwrapper}>

      <motion.div
        className={styles.signupleft}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <AnimatePresence mode="wait">
          {verifiedStatus === "success" ? (
            <motion.div
                key="success-verified"
                className={styles.centeredContent}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}
            >
                <div style={{ color: '#10b981', marginBottom: '24px' }}>
                    <CheckCircleIcon size={80} />
                </div>
                <h2 className={styles.title}>{t("Email Verified!")}</h2>
                <p className={styles.subtitle}>{t("Your company account is now active. You can start posting jobs.")}</p>
                <button 
                  className={styles.submitBtn} 
                  onClick={() => setShowLogin(true)}
                >
                    {t("Go to Login")} <ArrowRightIcon size={20} />
                </button>
            </motion.div>
          ) : success ? (
            <motion.div
              key="verify-steps"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              style={{ textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}
            >
              {!verifyMethod ? (
                <>
                  <div style={{ color: '#4f46e5', marginBottom: '24px' }}>
                    <ShieldCheckIcon size={64} style={{ margin: '0 auto' }} />
                  </div>
                  <h2 className={styles.title}>{t("Verify Company Account")}</h2>
                  <p className={styles.subtitle}>
                    {t("We sent a code to")} <b>{formData.companyEmail}</b>. {t("Please check your inbox.")}
                  </p>

                  <div style={{ display: 'grid', gap: '16px', marginTop: '40px' }}>
                    <button
                      className={styles.submitBtn}
                      onClick={() => setVerifyMethod("code")}
                    >
                      <SmartphoneIcon size={20} />
                      {t("Enter Verification Code")}
                    </button>
                    <button
                      className={styles.submitBtn}
                      onClick={() => setVerifyMethod("link")}
                      style={{ background: 'white', color: '#4f46e5', border: '2px solid #4f46e5' }}
                    >
                      <LinkIcon size={20} />
                      {t("Use Email Link")}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ width: "100%" }}>
                  <h2 className={styles.title}>{t("Enter OTP Code")}</h2>
                  <p className={styles.subtitle}>
                    {t("Type the 6-digit code from your company email.")}
                  </p>
                  <form onSubmit={handleVerifyCode} style={{ marginTop: '40px' }}>
                    {formError && <div className={styles.errorBox}>{formError}</div>}
                    <input
                      type="text"
                      className={styles.inputField}
                      style={{
                        textAlign: 'center',
                        fontSize: '32px',
                        letterSpacing: '12px',
                        fontWeight: 'bold',
                        padding: '16px',
                        marginBottom: '24px'
                      }}
                      maxLength={6}
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                    />
                    <button
                      className={styles.submitBtn}
                      type="submit"
                      disabled={isVerifying}
                    >
                      {isVerifying ? <LoaderIcon className="animate-spin" /> : t("Verify & Activate")}
                    </button>
                  </form>
                  <button
                    onClick={() => setVerifyMethod(null)}
                    style={{ background: 'none', border: 'none', color: '#64748b', marginTop: '24px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    ← {t("Back to options")}
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="register-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className={styles.header}>
                  <div className={styles.titleContainer}>
                      <div className={styles.buildingIconBox}>
                          <Building2Icon size={32} />
                      </div>
                      <h1 className={styles.title}>{t("Company registration")}</h1>
                  </div>
                  <p className={styles.subtitle}>{t("Create a business account to hire top talent on Jobito")}</p>
              </div>

              <form className={styles.form} onSubmit={handleSubmit}>
                {formError && <div className={styles.errorBox}>{formError}</div>}

                {/* Row 1: Name, Tax, Phone */}
                <div className={styles.formGrid3}>
                  <div className={styles.inputGroup}>
                    <label>{t("Company Name")}</label>
                    <input
                      className={styles.inputField}
                      type="text"
                      placeholder={t("Example: Akem")}
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>{t("Tax number")}</label>
                    <input
                      className={styles.inputField}
                      type="text"
                      placeholder="123456789"
                      value={formData.taxNumber}
                      onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>{t("Company phone")}</label>
                    <input
                      className={styles.inputField}
                      type="tel"
                      placeholder="+20 (123) 456-"
                      value={formData.companyPhone}
                      onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Row 2: Address, Email, Register */}
                <div className={styles.formGrid3}>
                  <div className={styles.inputGroup}>
                    <label>{t("Company address")}</label>
                    <input
                      className={styles.inputField}
                      type="text"
                      placeholder={t("City, state")}
                      value={formData.companyAddress}
                      onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>{t("Company email")}</label>
                    <input
                      className={styles.inputField}
                      type="email"
                      placeholder="hr@acme-inc.c"
                      value={formData.companyEmail}
                      onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>{t("commercial register")}</label>
                    <input
                      className={styles.inputField}
                      type="text"
                      placeholder="LN-8899221"
                      value={formData.commercialRegister}
                      onChange={(e) => setFormData({ ...formData, commercialRegister: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Row 3: Passwords */}
                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>{t("password")}</label>
                    <div className={styles.passwordWrapper}>
                      <input
                        className={styles.inputField}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                      <button type="button" className={styles.eyeButton} onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>{t("Confirm password")}</label>
                    <div className={styles.passwordWrapper}>
                      <input
                        className={styles.inputField}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                      />
                      <button type="button" className={styles.eyeButton} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 4: National ID */}
                <div className={styles.inputGroup}>
                  <label>{t("The national number of the official")}</label>
                  <input
                    className={styles.inputField}
                    type="text"
                    placeholder="Example: 29901011234567"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    required
                  />
                </div>

                <button
                  className={styles.submitBtn}
                  type="submit"
                  disabled={isCreating}
                >
                  {isCreating ? <LoaderIcon className="animate-spin" /> : t("Create a business account file")}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Right Side Illustration */}
      <div className={styles.signuplight}>
        <motion.img
          layoutId="heroImage"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          src={signupImage}
          alt="Business Illustration"
        />
      </div>
    </div>
  );
};
