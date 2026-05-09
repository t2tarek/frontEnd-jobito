import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, Check, X } from "lucide-react";
import styles from "./WorkApplicants.module.css";
import { useTranslation } from "../../../context/translation-context";
import { useJobitoAuth } from "../../../context/LinkContxt";
import { useTheme } from "../../../context/ThemeContext";
import { API_BASE_URL } from "../../../services/api";

const WorkApplicants = () => {
  const { t } = useTranslation();
  const { apiFetch } = useJobitoAuth();
  const { theme, isDark } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("jobId");

  const [applicants, setApplicants] = useState<any[]>([]);
  const [jobInfo, setJobInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedApplicantId, setExpandedApplicantId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!jobId) return;
      try {
        setIsLoading(true);
        // Fetch job details
        const jobRes = await apiFetch(`${API_BASE_URL}/api/jobs/${jobId}`);
        if (jobRes.ok) setJobInfo(await jobRes.json());

        // Fetch applicants
        const appRes = await apiFetch(`${API_BASE_URL}/api/applications/job/${jobId}`);
        if (appRes.ok) setApplicants(await appRes.json());
      } catch (error) {
        console.error("Error fetching applicants:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [jobId, apiFetch]);

  const handleUpdateStatus = async (applicationId: string, status: string) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        setApplicants(prev => prev.map(app => 
          app.applicationId === applicationId ? { ...app, status } : app
        ));
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className={`${styles.container} ${isDark ? styles.dark : styles.light}`} data-theme={theme}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <button className={styles.backBtn} onClick={() => navigate(-1)} style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer'}}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1>{jobInfo?.title || t("مساعد وسائل التواصل الاجتماعي")}</h1>
            <div className={styles.meta}>
              {t(jobInfo?.category?.name || "Design")} • {t(jobInfo?.jobType || "Full-Time")}
            </div>
          </div>
        </div>
        <div className={styles.tabs}>
          <div className={styles.tab}>{t("Job Details")}</div>
          <div className={`${styles.tab} ${styles.activeTab}`}>{t("Applicants")}</div>
          <div className={styles.tab}>{t("Analytics")}</div>
        </div>
      </header>

      <div className={styles.listHeader}>
        <h2>{t("Total Applicants")}: {applicants.length}</h2>
        <div className={styles.searchBox}>
          <input type="text" className={styles.searchBar} placeholder={t("Search Applicants")} />
          <button className={styles.filterBtn}><Filter size={16} /> {t("Filter")}</button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("Full Name")}</th>
              <th>{t("Phone Number")}</th>
              {expandedApplicantId && (
                <>
                  <th>{t("Governorate")}</th>
                  <th>{t("Address")}</th>
                </>
              )}
              <th>{t("Action")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{textAlign: 'center'}}>{t("جاري التحميل...")}</td></tr>
            ) : applicants.map((app) => (
              <tr key={app.applicationId}>
                <td>
                  <div className={styles.applicantInfo}>
                    <img src={app.user?.avatar || "https://i.pravatar.cc/150"} alt="" className={styles.avatar} />
                    <span className={styles.name}>{app.user?.name || "Jake Meyer"}</span>
                  </div>
                </td>
                <td><span className={styles.phone}>{app.user?.phone || "01228129905"}</span></td>
                
                {expandedApplicantId === app.applicationId ? (
                  <>
                    <td><span className={styles.location}>{app.user?.city || "Cairo"}</span></td>
                    <td><span className={styles.location}>{app.user?.address || "El-Sherouk"}</span></td>
                    <td>
                      <button 
                        className={`${styles.actionBtn} ${styles.approvedBtn}`}
                        onClick={() => handleUpdateStatus(app.applicationId, "accepted")}
                      >
                        {t("Approved")}
                      </button>
                      <button 
                        className={`${styles.actionBtn} ${styles.rejectedBtn}`}
                        onClick={() => handleUpdateStatus(app.applicationId, "rejected")}
                      >
                        {t("Rejected")}
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    {expandedApplicantId && <><td/><td/></>}
                    <td>
                      <button 
                        className={styles.actionBtn}
                        onClick={() => navigate(`/WorkApplicantDetails/${app.applicationId}`)}
                      >
                        {t("See Application")}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {applicants.length === 0 && !isLoading && (
              <tr><td colSpan={5} style={{textAlign: 'center'}}>{t("لا يوجد متقدمين لهذا العمل بعد.")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <button className={styles.pageBtn}>1</button>
      </div>
    </div>
  );
};

export default WorkApplicants;
