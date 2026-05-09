import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Eye, Users, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import styles from "./WorkListing.module.css";
import { useTranslation } from "../../../context/translation-context";
import { useJobitoAuth } from "../../../context/LinkContxt";
import { useTheme } from "../../../context/ThemeContext";
import { API_BASE_URL } from "../../../services/api";

const WorkListing = () => {
  const { t } = useTranslation();
  const { user, apiFetch } = useJobitoAuth();
  const { theme, isDark } = useTheme();
  const navigate = useNavigate();

  const [works, setWorks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchWorks = async () => {
      if (!user?.companyId && !user?.id) return;
      
      try {
        setIsLoading(true);
        // Fetch jobs specifically posted by this tradesman
        const userId = user.id || (user as any).userId;
        const response = await apiFetch(`${API_BASE_URL}/api/jobs?userId=${userId}&classification=tradesman_work&_t=${Date.now()}`);
        if (response.ok) {
          const result = await response.json();
          // Support both wrapped { data: [] } and direct [] responses
          const freshWorks = Array.isArray(result) ? result : (result.data || []);
          console.log("🔥 [WorkListing] Fresh Works:", freshWorks);
          setWorks(freshWorks);
        }
      } catch (error) {
        console.error("Error fetching works:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorks();
  }, [user, apiFetch]);

  const handleEdit = async (work: any) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/jobs/${work.jobId}?_t=${Date.now()}`);
      if (res.ok) {
        const fullWork = await res.json();
        navigate("/PostJob", { state: { editJob: fullWork } });
      }
    } catch (error) {
      console.error("Error fetching work for edit:", error);
    }
  };

  return (
    <div className={`${styles.container} ${isDark ? styles.dark : styles.light}`} data-theme={theme}>
      <header className={styles.header}>
        <h1>{t("قائمة الأعمال")}</h1>
        <p>{t("شاهد حالة أعمالك المنشورة وإحصائيات المتقدمين.")}</p>
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("Roles")}</th>
              <th>{t("Rate")}</th>
              <th>{t("Status")}</th>
              <th>{t("Date Posted")}</th>
              <th>{t("Due Date")}</th>
              <th>{t("Applicants")}</th>
              <th>{t("Applications")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{textAlign: 'center'}}>{t("جاري التحميل...")}</td></tr>
            ) : works.map((work) => (
              <tr key={work.jobId} style={{display: 'table-row'}}>
                <td>
                  <div className={styles.jobTitle}>{work.title}</div>
                </td>
                <td>
                  <div className={styles.rate}>
                    <Star size={14} fill="#fbbf24" stroke="none" />
                    <span>4.0</span>
                  </div>
                </td>
                <td>
                  <span className={styles.status}>{t("Live")}</span>
                </td>
                <td>
                  <div className={styles.date}>{new Date(work.createdAt).toLocaleDateString()}</div>
                </td>
                <td>
                  <div className={styles.date}>24 May 2026</div>
                </td>
                <td>
                  <div className={styles.applicants}>{work.appliedCount || 0}</div>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button 
                      className={styles.actionBtn}
                      onClick={() => handleEdit(work)}
                      title={t("تعديل")}
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      className={styles.actionBtn}
                      onClick={() => navigate(`/WorkApplicants?jobId=${work.jobId}`)}
                      title={t("المتقدمين")}
                    >
                      <Users size={16} />
                    </button>
                    <button 
                      className={styles.actionBtn}
                      onClick={() => navigate(`/WorkManagement/${work.jobId}`)}
                      title={t("عرض")}
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {works.length === 0 && !isLoading && (
              <tr><td colSpan={7} style={{textAlign: 'center'}}>{t("لا توجد أعمال منشورة بعد.")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <button className={styles.pageBtn}><ChevronLeft size={16} /></button>
        <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
        <button className={styles.pageBtn}>2</button>
        <button className={styles.pageBtn}>3</button>
        <button className={styles.pageBtn}><ChevronRight size={16} /></button>
      </div>
    </div>
  );
};

export default WorkListing;
