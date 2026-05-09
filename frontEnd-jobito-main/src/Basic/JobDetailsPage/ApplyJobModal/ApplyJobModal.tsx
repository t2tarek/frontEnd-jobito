import React, {
  useState,
  Component,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { useTranslation } from "../../../context/translation-context";
import { useJobitoAuth } from "../../../context/LinkContxt";
import { useToast } from "../../../context/ToastContext";
import styles from "./ApplyJobModal.module.css";

class ErrorBoundary extends Component<
  { children: ReactNode; onClose?: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; onClose?: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          className={styles.errorBoundaryOverlay}
        >
          <div
            className={styles.errorBoundaryContent}
          >
            <h2 className={styles.errorTitle}>
              {this.context && typeof this.context === 'object' && 't' in this.context ? (this.context as any).t("حدث خطأ غير متوقع") : "Unexpected Error"}
            </h2>
            <p className={styles.errorDescription}>
              {this.context && typeof this.context === 'object' && 't' in this.context ? (this.context as any).t("عذراً، حدث خطأ أثناء تحميل نموذج التقديم.") : "Sorry, an error occurred while loading the application form."}
            </p>
            <button
              onClick={() => this.props.onClose?.()}
              className={styles.errorCloseButton}
            >
              {this.context && typeof this.context === 'object' && 't' in this.context ? (this.context as any).t("إغلاق") : "Close"}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5200";

// Allowed file types and max size
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface ApplyJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId?: number | string;
  jobTitle?: string;
  companyName?: string;
  location?: string;
  jobType?: string;
  isActive?: boolean;
  logoUrl?: string;
  isTradesman?: boolean;
}

interface ApplicationStatus {
  applicationId: number;
  status: string;
  appliedAt: string;
}

export const ApplyJobModal: React.FC<ApplyJobModalProps> = ({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  companyName,
  location,
  jobType,
  isActive = true,
  logoUrl,
  isTradesman = false,
}) => {
  const { t } = useTranslation();
  const { apiFetch, user } = useJobitoAuth();
  const { showToast } = useToast();

  const displayJobTitle = jobTitle || t("وظيفة");
  const displayCompanyName = companyName || t("شركة");
  const displayLocation = location || t("الموقع");
  const displayJobType = jobType || t("دوام كامل");
  
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [address, setAddress] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [existingApplication, setExistingApplication] =
    useState<ApplicationStatus | null>(null);

  const fetchExistingStatus = async () => {
    if (!jobId || !isOpen) return;
    try {
      const res = await apiFetch(
        `${API_BASE_URL}/api/applications/status/${jobId}`,
      );
      if (res.ok) {
        const text = await res.text();
        if (text && text !== "null") {
          try {
            const data = JSON.parse(text);
            setExistingApplication(data);
          } catch (e) {
            console.error("Failed to parse status JSON in effect:", e);
          }
        }
      }
    } catch (err) {
      console.error("Error checking application status:", err);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      fetchExistingStatus();
    } else {
      setExistingApplication(null);
      setFormError(null);
    }
  }, [isOpen, jobId]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return t("يرجى رفع ملف بصيغة PDF أو Word فقط.");
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `${t("حجم الملف يجب أن لا يتجاوز")} ${MAX_FILE_SIZE_MB} ${t("ميجابايت")}.`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFileError(null);

    if (file) {
      const error = validateFile(file);
      if (error) {
        setFileError(error);
        setResumeFile(null);
        e.target.value = "";
        return;
      }
    }
    setResumeFile(file);
  };

  const handleSubmit = async () => {
    if (!jobId) return;

    // Validation for Tradesman
    if (isTradesman && !address.trim()) {
      setFormError(t("يرجى إدخال العنوان"));
      return;
    }

    setFormError(null);

    try {
      setIsSubmitting(true);

      let finalResumeUrl = "";
      // Only upload if we have a valid File object
      if (resumeFile && resumeFile instanceof File) {
        console.log("📤 [ApplyJobModal] Uploading file:", resumeFile.name);
        const formData = new FormData();
        formData.append("file", resumeFile);
        formData.append("entity_type", "user");
        if (user?.id) {
          formData.append("entity_id", user.id);
        }
        const uploadRes = await apiFetch(`${API_BASE_URL}/api/images/upload`, {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalResumeUrl = uploadData.imageUrl || uploadData.url;
        } else {
          setFormError(t("حدث خطأ أثناء رفع الملف. يرجى المحاولة مرة أخرى."));
          setIsSubmitting(false);
          return;
        }
      }

      let finalCoverLetter = additionalInfo.trim();
      if (portfolioUrl.trim()) {
        finalCoverLetter = `Portfolio: ${portfolioUrl.trim()}\n\n${finalCoverLetter}`;
      }
      if (isTradesman && address.trim()) {
        finalCoverLetter = `Address: ${address.trim()}\n\n${finalCoverLetter}`;
      }

      const res = await apiFetch(`${API_BASE_URL}/api/applications/job/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeUrl: finalResumeUrl,
          coverLetter: finalCoverLetter,
        }),
      });

      if (res.ok) {
        showToast(t("تم تقديم طلبك بنجاح! 🎉"), "success");
        // Reset form
        setPortfolioUrl("");
        setAdditionalInfo("");
        setAddress("");
        setResumeFile(null);
        setFormError(null);
        onClose();
      } else {
        let err;
        try {
          err = await res.json();
        } catch(e) {
          err = { message: `فشل التقديم. خطأ في الخادم (${res.status}).` };
        }
        
        if (err.message === "لقد تقدمت بالفعل لهذه الوظيفة" || err.message === "You have already applied for this job.") {
          await fetchExistingStatus();
        } else {
          setFormError(err.message || "فشل التقديم. يرجى المحاولة مرة أخرى.");
        }
      }
    } catch (error: any) {
      console.error("Error submitting application:", error);
      setFormError(
        error?.message || t("حدث خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ErrorBoundary onClose={onClose}>
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          {!isActive && (
            <div className={styles.closedOverlay}>
              <div className={styles.closedMessage}>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ff4d4f"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <h2>{t("عذراً، تم إقفال هذه الوظيفة")}</h2>
                <p>{t("لم يعد بإمكانك التقديم على هذا المنصب حالياً")}</p>
                <button
                  className={(styles as any).submitButton}
                  onClick={onClose}
                >
                  {t("إغلاق")}
                </button>
              </div>
            </div>
          )}

          {existingApplication && (
            <div className={styles.closedOverlay}>
              <div className={styles.closedMessage}>
                <div style={{ color: "#56CDAD", marginBottom: "20px" }}>
                  <svg
                    width="60"
                    height="60"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h2>{t("تم التقديم مسبقاً")}</h2>
                <p>{t("لقد قمت بالتقديم على هذه الوظيفة بالفعل.")}</p>
                <div className={styles.statusBox}>
                  <span className={styles.statusLabel}>
                    {t("حالة الطلب الحالية:")}
                  </span>
                  <div className={styles.statusValue}>
                    {existingApplication.status === "applied" ||
                    existingApplication.status === "reviewing"
                      ? t("تحت المراجعة")
                      : existingApplication.status === "shortlisted" ||
                          existingApplication.status === "interviewed" ||
                          existingApplication.status === "hired"
                        ? t("مقبول") + " ✅"
                        : existingApplication.status === "declined"
                          ? t("مرفوض") + " ❌"
                          : t("تحت المراجعة")}
                  </div>
                </div>
                <button
                  className={(styles as any).submitButton}
                  onClick={onClose}
                >
                  {t("حسناً")}
                </button>
              </div>
            </div>
          )}

          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t("إغلاق")}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div className={styles.modalHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.companyLogo}>
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={displayCompanyName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                ) : (
                  <svg
                    width="60"
                    height="60"
                    viewBox="0 0 60 60"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M30 5.5L52 18.2V43.6L30 56.3L8 43.6V18.2L30 5.5Z"
                      fill="#56CDAD"
                    />
                    <path
                      d="M8 18.2L30 30.9L52 18.2"
                      stroke="white"
                      strokeWidth="0"
                    />
                    <path d="M30 30.9L30 56.3" stroke="white" strokeWidth="0" />
                    <path d="M30 5.5V56.3" fill="white" fillOpacity="0.2" />
                    <path
                      d="M8 18.2L30 30.9L52 18.2L30 5.5L8 18.2Z"
                      fill="#78DDC2"
                    />
                    <path
                      d="M8 18.2V43.6L30 56.3V30.9L8 18.2Z"
                      fill="#46B496"
                    />
                    <path
                      d="M30 30.9V56.3L52 43.6V18.2L30 30.9Z"
                      fill="#56CDAD"
                    />
                    <path
                      d="M22 23.5V41.5L28 36.5V28.5L38 41.5V23.5L32 28.5V36.5L22 23.5Z"
                      fill="white"
                    />
                  </svg>
                )}
              </div>
              <div className={styles.headerTitles}>
                <h2>{t(displayJobTitle)}</h2>
                <p>
                  {t(displayCompanyName)} <span className={styles.dot}>•</span> {t(displayLocation)}{" "}
                  <span className={styles.dot}>•</span> {t(displayJobType)}
                </p>
              </div>
            </div>
          </div>

          <hr className={styles.divider} />

          <div className={styles.modalBody}>
            <div className={styles.sectionHeader}>
              <h3>{t("أرسل طلبك")}</h3>
              <p className={styles.subtitle}>
                {t("المعلومات التالية مطلوبة وسيتم مشاركتها فقط مع")} {t(displayCompanyName)}
              </p>
            </div>

            <hr className={styles.divider} />

            {formError && (
              <div className={styles.formErrorBox}>
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{t(formError)}</span>
              </div>
            )}

            <form className={styles.applyForm}>
              {isTradesman ? (
                /* --- TRADESMAN SPECIAL FORM --- */
                <>
                  <div className={styles.formGroup}>
                    <label>{t("العنوان")}</label>
                    <input
                      type="text"
                      placeholder={t("أدخل عنوانك...")}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>{t("وصف المشكلة")}</label>
                    <textarea
                      className={styles.roundedTextarea}
                      placeholder={t("صف المشكلة التي تواجهها باختصار...")}
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                /* --- CORPORATE FORM --- */
                <>
                  <div className={styles.formGroup}>
                    <label>{t("رابط الملف الشخصي (Portfolio)")}</label>
                    <input
                      type="text"
                      placeholder={t("أدخل رابط ملفك الشخصي...")}
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                    />
                  </div>

                  <hr className={styles.divider} />

                  <div className={styles.formGroup}>
                    <label>{t("معلومات إضافية")}</label>
                    <div className={styles.textareaWrapper}>
                      <textarea
                        placeholder={t("أضف خطاب تقديم أو أي معلومات إضافية تريد مشاركتها...")}
                        value={additionalInfo}
                        onChange={(e) => setAdditionalInfo(e.target.value)}
                        maxLength={500}
                      />
                      <div className={styles.formattingToolbar}>
                        <div className={styles.toolbarIcons}>
                          <button type="button" className={styles.iconBtn}>
                            <i className="fa-regular fa-face-smile"></i>
                          </button>
                          <button type="button" className={styles.iconBtn}>
                            <span style={{ fontWeight: 800 }}>B</span>
                          </button>
                          <button type="button" className={styles.iconBtn}>
                            <span
                              style={{
                                fontStyle: "italic",
                                fontFamily: "serif",
                                fontWeight: 600,
                              }}
                            >
                              I
                            </span>
                          </button>
                          <button type="button" className={styles.iconBtn}>
                            <i className="fa-solid fa-list-ol"></i>
                          </button>
                          <button type="button" className={styles.iconBtn}>
                            <i className="fa-solid fa-list-ul"></i>
                          </button>
                          <button type="button" className={styles.iconBtn}>
                            <i className="fa-solid fa-link"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className={styles.textareaFooter}>
                      <span>{t("الحد الأقصى 500 حرف")}</span>
                      <span>{additionalInfo.length} / 500</span>
                    </div>
                  </div>

                  <div className={styles.formGroupResume}>
                    <div className={styles.resumeTop}>
                      <span className={styles.resumeLabel}>
                        {t("إرفاق السيرة الذاتية")}{" "}
                        <span className={styles.optionalText}>
                          ({t("اختياري")})
                        </span>
                      </span>
                      <div className={styles.uploadBox}>
                        <input
                          type="file"
                          id="resumeUpload"
                          accept=".pdf,.doc,.docx"
                          style={{ display: "none" }}
                          onChange={handleFileChange}
                        />
                        <label htmlFor="resumeUpload" className={styles.uploadButton}>
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ marginLeft: "8px" }}
                          >
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                          </svg>
                          {resumeFile ? resumeFile.name : t("اختيار ملف")}
                        </label>
                      </div>
                    </div>
                    <div className={styles.resumeHelpBox}>
                      <i className="fa-solid fa-circle-info" style={{ color: "var(--color-primary)", fontSize: "14px", flexShrink: 0, marginTop: "2px" }}></i>
                      <div className={styles.uploadHelpText}>
                        <p style={{ margin: "0 0 4px 0", color: "var(--color-text)", fontWeight: 600 }}>
                          {t("PDF أو Word — الحد الأقصى")} {MAX_FILE_SIZE_MB} {t("ميجابايت")}.
                        </p>
                        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
                          {t("إرفاق سيرتك الذاتية اختياري، لكنه يزيد من فرص قبولك للاستفسار.")}
                        </p>
                      </div>
                    </div>
                    {fileError && (
                        <p className={styles.fileValidationError}>
                          ⚠️ {fileError}
                        </p>
                    )}
                  </div>
                </>
              )}

              <hr className={styles.divider} />

              <div className={styles.submitSection}>
                {user?.deletionRequestedAt && (
                   <p style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "8px", textAlign: "center", fontWeight: 600 }}>
                     {t("لا يمكنك التقديم على وظائف لأن حسابك مجدول للحذف.")}
                   </p>
                )}
                <button
                  type="button"
                  className={isTradesman ? styles.pillSubmitButton : (styles as any).submitButton}
                  onClick={handleSubmit}
                  disabled={isSubmitting || !!user?.deletionRequestedAt}
                >
                  {isSubmitting ? t("جاري التقديم...") : (isTradesman ? t("تقديم الطلب") : t("إرسال الطلب"))}
                </button>
                <p className={styles.termsText}>
                  {t("بإرسال الطلب فإنك توافق على")} <a href="#">{t("شروط الخدمة")}</a> {t("و")}{" "}
                  <a href="#">{t("سياسة الخصوصية")}</a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};
