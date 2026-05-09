import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X, Plus } from "lucide-react";
import styles from "./PostWork.module.css";
import { useTranslation } from "../../../context/translation-context";
import { useJobitoAuth } from "../../../context/LinkContxt";
import { API_BASE_URL } from "../../../services/api";

const DAYS = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

const PostWork = () => {
  const { t } = useTranslation();
  const { user, apiFetch } = useJobitoAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    skills: [] as string[],
    workTime: [] as string[],
    images: [] as string[],
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      workTime: prev.workTime.includes(day)
        ? prev.workTime.filter((d) => d !== day)
        : [...prev.workTime, day],
    }));
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Filter for images only
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    setSelectedFiles((prev) => [...prev, ...imageFiles]);

    const newPreviews = imageFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImagesToServer = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of selectedFiles) {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("entity_type", "job");
      formDataUpload.append("entity_id", user?.id || "anonymous"); // Temporary ID
      formDataUpload.append("image_type", "gallery");

      try {
        const response = await fetch(`${API_BASE_URL}/api/images/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formDataUpload,
        });

        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(data.imageUrl);
        } else {
          console.error("Failed to upload image:", file.name);
        }
      } catch (err) {
        console.error("Error uploading image:", err);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      alert(t("يرجى ملء الحقول الأساسية"));
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload images first
      const imageUrls = await uploadImagesToServer();

      // 2. Submit job with image URLs
      const response = await apiFetch(`${API_BASE_URL}/api/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          images: imageUrls,
          classification: "tradesman_work",
          jobType: "one-time",
          isActive: true,
        }),
      });

      if (response.ok) {
        alert(t("تم نشر العمل بنجاح"));
        navigate("/JobListing");
      } else {
        alert(t("حدث خطأ أثناء النشر"));
      }
    } catch (error) {
      console.error("Error posting work:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        <ArrowLeft size={24} />
        <span>{t("نشر عملا")}</span>
      </button>

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{t("معلومات أساسية")}</h2>
        <p className={styles.sectionSubtitle}>
          {t("هذه المعلومات ستظهر للعامة.")}
        </p>
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.rowLabel}>
          <strong>{t("عنوان العمل")}</strong>
          <span>{t("اكتب عنوانا قصيرا وواضحا للمهمة المطلوبة.")}</span>
        </div>
        <div className={styles.rowContent}>
          <input
            type="text"
            className={styles.textInput}
            placeholder={t("مثال: صيانة سباكة حمام")}
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.fieldRow}>
        <div className={styles.rowLabel}>
          <strong>{t("وصف العمل")}</strong>
          <span>{t("اشرح المهام والمتطلبات بالتفصيل.")}</span>
        </div>
        <div className={styles.rowContent}>
          <textarea
            className={styles.textArea}
            placeholder={t("أدخل وصف العمل هنا")}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.fieldRow}>
        <div className={styles.rowLabel}>
          <strong>{t("المهارات المطلوبة")}</strong>
          <span>{t("أضف المهارات اللازمة لهذا العمل.")}</span>
        </div>
        <div className={styles.rowContent}>
          <div className={styles.skillsInputContainer}>
            <div className={styles.skillInputRow}>
              <input
                type="text"
                className={styles.textInput}
                placeholder={t("أضف مهارة...")}
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addSkill()}
              />
              <button className={styles.addBtn} onClick={addSkill}>
                <Plus size={20} />
              </button>
            </div>
            <div className={styles.skillsRow}>
              {formData.skills.map((skill) => (
                <div key={skill} className={styles.skillTag}>
                  {t(skill)}
                  <button onClick={() => removeSkill(skill)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.fieldRow}>
        <div className={styles.rowLabel}>
          <strong>{t("الموقع")}</strong>
        </div>
        <div className={styles.rowContent}>
          <select
            className={styles.selectInput}
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          >
            <option value="">{t("اختر المحافظة")}</option>
            <option value="Cairo">{t("القاهرة")}</option>
            <option value="Giza">{t("الجيزة")}</option>
            <option value="Alexandria">{t("الإسكندرية")}</option>
          </select>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.fieldRow}>
        <div className={styles.rowLabel}>
          <strong>{t("وقت العمل")}</strong>
        </div>
        <div className={styles.rowContent}>
          <div className={styles.daySelector}>
            {DAYS.map((day) => (
              <button
                key={day}
                className={`${styles.dayBtn} ${formData.workTime.includes(day) ? styles.dayBtnActive : ""}`}
                onClick={() => toggleDay(day)}
              >
                {t(day)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.fieldRow}>
        <div className={styles.rowLabel}>
          <strong>{t("صور العمل")}</strong>
          <span>{t("أضف صورا توضيحية للعمل")}</span>
        </div>
        <div className={styles.rowContent}>
          <input
            type="file"
            multiple
            accept="image/*"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
          <div
            className={styles.dropzone}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={32} color="var(--color-accent)" />
            <p>
              <span>{t("اضغط للاستبدال")}</span> {t("أو اسحب وأفلت")}
            </p>
            <p>SVG, PNG, JPG or GIF (max. 400 x 400px)</p>
          </div>

          {previews.length > 0 && (
            <div className={styles.previewGrid}>
              {previews.map((url, index) => (
                <div key={url} className={styles.previewItem}>
                  <img src={url} alt="Work preview" />
                  <button
                    className={styles.removePreview}
                    onClick={() => removeFile(index)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.nextRow}>
        {user?.deletionRequestedAt && (
          <p className={styles.deletionWarning}>
            {t(
              "لا يمكن نشر عمل جديد لأن حسابك مجدول للحذف. يرجى إلغاء طلب الحذف لاستعادة هذه الميزة.",
            )}
          </p>
        )}
        <button
          className={styles.nextBtn}
          onClick={handleSubmit}
          disabled={isSubmitting || !!user?.deletionRequestedAt}
        >
          {isSubmitting ? t("جاري النشر...") : t("الخطوة التالية")}
        </button>
      </div>
    </div>
  );
};

export default PostWork;
