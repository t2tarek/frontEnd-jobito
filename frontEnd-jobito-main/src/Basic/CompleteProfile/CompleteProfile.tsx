import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import styles from "./CompleteProfile.module.css";
import { useJobitoAuth } from "../../context/LinkContxt";
import { useTranslation } from "../../context/translation-context";
import { useToast } from "../../context/ToastContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5200";



const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "الشرقية", "السويس", "أسوان", "أسيوط", "بني سويف", "بورسعيد", "دمياط", "جنوب سيناء", "كفر الشيخ", "مطروح", "قنا", "شمال سيناء", "سوهاج", "الأقصر"
];

interface Experience {
  role: string;
  period: string;
}

interface Education {
  school: string;
  degree: string;
  period: string;
}

const UploadIcon = () => (
  <svg
    className={styles.uploadIcon}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

export default function CompleteProfile() {
  const { t, language, setLanguage } = useTranslation();
  const { user, apiFetch } = useJobitoAuth();
  const navigate = useNavigate();

  // Role state
  const [role, setRole] = useState<"job_seeker" | "tradesman">("job_seeker");

  // Profile photo
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wallpaper
  const [wallpaperPreview, setWallpaperPreview] = useState<string | null>(null);
  const [selectedWallpaper, setSelectedWallpaper] = useState<File | null>(null);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);

  // Personal Details
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    dob: user?.dob || "",
    gender: user?.gender || "",
    location: user?.location || "",
  });

  // Validation errors state
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

  // Toast System
  const { showToast } = useToast();

  // About me
  const [bio, setBio] = useState("");

  // Experience
  const [experiences, setExperiences] = useState<Experience[]>([]);

  // Education
  const [educations, setEducations] = useState<Education[]>([]);

  // Skills & Languages
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");



  // Social Links
  const [socialLinks, setSocialLinks] = useState({
    instagram: "",
    twitter: "",
    website: "",
  });

  // Work Images
  const [workImages, setWorkImages] = useState<string[]>([]);
  const [workImageFiles, setWorkImageFiles] = useState<File[]>([]);
  const workImageRef = useRef<HTMLInputElement>(null);

  // Saving
  const [isSaving, setIsSaving] = useState(false);

  // ─── Handlers ─────────────────────────────────
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedWallpaper(file);
      const reader = new FileReader();
      reader.onloadend = () => setWallpaperPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleWorkImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        setWorkImageFiles((prev) => [...prev, file]);
        const reader = new FileReader();
        reader.onloadend = () =>
          setWorkImages((prev) => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrs = { ...prev };
        delete newErrs[name];
        return newErrs;
      });
    }
  };

  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSocialLinks({ ...socialLinks, [e.target.name]: e.target.value });
  };

  const addExperience = () => {
    setExperiences([...experiences, { role: "", period: "" }]);
  };

  const addEducation = () => {
    setEducations([...educations, { school: "", degree: "", period: "" }]);
  };

  // ─── Save Profile ─────────────────────────────
  const validateForm = () => {
    const errors: Record<string, boolean> = {};
    let isValid = true;

    if (!formData.fullName.trim()) { errors.fullName = true; isValid = false; }
    if (!formData.phone.trim()) { errors.phone = true; isValid = false; }
    if (!formData.email.trim()) { errors.email = true; isValid = false; }
    if (!formData.dob.trim()) { errors.dob = true; isValid = false; }
    if (!formData.gender.trim()) { errors.gender = true; isValid = false; }
    if (!formData.location.trim()) { errors.location = true; isValid = false; }

    if (!bio.trim()) {
      errors.bio = true;
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showToast(t("يرجى إكمال جميع الحقول المطلوبة (المشار إليها بنجمة *) قبل الحفظ."), "error");
      return;
    }

    try {
      setIsSaving(true);

      // Upload avatar
      let avatarUrl = user?.avatar || "";
      if (selectedFile) {
        const fd = new FormData();
        fd.append("file", selectedFile);
        const uploadRes = await apiFetch(`${API_BASE_URL}/api/images/profile`, {
          method: "PUT",
          body: fd,
        });
        if (uploadRes.ok) {
          const imgData = await uploadRes.json();
          avatarUrl = imgData.imageUrl || imgData.image_url;
        }
      }

      // Upload banner
      let bannerUrl = "";
      if (selectedWallpaper) {
        const fd = new FormData();
        fd.append("file", selectedWallpaper);
        const uploadRes = await apiFetch(`${API_BASE_URL}/api/images/banner`, {
          method: "PUT",
          body: fd,
        });
        if (uploadRes.ok) {
          const imgData = await uploadRes.json();
          bannerUrl = imgData.imageUrl || imgData.image_url;
        }
      }

      // Build update payload
      const updateData: Record<string, unknown> = {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        dob: formData.dob,
        gender: formData.gender,
        location: formData.location,
        bio,
        socialLinks,
        experiences: experiences,
        educations: educations,
        skills,
        portfolios: workImages,
        avatarUrl: avatarUrl,
        avatar: avatarUrl,
        banner_url: bannerUrl,
        role: "user",
        classification: role,
      };

      const res = await apiFetch(`${API_BASE_URL}/api/users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const result = await res.json();
      if (result.access_token) {
        localStorage.setItem("token", result.access_token);
        window.dispatchEvent(new Event("auth-changed"));
      }

      navigate("/");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      showToast(`${t("فشل الحفظ:")} ${message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Animation Variants ───────────────────────
  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
    }),
  };

  return (
    <div className={styles.page}>
      {/* ─── Language Toggle ─────────────────────── */}
      <div className={styles.topActions}>
        <button
          className={styles.langBtn}
          onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
          title={language === "ar" ? "English" : "العربية"}
        >
          {language === "ar" ? "EN" : "AR"}
        </button>
      </div>

      {/* ─── Hero Header ─────────────────────────── */}
      <motion.div
        className={styles.heroHeader}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className={styles.heroTitle}>
          {t("يمكنك التسجيل")} <span className={styles.highlight}>{t("كصنايعي")}</span>
          <br />
          {t("أو")} <span className={styles.accentText}>{t("باحث عن عمل")}</span>{" "}
          {t("مع")} <span className={styles.brandText}>Jobito</span>
          <motion.svg
            className={styles.heroUnderline}
            viewBox="0 0 120 6"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }}
          >
            <motion.path
              d="M2 4 Q 30 0, 60 4 T 118 4"
              stroke="var(--color-accent)"
              fill="transparent"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }}
            />
          </motion.svg>
        </h1>
      </motion.div>

      {/* ─── Role Switcher ───────────────────────── */}
      <motion.div
        className={styles.roleSwitcher}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.button
          className={`${styles.roleBtn} ${role === "job_seeker" ? styles.roleBtnActive : ""}`}
          onClick={() => setRole("job_seeker")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {t("باحث عن عمل")}
        </motion.button>

        <span className={styles.roleDivider}>{t("أو")}</span>

        <motion.button
          className={`${styles.roleBtn} ${role === "tradesman" ? styles.roleBtnAccent : ""}`}
          onClick={() => setRole("tradesman")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {t("صنايعي")}
        </motion.button>
      </motion.div>

      <div className={styles.container}>
        {/* ═══════════════════════════════════════════
            ─── Section 1: Profile Photo ──────────────
            ═══════════════════════════════════════════ */}
        <motion.div
          className={styles.section}
          custom={0}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className={styles.sectionRow}>
            <div className={styles.sectionLabel}>
              <h3>{t("صورة الملف الشخصي")}</h3>
              <p>
                {t(
                  "تُعرض هذه الصورة للعامة وتساعد أصحاب العمل في التعرف عليك."
                )}
              </p>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.photoUploadRow}>
                <div className={styles.avatarPreview}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Avatar" />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      <i className="fas fa-user" />
                    </div>
                  )}
                </div>
                <div
                  className={styles.uploadZone}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon />
                  <p className={styles.uploadText}>
                    <span className={styles.uploadLink}>
                      {t("انقر للاستبدال")}
                    </span>{" "}
                    {t("أو سحب وإفلات")}
                  </p>
                  <p className={styles.uploadHint}>
                    SVG, PNG, JPG or GIF (max. 400 x 400px)
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════
            ─── Section 2: Wallpaper ──────────────────
            ═══════════════════════════════════════════ */}
        <motion.div
          className={styles.section}
          custom={1}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className={styles.sectionRow}>
            <div className={styles.sectionLabel}>
              <h3>{t("صورة الغلاف")}</h3>
              <p>
                {t(
                  "تُعرض هذه الصورة في خلفية ملفك الشخصي."
                )}
              </p>
            </div>
            <div className={styles.sectionContent}>
              <div
                className={styles.wallpaperZone}
                onClick={() => wallpaperInputRef.current?.click()}
              >
                {wallpaperPreview ? (
                  <>
                    <img
                      src={wallpaperPreview}
                      alt="Wallpaper"
                      className={styles.wallpaperPreviewImg}
                    />
                    <div className={styles.wallpaperOverlay}>
                      <UploadIcon />
                      <span>{t("تغيير الصورة")}</span>
                    </div>
                  </>
                ) : (
                  <div className={styles.wallpaperPlaceholder}>
                    <UploadIcon />
                    <p className={styles.uploadText}>
                      <span className={styles.uploadLink}>
                        {t("انقر للاستبدال")}
                      </span>{" "}
                      {t("أو سحب وإفلات")}
                    </p>
                    <p className={styles.uploadHint}>
                      SVG, PNG, JPG or GIF (max. 1600 x 600px)
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  ref={wallpaperInputRef}
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={handleWallpaperUpload}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════
            ─── Section 3: Personal Details ───────────
            ═══════════════════════════════════════════ */}
        <motion.div
          className={styles.section}
          custom={2}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className={styles.sectionRow}>
            <div className={styles.sectionLabel}>
              <h3>{t("التفاصيل الشخصية")}</h3>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.formGrid}>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label}>
                    {t("الاسم الكامل")} <span>*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    className={`${styles.input} ${formErrors.fullName ? styles.inputError : ''}`}
                    placeholder="Jake Gyll"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                  {formErrors.fullName && (
                    <div className={styles.errorMessage}>{t("هذا الحقل مطلوب")}</div>
                  )}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    {t("رقم الهاتف")} <span>*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className={`${styles.input} ${formErrors.phone ? styles.inputError : ''}`}
                    placeholder="+44 1245 572 135"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  {formErrors.phone && (
                    <div className={styles.errorMessage}>{t("هذا الحقل مطلوب")}</div>
                  )}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    {t("البريد الإلكتروني")} <span>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    className={`${styles.input} ${formErrors.email ? styles.inputError : ''}`}
                    placeholder="jakegyll@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {formErrors.email && (
                    <div className={styles.errorMessage}>{t("هذا الحقل مطلوب")}</div>
                  )}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    {t("تاريخ الميلاد")} <span>*</span>
                  </label>
                  <input
                    type="date"
                    name="dob"
                    className={`${styles.input} ${formErrors.dob ? styles.inputError : ''}`}
                    value={formData.dob}
                    onChange={handleChange}
                  />
                  {formErrors.dob && (
                    <div className={styles.errorMessage}>{t("هذا الحقل مطلوب")}</div>
                  )}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    {t("الجنس")} <span>*</span>
                  </label>
                  <select
                    name="gender"
                    className={`${styles.select} ${formErrors.gender ? styles.inputError : ''}`}
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="">{t("اختر...")}</option>
                    <option value="male">{t("ذكر")}</option>
                    <option value="female">{t("أنثى")}</option>
                  </select>
                  {formErrors.gender && (
                    <div className={styles.errorMessage}>{t("هذا الحقل مطلوب")}</div>
                  )}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    {t("المحافظة")} <span>*</span>
                  </label>
                  <select
                    name="location"
                    className={`${styles.select} ${formErrors.location ? styles.inputError : ''}`}
                    value={formData.location}
                    onChange={handleChange}
                  >
                    <option value="">{t("اختر المحافظة...")}</option>
                    {GOVERNORATES.map((gov) => (
                      <option key={gov} value={gov}>
                        {gov}
                      </option>
                    ))}
                  </select>
                  {formErrors.location && (
                    <div className={styles.errorMessage}>{t("هذا الحقل مطلوب")}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════
            ─── Section 4: About Me ───────────────────
            ═══════════════════════════════════════════ */}

        <motion.div
          className={styles.section}
          custom={3}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className={styles.sectionRow}>
            <div className={styles.sectionLabel}>
              <h3>{t("نبذة عني")}</h3>
              <p>{t("صف مهاراتك وخبراتك باختصار.")}</p>
            </div>
            <div className={styles.sectionContent}>
              <textarea
                className={`${styles.textarea} ${formErrors.bio ? styles.inputError : ""}`}
                placeholder={t("أضف نبذة عن نفسك...")}
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  if (formErrors.bio) {
                    setFormErrors((prev) => {
                      const newErrs = { ...prev };
                      delete newErrs.bio;
                      return newErrs;
                    });
                  }
                }}
              />
              {formErrors.bio && (
                <div className={styles.errorMessage}>{t("هذا الحقل مطلوب")}</div>
              )}
            </div>
          </div>
        </motion.div>


        {/* ═══════════════════════════════════════════
            ─── Service (Tradesman Only) ──────────────
            ═══════════════════════════════════════════ */}


        {/* ═══════════════════════════════════════════
            ─── Section 5: Experiences ────────────────
            ═══════════════════════════════════════════ */}

        <motion.div
          className={styles.section}
          custom={4}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className={styles.sectionRow}>
            <div className={styles.sectionLabel}>
              <h3>{t("الخبرات")}</h3>
              <p>{t("أضف خبراتك العملية السابقة.")}</p>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.listContainer}>
                <AnimatePresence>
                  {experiences.map((exp, index) => (
                    <motion.div
                      key={index}
                      className={styles.listItem}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className={styles.listHeader}>
                        <span className={styles.label}>
                          {t("خبرة")} {index + 1}
                        </span>
                        <button
                          className={styles.removeBtn}
                          onClick={() =>
                            setExperiences(
                              experiences.filter((_, i) => i !== index)
                            )
                          }
                        >
                          {t("حذف")}
                        </button>
                      </div>
                      <div className={styles.formGrid}>
                        <div className={`${styles.field} ${styles.fieldFull}`}>
                          <label className={styles.label}>
                            {t("المسمى الوظيفي")}
                          </label>
                          <input
                            type="text"
                            className={styles.input}
                            value={exp.role}
                            onChange={(e) => {
                              const updated = [...experiences];
                              updated[index].role = e.target.value;
                              setExperiences(updated);
                            }}
                          />
                        </div>
                        <div className={`${styles.field} ${styles.fieldFull}`}>
                          <label className={styles.label}>{t("المدة")}</label>
                          <input
                            type="text"
                            className={styles.input}
                            placeholder={t("مثل: يناير 2020 - مارس 2023")}
                            value={exp.period}
                            onChange={(e) => {
                              const updated = [...experiences];
                              updated[index].period = e.target.value;
                              setExperiences(updated);
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <motion.button
                  className={styles.addBtn}
                  onClick={addExperience}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  + {t("إضافة خبرة جديدة")}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>


        {/* ═══════════════════════════════════════════
            ─── Section 6: Education ──────────────────
            ═══════════════════════════════════════════ */}
        <motion.div
          className={styles.section}
          custom={5}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className={styles.sectionRow}>
            <div className={styles.sectionLabel}>
              <h3>{t("التعليم")}</h3>
              <p>{t("أضف مؤهلاتك العلمية.")}</p>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.listContainer}>
                <AnimatePresence>
                  {educations.map((edu, index) => (
                    <motion.div
                      key={index}
                      className={styles.listItem}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className={styles.listHeader}>
                        <span className={styles.label}>
                          {t("تعليم")} {index + 1}
                        </span>
                        <button
                          className={styles.removeBtn}
                          onClick={() =>
                            setEducations(
                              educations.filter((_, i) => i !== index)
                            )
                          }
                        >
                          {t("حذف")}
                        </button>
                      </div>
                      <div className={styles.formGrid}>
                        <div className={styles.field}>
                          <label className={styles.label}>
                            {t("المؤسسة التعليمية")}
                          </label>
                          <input
                            type="text"
                            className={styles.input}
                            value={edu.school}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[index].school = e.target.value;
                              setEducations(updated);
                            }}
                          />
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>
                            {t("الدرجة العلمية")}
                          </label>
                          <input
                            type="text"
                            className={styles.input}
                            value={edu.degree}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[index].degree = e.target.value;
                              setEducations(updated);
                            }}
                          />
                        </div>
                        <div className={`${styles.field} ${styles.fieldFull}`}>
                          <label className={styles.label}>{t("المدة")}</label>
                          <input
                            type="text"
                            className={styles.input}
                            value={edu.period}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[index].period = e.target.value;
                              setEducations(updated);
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <motion.button
                  className={styles.addBtn}
                  onClick={addEducation}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  + {t("إضافة تعليم جديد")}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════
            ─── Section 7: Skills ─────────────────────
            ═══════════════════════════════════════════ */}
        <motion.div
          className={styles.section}
          custom={6}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className={styles.sectionRow}>
            <div className={styles.sectionLabel}>
              <h3>{t("المهارات")}</h3>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.formGrid}>
                <div className={styles.fieldFull}>
                  <label className={styles.label}>{t("المهارات")}</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder={t("أضف مهارة واضغط Enter")}
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && skillInput.trim()) {
                        e.preventDefault();
                        setSkills([...skills, skillInput.trim()]);
                        setSkillInput("");
                      }
                    }}
                  />
                  <div className={styles.tagContainer}>
                    {skills.map((skill, i) => (
                      <span key={i} className={styles.tag}>
                        {skill}
                        <span
                          className={styles.tagRemove}
                          onClick={() =>
                            setSkills(skills.filter((_, idx) => idx !== i))
                          }
                        >
                          ×
                        </span>
                      </span>
                    ))}
                  </div>

                </div>
        
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════
            ─── Section 8: Social Links ───────────────
            ═══════════════════════════════════════════ */}
        <motion.div
          className={styles.section}
          custom={7}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className={styles.sectionRow}>
            <div className={styles.sectionLabel}>
              <h3>{t("روابط التواصل الاجتماعي")}</h3>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>{t("إنستجرام")}</label>
                  <input
                    type="text"
                    name="instagram"
                    className={styles.input}
                    placeholder="instagram.com/username"
                    value={socialLinks.instagram}
                    onChange={handleSocialChange}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>{t("تويتر")}</label>
                  <input
                    type="text"
                    name="twitter"
                    className={styles.input}
                    placeholder="twitter.com/username"
                    value={socialLinks.twitter}
                    onChange={handleSocialChange}
                  />
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label}>{t("الموقع الإلكتروني")}</label>
                  <input
                    type="text"
                    name="website"
                    className={styles.input}
                    placeholder="https://your-website.com"
                    value={socialLinks.website}
                    onChange={handleSocialChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════
            ─── Section 9: Work Images ────────────────
            ═══════════════════════════════════════════ */}
        <motion.div
          className={styles.section}
          custom={8}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className={styles.sectionRow}>
            <div className={styles.sectionLabel}>
              <h3>{t("صور الأعمال")}</h3>
              <p>{t("أضف صور لأعمالك السابقة.")}</p>
            </div>
            <div className={styles.sectionContent}>
              <div
                className={styles.workImageZone}
                onClick={() => workImageRef.current?.click()}
              >
                <div className={styles.wallpaperPlaceholder}>
                  <UploadIcon />
                  <p className={styles.uploadText}>
                    <span className={styles.uploadLink}>
                      {t("انقر للاستبدال")}
                    </span>{" "}
                    {t("أو سحب وإفلات")}
                  </p>
                  <p className={styles.uploadHint}>
                    SVG, PNG, JPG or GIF (max. 400 x 400px)
                  </p>
                </div>
                <input
                  type="file"
                  ref={workImageRef}
                  style={{ display: "none" }}
                  accept="image/*"
                  multiple
                  onChange={handleWorkImageUpload}
                />
              </div>
              {workImages.length > 0 && (
                <div className={styles.workImageGrid}>
                  {workImages.map((img, i) => (
                    <div key={i} className={styles.workImageThumb}>
                      <img src={img} alt={`Work ${i + 1}`} />
                      <button
                        className={styles.workImageRemove}
                        onClick={(e) => {
                          e.stopPropagation();
                          setWorkImages(
                            workImages.filter((_, idx) => idx !== i)
                          );
                          setWorkImageFiles(
                            workImageFiles.filter((_, idx) => idx !== i)
                          );
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════
            ─── Submit Row ────────────────────────────
            ═══════════════════════════════════════════ */}
        <motion.div
          className={styles.submitRow}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.button
            className={styles.submitBtn}
            onClick={handleSave}
            disabled={isSaving}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {isSaving ? (
              <span className={styles.loader} />
            ) : (
              t("حفظ وإكمال الملف الشخصي")
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
