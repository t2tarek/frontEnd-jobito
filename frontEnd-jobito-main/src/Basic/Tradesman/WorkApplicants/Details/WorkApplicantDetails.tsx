import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Clock, Check, X, MessageSquare, Star, Info } from "lucide-react";
import styles from "./WorkApplicantDetails.module.css";
import { useTranslation } from "../../../../context/translation-context";
import { useJobitoAuth } from "../../../../context/LinkContxt";

const WorkApplicantDetails = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { role } = useJobitoAuth();
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");

  // Mock Applicant Data
  const applicant = {
    id: id || "1",
    name: "أحمد محمود كمال",
    phone: "01023456789",
    email: "ahmed.mahmoud@gmail.com",
    avatar: "https://i.pravatar.cc/150?u=ahmed",
    location: "القاهرة، مدينة نصر",
    appliedDate: "2024-04-18",
    appliedTime: "10:30 AM",
    description: "أحتاج لسباك محترف لإصلاح تسريب كبير في الحمام الرئيسي. التسريب أثر على الجدران المجاورة وأحتاج لمعاينة سريعة وتحديد التكلفة الإجمالية.",
    address: "١١ شارع عباس العقاد، الدور الخامس، شقة ١٤",
    budget: "450 EGP",
    rating: 4.8,
    totalOrders: 12,
    images: [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&q=80&w=300"
    ]
  };

  const handleUpdateStatus = (newStatus: "approved" | "rejected") => {
    setStatus(newStatus);
    // In a real app, this would use apiFetch
  };

  const statusColors = {
    pending: styles.statusPending,
    approved: styles.statusApproved,
    rejected: styles.statusRejected
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.topNav}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <div className={styles.headerInfo}>
            <h1>{t("تفاصيل المتقدم للعمل")}</h1>
            <p className={styles.breadcrumb}>{t("أعمالي")} / {t("المتقدمين")} / {applicant.name}</p>
          </div>
        </div>
      </header>

      <div className={styles.contentGrid}>
        {/* Left Side: Main Info */}
        <div className={styles.mainContent}>
          <div className={styles.card}>
            <div className={styles.applicantHeader}>
              <img src={applicant.avatar} alt="" className={styles.avatar} />
              <div className={styles.info}>
                <h2>{applicant.name}</h2>
                <div className={styles.meta}>
                  <span><Star size={14} className={styles.starIcon} /> {applicant.rating}</span>
                  <span className={styles.dot}>•</span>
                  <span>{applicant.totalOrders} {t("طلب سابق")}</span>
                </div>
              </div>
              <div className={`${styles.statusBadge} ${statusColors[status]}`}>
                {t(status === "pending" ? "قيد الانتظار" : status === "approved" ? "تمت الموافقة" : "مرفوض")}
              </div>
            </div>

            <div className={styles.section}>
              <h3><Info size={18} className={styles.sectionIcon} /> {t("وصف المشكلة")}</h3>
              <p className={styles.description}>{applicant.description}</p>
              
              <div className={styles.imageGallery}>
                {applicant.images.map((img, i) => (
                  <img key={i} src={img} alt="Problem Site" className={styles.previewImage} />
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h3><MapPin size={18} className={styles.sectionIcon} /> {t("عنوان الموقع")}</h3>
              <div className={styles.addressBox}>
                <p>{applicant.address}</p>
                <p className={styles.locationMeta}>{applicant.location}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Sidebar Info */}
        <div className={styles.sidebar}>
          <div className={styles.card}>
            <h3>{t("بيانات التواصل")}</h3>
            <div className={styles.contactList}>
              <div className={styles.contactItem}>
                <Phone size={18} />
                <div className={styles.contactText}>
                  <span>{t("رقم الهاتف")}</span>
                  <strong>{applicant.phone}</strong>
                </div>
              </div>
              <div className={styles.contactItem}>
                <Mail size={18} />
                <div className={styles.contactText}>
                  <span>{t("البريد الإلكتروني")}</span>
                  <strong>{applicant.email}</strong>
                </div>
              </div>
              <div className={styles.contactItem}>
                <Calendar size={18} />
                <div className={styles.contactText}>
                  <span>{t("تاريخ التقديم")}</span>
                  <strong>{applicant.appliedDate}</strong>
                </div>
              </div>
              <div className={styles.contactItem}>
                <Clock size={18} />
                <div className={styles.contactText}>
                  <span>{t("وقت التقديم")}</span>
                  <strong>{applicant.appliedTime}</strong>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.chatBtn} onClick={() => navigate("/chat")}>
                <MessageSquare size={18} /> {t("بدء محادثة")}
              </button>
              
              {status === "pending" && (
                <div className={styles.decisionBtns}>
                  <button className={styles.approveBtn} onClick={() => handleUpdateStatus("approved")}>
                    <Check size={18} /> {t("قبول الطلب")}
                  </button>
                  <button className={styles.rejectBtn} onClick={() => handleUpdateStatus("rejected")}>
                    <X size={18} /> {t("رفض")}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={`${styles.card} ${styles.summaryCard}`}>
            <h3>{t("ملخص العرض")}</h3>
            <div className={styles.summaryItem}>
              <span>{t("الميزانية المقدرة")}</span>
              <span className={styles.budgetAmount}>{applicant.budget}</span>
            </div>
            <p className={styles.summaryNote}>*{t("السعر قابل للتغيير بعد المعاينة الفعلية")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkApplicantDetails;
