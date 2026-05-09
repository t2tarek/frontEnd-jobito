import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./ProfileSettings.module.css";
import { useJobitoAuth } from "../../context/LinkContxt";
import { GoogleLogin } from "@react-oauth/google";
import { useTranslation } from "../../context/translation-context";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5200";

const UploadIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const tabVariants = {
  hidden: { opacity: 0, x: 24 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.32,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    x: -24,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1] as [number, number, number, number],
    },
  },
};

const getFullImageUrl = (url?: string) => {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("blob:")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

type ProfileSubTab = "overview" | "social" | "security";

export default function ProfileSettings() {
  const { t } = useTranslation();
  const { user, role, googleClientId, apiFetch, login } = useJobitoAuth();
  const [activeSubTab, setActiveSubTab] = useState<ProfileSubTab>("overview");
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: "",
    fullName: "",
    website: "",
    industry: "",
    description: "",
    address: "",
    employees: "",
    foundedDate: "",
    phone: "",
    email: "",
    location: "",
    bio: "",
    locationTags: [] as string[],
    techStack: [] as string[],
    socialLinks: {
      instagram: "",
      twitter: "",
      facebook: "",
      linkedin: "",
      youtube: "",
    },
    logo: "",
    avatar: "",
    classification: "",
    benefits: [] as { title: string; description: string }[],
  });

  const [newBenefit, setNewBenefit] = useState({ title: "", description: "" });
  const [showAddBenefit, setShowAddBenefit] = useState(false);

  const [email, setEmail] = useState("");
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingPass, setIsSavingPass] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [savedLogoUrl, setSavedLogoUrl] = useState<string>(""); // track DB logo to avoid clearing
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const endpoint =
          role === "company" ? "/api/companies/my/profile" : "/api/users/me";
        const res = await apiFetch(`${API_BASE_URL}${endpoint}`);
        if (res.ok) {
          const raw = await res.json();

          // Normalize PascalCase (.NET) → camelCase, handle field name differences
          const d = {
            id:             raw.Id             ?? raw.id,
            name:           raw.Name           ?? raw.name           ?? raw.FullName ?? raw.fullName ?? "",
            fullName:       raw.FullName       ?? raw.fullName       ?? raw.Name     ?? raw.name     ?? "",
            website:        raw.Website        ?? raw.website        ?? "",
            industry:       raw.Industry       ?? raw.industry       ?? "",
            description:    raw.Description    ?? raw.description    ?? "",
            address:        raw.Address        ?? raw.address        ?? "",
            employees:      raw.Employees      ?? raw.employees      ?? "",
            phone:          raw.Phone          ?? raw.phone          ?? "",
            email:          raw.ContactEmail   ?? raw.contactEmail   ?? raw.Email ?? raw.email ?? "",
            location:       raw.Location       ?? raw.location       ?? "",
            bio:            raw.Bio            ?? raw.bio            ?? "",
            classification: raw.Classification ?? raw.classification ?? "تقني",
            logoUrl:        raw.LogoUrl        ?? raw.logoUrl        ?? raw.AvatarUrl ?? raw.avatarUrl ?? "",
            avatarUrl:      raw.AvatarUrl      ?? raw.avatarUrl      ?? raw.LogoUrl  ?? raw.logoUrl  ?? "",
            // Founded date: backend uses EstablishedYear, FoundedDay, FoundedMonth
            foundedYear:    raw.EstablishedYear ?? raw.establishedYear ?? raw.FoundedYear ?? raw.foundedYear,
            foundedMonth:   raw.FoundedMonth    ?? raw.foundedMonth,
            foundedDay:     raw.FoundedDay      ?? raw.foundedDay,
            // JSON fields stored as strings in DB
            socialLinksRaw: raw.SocialLinks ?? raw.socialLinks,
            benefitsRaw:    raw.Benefits   ?? raw.benefits,
            techStack:      raw.TechStack  ?? raw.techStack,
            locationTags:   raw.LocationTags ?? raw.locationTags,
          };

          // Parse JSON string fields
          let socialLinks = d.socialLinksRaw;
          if (typeof socialLinks === "string") {
            try { socialLinks = JSON.parse(socialLinks); } catch { socialLinks = {}; }
          }
          let benefits = d.benefitsRaw;
          if (typeof benefits === "string") {
            try { benefits = JSON.parse(benefits); } catch { benefits = []; }
          }

          const logoUrl = d.logoUrl;
          setSavedLogoUrl(logoUrl);  // save for handleSave
          if (logoUrl) setPreview(logoUrl);
          setEmail(d.email);

          setFormData({
            name:        d.name,
            fullName:    d.fullName,
            website:     d.website,
            industry:    d.industry,
            description: d.description,
            address:     d.address,
            employees:   d.employees,
            phone:       d.phone,
            email:       d.email,
            location:    d.location,
            bio:         d.bio,
            classification: d.classification,
            logo:   logoUrl,
            avatar: logoUrl,
            socialLinks: socialLinks ?? { instagram: "", twitter: "", facebook: "", linkedin: "", youtube: "" },
            locationTags: Array.isArray(d.locationTags) ? d.locationTags : [],
            techStack:    Array.isArray(d.techStack)    ? d.techStack    : [],
            benefits:     Array.isArray(benefits)       ? benefits       : [],
            foundedDate:
              d.foundedYear && d.foundedMonth && d.foundedDay
                ? `${d.foundedYear}-${String(d.foundedMonth).padStart(2, "0")}-${String(d.foundedDay).padStart(2, "0")}`
                : "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile data:", err);
      }
    };
    fetchProfileData();
  }, [role, apiFetch]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [name]: value,
      },
    }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // FIX: use savedLogoUrl as fallback to avoid sending empty string that clears the logo
      let finalImgUrl = savedLogoUrl || formData.logo || formData.avatar || "";
      if (selectedFile) {
        const fd = new FormData();
        fd.append("file", selectedFile);
        const uploadRes = await apiFetch(`${API_BASE_URL}/api/images/upload`, {
          method: "POST",
          body: fd,
        });
        if (uploadRes.ok) {
          const imgData = await uploadRes.json().catch(() => ({}));
          finalImgUrl = imgData.imageUrl || imgData.image_url || finalImgUrl;
          setSavedLogoUrl(finalImgUrl); // update cache
          console.log("📸 Image uploaded successfully:", finalImgUrl);
        } else {
          let errorMsg = t("فشل في رفع الصورة.");
          try {
            const errData = await uploadRes.json();
            errorMsg = errData.message || errorMsg;
          } catch (e) {
            errorMsg = uploadRes.statusText || errorMsg;
          }
          throw new Error(errorMsg);
        }
      }

      const endpoint =
        role === "company" ? "/api/companies/my/profile" : "/api/users/me";
      let bodyData: any;

      if (role === "company") {
        bodyData = {
          ...formData,
          logoUrl: finalImgUrl,
          socialLinks: typeof formData.socialLinks === 'object' ? JSON.stringify(formData.socialLinks) : formData.socialLinks,
          benefits: typeof formData.benefits === 'object' ? JSON.stringify(formData.benefits) : formData.benefits,
          techStack: typeof formData.techStack === 'object' ? JSON.stringify(formData.techStack) : formData.techStack,
          classification: formData.classification,
        };
        delete bodyData.locationTags;
        if (formData.foundedDate) {
          const [y, m, d] = formData.foundedDate.split("-");
          bodyData.EstablishedYear = y;
          bodyData.FoundedMonth = m;
          bodyData.FoundedDay = d;
        }
        // Ensure name is sent as Name (matching DTO if needed, though case-insensitive is on)
        bodyData.Name = formData.name || formData.fullName;
      } else {
        bodyData = {
          ...formData,
          avatarUrl: finalImgUrl,
          fullName: formData.fullName || formData.name,
          classification: formData.classification,
          location: formData.location || formData.bio || formData.address,
        };
      }

      console.log(`📤 [handleSave] Sending to ${endpoint}:`, bodyData);

      const res = await apiFetch(`${API_BASE_URL}${endpoint}`, {
        method: role === "company" ? "PATCH" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      if (res.ok) {
        // If 204 No Content, don't try to parse JSON
        if (res.status !== 204) {
          const resData = await res.json().catch(() => ({}));
          if (resData.access_token) {
            login(resData.access_token);
          }
        }
        window.dispatchEvent(new Event("jobito-profile-updated"));
        alert(t("تم حفظ التعديلات بنجاح!"));
      } else {
        const errorText = await res.text().catch(() => "");
        let errorMsg = t("فشل في تحديث الملف الشخصي.");
        try {
          const errData = JSON.parse(errorText);
          errorMsg = errData.message || errorMsg;
        } catch (e) {
          errorMsg = `${errorMsg} (Status: ${res.status})`;
        }
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      alert(err.message || t("فشل في تحديث الملف الشخصي."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingEmail(true);
      const res = await apiFetch(`${API_BASE_URL}/api/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(t("فشل في تحديث البريد الإلكتروني."));
      alert(t("تم تحديث البريد الإلكتروني بنجاح!"));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert(t("كلمات المرور غير متطابقة!"));
      return;
    }
    try {
      setIsSavingPass(true);
      const res = await apiFetch(`${API_BASE_URL}/api/users/me/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword: passwords.current,
          newPassword: passwords.new,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || t("فشل في تحديث كلمة المرور."));
      }
      alert(t("تم تحديث كلمة المرور بنجاح!"));
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingPass(false);
    }
  };

  const handleGoogleLinkSuccess = async (response: any) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/auth/link-google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ googleToken: response.credential }),
      });
      if (res.ok) {
        alert(t("تم ربط حساب جوجل بنجاح!"));
        window.location.reload();
      } else {
        const error = await res.json();
        throw new Error(error.message || "Failed to link Google account");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const subTabs = [
    { id: "overview" as ProfileSubTab, label: t("نظرة عامة") },
    ...(role === "company"
      ? [{ id: "social" as ProfileSubTab, label: t("روابط التواصل") }]
      : []),
    { id: "security" as ProfileSubTab, label: t("أمان الحساب") },
  ];

  return (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h2>
          {role === "company" ? t("إعدادات الشركة") : t("إعدادات الملف الشخصي")}
        </h2>
      </div>

      <div className={styles.subTabBar}>
        {subTabs.map((ts) => (
          <button
            key={ts.id}
            className={`${styles.subTabBtn} ${activeSubTab === ts.id ? styles.subTabActive : ""}`}
            onClick={() => setActiveSubTab(ts.id)}
          >
            {ts.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          variants={tabVariants}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          {activeSubTab === "overview" && (
            <>
              <div className={styles.row}>
                <div className={styles.rowLabel}>
                  <strong>{t("الصورة الشخصية")}</strong>
                  <span>
                    {role === "company" ? t("شعار الشركة") : t("صورتك الشخصية")}
                  </span>
                </div>
                <div className={styles.rowContent}>
                  <div className={styles.logoUploadRow}>
                    <div className={styles.logoCirclePreview}>
                      {preview ? (
                        <img
                          src={getFullImageUrl(preview) || ""}
                          alt="avatar"
                        />
                      ) : (
                        <div className={styles.logoPlaceholder}>LOGO</div>
                      )}
                    </div>
                    <div
                      className={styles.logoUploadZone}
                      onClick={() => fileRef.current?.click()}
                    >
                      <UploadIcon />
                      <p>
                        <span className={styles.blueText}>{t("انقر للاستبدال")}</span>{" "}
                        {t("أو سحب وإفلات")}
                      </p>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleFile}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.rowLabel}>
                  <strong>{t("المعلومات الأساسية")}</strong>
                </div>
                <div className={styles.rowContent}>
                  <div className={styles.fieldFull}>
                    <label>
                      {role === "company" ? t("اسم الشركة") : t("الاسم الكامل")}
                    </label>
                    <input
                      name={role === "company" ? "name" : "fullName"}
                      type="text"
                      value={
                        role === "company" ? formData.name : formData.fullName
                      }
                      onChange={handleChange}
                    />
                  </div>
                  {role === "user" && (
                    <>
                      <div className={styles.fieldGrid}>
                        <div className={styles.fieldFull}>
                          <label>{t("الاسم الكامل")}</label>
                          <input
                            name="fullName"
                            type="text"
                            value={formData.fullName}
                            onChange={handleChange}
                          />
                        </div>
                        <div className={styles.fieldFull}>
                          <label>{t("التصنيف المهني")}</label>
                          <select
                            name="classification"
                            value={formData.classification}
                            onChange={handleChange}
                          >
                            <option value="تقني">{t("تقني")}</option>
                            <option value="غير تقني">{t("غير تقني")}</option>
                          </select>
                        </div>
                      </div>
                      <div className={styles.fieldFull}>
                        <label>{t("نبذة تعريفية")}</label>
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          rows={4}
                        />
                      </div>
                    </>
                  )}
                  {role === "company" && (
                    <>
                      <div className={styles.fieldGrid}>
                        <div>
                          <label>{t("الموظفين")}</label>
                          <input
                            name="employees"
                            type="text"
                            value={formData.employees}
                            onChange={handleChange}
                            placeholder={t("مثال: 50-100")}
                          />
                        </div>
                        <div>
                          <label>{t("مجال العمل")}</label>
                          <input
                            name="industry"
                            type="text"
                            value={formData.industry}
                            onChange={handleChange}
                            placeholder={t("مثال: البرمجيات")}
                          />
                        </div>
                      </div>
                      <div className={styles.fieldGrid}>
                        <div>
                          <label>{t("التصنيف")}</label>
                          <select
                            name="classification"
                            value={formData.classification}
                            onChange={handleChange}
                          >
                            <option value="تقني">{t("تقني")}</option>
                            <option value="غير تقني">{t("غير تقني")}</option>
                          </select>
                        </div>
                        <div>
                          <label>{t("الموقع (العنوان)")}</label>
                          <input
                            name="address"
                            type="text"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder={t("مثال: الرياض، السعودية")}
                          />
                        </div>
                      </div>
                      <div className={styles.fieldGrid}>
                        <div>
                          <label>{t("تاريخ التأسيس")}</label>
                          <input
                            name="foundedDate"
                            type="date"
                            value={formData.foundedDate}
                            onChange={handleChange}
                          />
                        </div>
                        <div />
                      </div>
                      <div className={styles.fieldFull}>
                        <label>{t("الوصف")}</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          rows={5}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {role === "company" && (
                <div className={styles.row}>
                  <div className={styles.rowLabel}>
                    <strong>{t("المزايا والفوائد")}</strong>
                    <span>{t("أضف المزايا التي توفرها شركتك للموظفين.")}</span>
                  </div>
                  <div className={styles.rowContent}>
                    <div className={styles.benefitsGrid}>
                      {formData.benefits?.map((benefit: any, index: number) => (
                        <div key={index} className={styles.benefitCard}>
                          <button
                            className={styles.removeBenefitBtn}
                            onClick={() => {
                              const updated = formData.benefits.filter(
                                (_: any, i: number) => i !== index,
                              );
                              setFormData({ ...formData, benefits: updated });
                            }}
                          >
                            ✕
                          </button>
                          <h3>{benefit.title}</h3>
                          <p>{benefit.description}</p>
                        </div>
                      ))}

                      {showAddBenefit ? (
                        <div className={styles.addBenefitCard}>
                          <input
                            type="text"
                            placeholder={t("عنوان الميزة (مثال: تأمين صحي)")}
                            value={newBenefit.title}
                            onChange={(e) =>
                              setNewBenefit({
                                ...newBenefit,
                                title: e.target.value,
                              })
                            }
                          />
                          <textarea
                            placeholder={t("وصف الميزة...")}
                            value={newBenefit.description}
                            onChange={(e) =>
                              setNewBenefit({
                                ...newBenefit,
                                description: e.target.value,
                              })
                            }
                            rows={3}
                          />
                          <div className={styles.benefitAddActions}>
                            <button
                              className={styles.addBtnSmall}
                              onClick={() => {
                                if (!newBenefit.title)
                                  return alert(t("يرجى إدخال عنوان الميزة"));
                                setFormData({
                                  ...formData,
                                  benefits: [
                                    ...(formData.benefits || []),
                                    newBenefit,
                                  ],
                                });
                                setNewBenefit({ title: "", description: "" });
                                setShowAddBenefit(false);
                              }}
                            >
                              {t("إضافة")}
                            </button>
                            <button
                              className={styles.cancelBtnSmall}
                              onClick={() => setShowAddBenefit(false)}
                            >
                              {t("إلغاء")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={styles.addBenefitTrigger}
                          onClick={() => setShowAddBenefit(true)}
                        >
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          <span>{t("إضافة ميزة جديدة")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {activeSubTab === "social" && (
            <div className={styles.row}>
              <div className={styles.rowLabel}>
                <strong>{t("روابط التواصل الاجتماعي")}</strong>
                <span>{t("أضف روابط حسابات الشركة على منصات التواصل.")}</span>
              </div>
              <div className={styles.rowContent}>
                <div className={styles.fieldFull}>
                  <label>LinkedIn</label>
                  <input
                    name="linkedin"
                    type="text"
                    value={formData.socialLinks?.linkedin || ""}
                    onChange={handleSocialChange}
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
                <div className={styles.fieldFull}>
                  <label>Twitter / X</label>
                  <input
                    name="twitter"
                    type="text"
                    value={formData.socialLinks?.twitter || ""}
                    onChange={handleSocialChange}
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div className={styles.fieldFull}>
                  <label>Facebook</label>
                  <input
                    name="facebook"
                    type="text"
                    value={formData.socialLinks?.facebook || ""}
                    onChange={handleSocialChange}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className={styles.fieldFull}>
                  <label>Instagram</label>
                  <input
                    name="instagram"
                    type="text"
                    value={formData.socialLinks?.instagram || ""}
                    onChange={handleSocialChange}
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div className={styles.fieldFull}>
                  <label>YouTube</label>
                  <input
                    name="youtube"
                    type="text"
                    value={formData.socialLinks?.youtube || ""}
                    onChange={handleSocialChange}
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </div>
            </div>
          )}


          {activeSubTab === "security" && (
            <>
              <div className={styles.row}>
                <div className={styles.rowLabel}>
                  <strong>{t("البريد الإلكتروني")}</strong>
                </div>
                <div className={styles.rowContent}>
                  <form
                    onSubmit={handleUpdateEmail}
                    className={styles.inlineForm}
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      className={styles.saveBtn}
                      disabled={isSavingEmail}
                    >
                      {t("تحديث")}
                    </button>
                  </form>
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.rowLabel}>
                  <strong>{t("تغيير كلمة المرور")}</strong>
                </div>
                <div className={styles.rowContent}>
                  <form
                    onSubmit={handleUpdatePassword}
                    className={styles.passwordForm}
                  >
                    <input
                      type="password"
                      placeholder={t("كلمة المرور الحالية")}
                      value={passwords.current}
                      onChange={(e) =>
                        setPasswords({ ...passwords, current: e.target.value })
                      }
                      required
                    />
                    <input
                      type="password"
                      placeholder={t("كلمة المرور الجديدة")}
                      value={passwords.new}
                      onChange={(e) =>
                        setPasswords({ ...passwords, new: e.target.value })
                      }
                      required
                    />
                    <input
                      type="password"
                      placeholder={t("تأكيد كلمة المرور")}
                      value={passwords.confirm}
                      onChange={(e) =>
                        setPasswords({ ...passwords, confirm: e.target.value })
                      }
                      required
                    />
                    <button
                      type="submit"
                      className={styles.saveBtn}
                      disabled={isSavingPass}
                    >
                      {t("تحديث كلمة المرور")}
                    </button>
                  </form>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.rowLabel}>
                  <strong>{t("ربط حساب جوجل")}</strong>
                  <span>{t("اربط حسابك لتتمكن من تسجيل الدخول بلمسة واحدة.")}</span>
                </div>
                <div className={styles.rowContent}>
                  {formData.googleId ? (
                    <div className={styles.linkedBadge}>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span>{t("حساب جوجل مرتبط بنجاح")}</span>
                    </div>
                  ) : (
                    <div className={styles.linkAction}>
                      <p className={styles.linkNote}>
                        {t("الحساب غير مرتبط حالياً.")}
                      </p>
                      <div className={styles.googleBtnWrapper}>
                        <GoogleLogin
                          onSuccess={handleGoogleLinkSuccess}
                          onError={() => alert(t("فشل الاتصال بجوجل"))}
                          useOneTap
                          theme="outline"
                          text="continue_with"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {activeSubTab !== "security" && (
        <div className={styles.saveRow}>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? t("جاري الحفظ...") : t("حفظ التغييرات")}
          </button>
        </div>
      )}
    </div>
  );
}
