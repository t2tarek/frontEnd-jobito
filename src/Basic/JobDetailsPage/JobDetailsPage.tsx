import { useNavigate, useLocation, Link } from "react-router-dom";
import styles from "./JobDetailsPage.module.css";
import { ApplyJobModal } from "./ApplyJobModal/ApplyJobModal";
import { useJobitoAuth } from "../../context/LinkContxt.js";
import { useEffect, useState, useMemo } from "react";
import AllApplicants from "../Company/All Applicants/All Applicants";
import { useTranslation } from "../../context/translation-context";
import { useToast } from "../../context/ToastContext";

const CheckIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" stroke="#56CDAD" strokeWidth="2" />
    <path
      d="M8 12L11 15L16 9"
      stroke="#56CDAD"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

import { API_BASE_URL, getCommonHeaders } from "../../services/api.js";

interface Benefit {
  emoji: string;
  name: string;
  desc: string;
}

interface Application {
  applicationId: number;
  status: string;
}

interface Job {
  jobId: number | string;
  isActive: boolean;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  address: string;
  jobType: string;
  salaryMin?: number;
  salaryMax?: number;
  createdAt?: string;
  expiresAt?: string;
  slotsAvailable?: number;
  category?: { name: string };
  company?: {
    name: string;
    description: string;
    website: string;
    benefits: Benefit[];
    officePhoto1Url: string;
    officePhoto2Url: string;
    logoUrl?: string;
  };
  applications?: Application[];
  images?: string[];
  user?: {
    avatarUrl?: string;
    fullName?: string;
  };
}

export const JobDetailsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const { apiFetch, isAuthenticated, role } = useJobitoAuth();
  const { showToast } = useToast();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "applicants">(
    "details",
  );
  const [job, setJob] = useState<Job | null>(null);
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"original" | "en">("original");
  const [userApplication, setUserApplication] = useState<Application | null>(
    null,
  );

  const jobId = location.state?.jobId || 1;

  useEffect(() => {
    const fetchJobData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}?_t=${Date.now()}`, {
          headers: getCommonHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        console.log("🔥 [JobDetailsPage] Fresh Job Data:", data);
        
        // Construct mapped job object handling PascalCase from backend
        const mappedData = {
          ...data,
          jobId: data.Id || data.id || data.JobId || data.jobId,
          title: data.Title || data.title,
          titleEn: data.TitleEn || data.titleEn,
          description: data.Description || data.description,
          descriptionEn: data.DescriptionEn || data.descriptionEn,
          address: data.Address || data.address,
          jobType: data.JobType || data.jobType,
          salaryMin: data.SalaryMin !== undefined ? data.SalaryMin : data.salaryMin,
          salaryMax: data.SalaryMax !== undefined ? data.SalaryMax : data.salaryMax,
          createdAt: data.CreatedAt || data.createdAt,
          expiresAt: data.ExpiresAt || data.expiresAt,
          slotsAvailable: data.SlotsAvailable !== undefined ? data.SlotsAvailable : data.slotsAvailable,
          isActive: data.IsActive !== undefined ? data.IsActive : data.isActive,
          category: data.Category || data.category || { name: data.CategoryName || data.categoryName },
          applications: data.Applications || data.applications || [],
          images: data.Images || data.images || [],
          user: (data.User || data.user || data.UserFullName || data.UserAvatarUrl) ? {
            avatarUrl: data.UserAvatarUrl || data.userAvatarUrl,
            fullName: data.UserFullName || data.userFullName
          } : null,
          company: data.Company ? {
            name: data.Company.Name || data.Company.name,
            description: data.Company.Description || data.Company.description,
            website: data.Company.Website || data.Company.website,
            benefits: data.Company.Benefits || data.Company.benefits || [],
            logoUrl: data.Company.LogoUrl || data.Company.logoUrl,
            officePhoto1Url: data.Company.OfficePhoto1Url || data.Company.officePhoto1Url,
            officePhoto2Url: data.Company.OfficePhoto2Url || data.Company.officePhoto2Url
          } : data.company || { 
            name: data.CompanyName || data.companyName || "Jobito",
            logoUrl: data.CompanyLogoUrl || data.companyLogoUrl 
          }
        };
        
        setJob(mappedData);

        const simRes = await fetch(`${API_BASE_URL}/api/jobs/similar/${jobId}?_t=${Date.now()}`, {
          headers: {
            "ngrok-skip-browser-warning": "69420",
          },
        });
        if (simRes.ok) {
          const simData = await simRes.json();
          setSimilarJobs(simData);
        }
      } catch (error) {
        console.error("Error fetching job data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobData();

    const fetchApplicationStatus = async () => {
      if (isAuthenticated && role === "user") {
        try {
          const res = await apiFetch(
            `${API_BASE_URL}/api/applications/status/${jobId}`,
          );
          if (res.ok) {
            const data = await res.json();
            setUserApplication(data);
          }
        } catch (err) {
          console.error("Error fetching application status:", err);
        }
      }
    };
    fetchApplicationStatus();

    // 📈 Record View logic
    const recordView = async () => {
      try {
        let sessionId = localStorage.getItem("jobito_session_id");
        if (!sessionId) {
          sessionId =
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
          localStorage.setItem("jobito_session_id", sessionId);
        }

        await apiFetch(`${API_BASE_URL}/api/jobs/${jobId}/view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
      } catch (err) {
        // Silent fail for view tracking
      }
    };
    recordView();
  }, [jobId, apiFetch, isAuthenticated, role]);

  const handleDelete = async () => {
    if (!window.confirm(t("هل أنت متأكد من حذف هذه الوظيفة؟"))) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast(t("تم حذف الوظيفة بنجاح."), "success");
        navigate("/JobListing");
      } else {
        throw new Error("Failed to delete job");
      }
    } catch (error: any) {
      console.error("Error deleting job:", error);
      showToast(t("خطأ أثناء حذف الوظيفة."), "error");
    }
  };

  const toggleActive = async () => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !job?.isActive }),
      });
      if (res.ok) {
        const updatedJob = await res.json();
        setJob((prev) =>
          prev ? { ...prev, isActive: updatedJob.isActive } : null,
        );
        showToast(
          updatedJob.isActive
            ? t("تم إعادة فتح الوظيفة")
            : t("تم إغلاق الوظيفة"),
          "success"
        );
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error("Error toggling job status:", error);
      showToast(t("خطأ أثناء تحديث حالة الوظيفة."), "error");
    }
  };

  const handleEdit = () => {
    navigate("/PostJob", { state: { editJob: job } });
  };

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      navigate("/user-information");
    } else {
      setIsApplyModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div
        className={styles.pageContainer}
        style={{ padding: "40px", textAlign: "center" }}
      >
        {t("جاري التحميل...")}
      </div>
    );
  }

  if (!job) {
    return (
      <div
        className={styles.pageContainer}
        style={{ padding: "40px", textAlign: "center" }}
      >
        {t("الوظيفة غير موجودة.")}
      </div>
    );
  }

  const descriptionToUse =
    lang === "en" && job.descriptionEn ? job.descriptionEn : job.description;
  const parsedSections: Record<string, string> = {};

  if (descriptionToUse) {
    let currentTitle = t("الوصف");
    let currentLines: string[] = [];

    const lines = descriptionToUse.split("\n");
    lines.forEach((line: string) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      const headerMatch = trimmedLine.match(/^\*\*(.*?):?\*\*[:\s]*$/);
      if (headerMatch) {
        parsedSections[currentTitle] = currentLines.join("\n").trim();
        currentTitle = headerMatch[1];
        currentLines = [];
      } else {
        currentLines.push(line);
      }
    });
    parsedSections[currentTitle] = currentLines.join("\n").trim();
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.breadcrumb}>
          <div />
          {job.titleEn && (
            <div className={styles.langToggle}>
              <button
                className={`${styles.langBtn} ${lang === "original" ? styles.activeLang : ""}`}
                onClick={() => setLang("original")}
              >
                {t("الأصلية")}
              </button>
              <button
                className={`${styles.langBtn} ${lang === "en" ? styles.activeLang : ""}`}
                onClick={() => setLang("en")}
              >
                {t("الإنجليزية")}
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation for Companies */}
        {role === "company" && (
          <div className={styles.tabNav}>
            <button
              className={`${styles.tabItem} ${activeTab === "details" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("details")}
            >
              {t("تفاصيل الوظيفة")}
            </button>
            <button
              className={`${styles.tabItem} ${activeTab === "applicants" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("applicants")}
            >
              {t("المتقدمون")} ({job.applications?.length || 0})
            </button>
          </div>
        )}

        {/* Header Card - only show in details tab */}
        {activeTab === "details" && (
          <div className={styles.headerCard}>
            <div className={styles.headerLeft}>
              <div className={styles.companyLogo}>
                {job.user?.avatarUrl ? (
                  <img
                    src={
                      job.user.avatarUrl.startsWith("http")
                        ? job.user.avatarUrl
                        : `${API_BASE_URL}${job.user.avatarUrl.startsWith("/") ? "" : "/"}${job.user.avatarUrl}`
                    }
                    alt={job.user.fullName || job.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : job.company?.logoUrl ? (
                  <img
                    src={
                      job.company.logoUrl.startsWith("http")
                        ? job.company.logoUrl
                        : `${API_BASE_URL}${job.company.logoUrl.startsWith("/") ? "" : "/"}${job.company.logoUrl}`
                    }
                    alt={job.company.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : job.images && job.images.length > 0 ? (
                  <img
                    src={
                      job.images[0].startsWith("http")
                        ? job.images[0]
                        : `${API_BASE_URL}${job.images[0].startsWith("/") ? "" : "/"}${job.images[0]}`
                    }
                    alt={job.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span>{job.company?.name?.[0]?.toUpperCase() || job.user?.fullName?.[0]?.toUpperCase() || "C"}</span>
                )}
              </div>
              <div className={styles.headerTitles}>
                <h1>
                  {lang === "en" && job.titleEn ? job.titleEn : job.title}
                </h1>
                <p>
                  {job.company?.name || t("شركة")} •{" "}
                  {job.address || t("الموقع")} •{" "}
                  {job.jobType === "full-time"
                    ? t("دوام كامل")
                    : job.jobType === "part-time"
                      ? t("دوام جزئي")
                      : t(job.jobType || "دوام كامل")}
                </p>
              </div>
            </div>
            {role === "company" ? (
              <div className={styles.headerRight}>
                <button
                  className={styles.editBtn}
                  title={t("تعديل الوظيفة")}
                  onClick={handleEdit}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  className={job.isActive ? styles.closeBtn : styles.reopenBtn}
                  title={job.isActive ? t("إغلاق الوظيفة") : t("فتح الوظيفة")}
                  onClick={toggleActive}
                >
                  {job.isActive ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  )}
                </button>
                <button
                  className={styles.deleteBtn}
                  title={t("حذف الوظيفة")}
                  onClick={handleDelete}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className={styles.headerRight}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <button className={styles.shareBtn}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                </button>
                {userApplication ? (
                  <div className={(styles as any).appliedStatusContainer}>
                    <button className={(styles as any).appliedBtn} disabled>
                      <i
                        className="fa-solid fa-check-circle"
                        style={{ marginLeft: "8px" }}
                      ></i>
                      {t("تم التقديم مسبقاً")}
                    </button>
                    <div
                      className={`${(styles as any).statusBadge} ${(styles as any)["status-" + (userApplication.status || "applied")]}`}
                    >
                      <span style={{ fontSize: "13px", opacity: 0.8 }}>
                        {t("حالة الطلب")}:
                      </span>
                      <strong style={{ marginLeft: "4px" }}>
                        {userApplication.status === "applied" ||
                        userApplication.status === "reviewing"
                          ? t("تحت المراجعة") + "⏳"
                          : userApplication.status === "shortlisted" ||
                              userApplication.status === "interviewed" ||
                              userApplication.status === "hired"
                            ? t("تم القبول (تواصل معنا)") + " ✅"
                            : userApplication.status === "declined"
                              ? t("نأسف، تم الرفض") + " ❌"
                              : t("تحت المراجعة") + " ⏳"}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <button
                    className={
                      job.isActive ? styles.applyBtn : styles.closedBtn
                    }
                    onClick={handleApplyClick}
                    disabled={!job.isActive}
                  >
                    {job.isActive ? t("قدم الان") : t("مغلق")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "details" ? (
          <>
            {/* Main 2-Column Layout */}
            <div className={styles.mainLayout}>
              {/* Left Column */}
              <div className={styles.leftCol}>
                {Object.entries(parsedSections).map(([title, content]) => {
                  if (!content || title === "المهارات" || title === "Skills")
                    return null;

                  const isList =
                    content.includes("•") || content.includes("- ");
                  const listItems = content
                    .split("\n")
                    .map((li) => li.replace(/^[•\-\s*]+/, "").trim())
                    .filter((li) => li.length > 0);

                  return (
                    <section key={title} className={styles.section}>
                      <h2>{t(title)}</h2>
                      {isList ? (
                        <ul className={styles.list}>
                          {listItems.map((item, i) => (
                            <li key={i}>
                              <CheckIcon />
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div
                          dangerouslySetInnerHTML={{ __html: content }}
                          className={styles.descriptionText}
                        />
                      )}
                    </section>
                  );
                })}
              </div>

              {/* Right Column */}
              <div className={styles.rightCol}>
                <div className={styles.widget}>
                  <h2>{t("عن الوظيفة")}</h2>
                  <div className={styles.capacityBox}>
                    <div className={styles.capacityText}>
                      <span className={styles.boldText}>
                        {job.applications?.length || 0} {t("تم التقديم")}
                      </span>{" "}
                      {t("من")} {job.slotsAvailable || 10} {t("متاح")}
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{
                          width: `${Math.min(
                            ((job.applications?.length || 0) /
                              (job.slotsAvailable || 10)) *
                              100,
                            100,
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className={styles.roleDetails}>
                    <div className={styles.roleRow}>
                      <span className={styles.roleLabel}>{t("نشر في")}</span>
                      <span className={styles.roleValue}>
                        {job.createdAt
                          ? new Date(job.createdAt).toLocaleDateString(
                              t("ar-EG") === "ar-EG" ? "ar-EG" : "en-US",
                            )
                          : t("غير متاح")}
                      </span>
                    </div>
                    {job.expiresAt && (
                      <div className={styles.roleRow}>
                        <span className={styles.roleLabel}>
                          {t("تقدم قبل")}
                        </span>
                        <span className={styles.roleValue}>
                          {new Date(job.expiresAt).toLocaleDateString(
                            t("ar-EG") === "ar-EG" ? "ar-EG" : "en-US",
                          )}
                        </span>
                      </div>
                    )}

                    <div className={styles.roleRow}>
                      <span className={styles.roleLabel}>
                        {t("نوع الوظيفة")}
                      </span>
                      <span
                        className={styles.roleValue}
                        style={{ textTransform: "capitalize" }}
                      >
                        {job.jobType === "full-time"
                          ? t("دوام كامل")
                          : job.jobType === "part-time"
                            ? t("دوام جزئي")
                            : t(job.jobType || "دوام كامل")}
                      </span>
                    </div>
                    <div className={styles.roleRow}>
                      <span className={styles.roleLabel}>{t("الراتب")}</span>
                      <span
                        className={styles.roleValue}
                        dir="ltr"
                        style={{ display: "inline-block", textAlign: "right" }}
                      >
                        {job.salaryMin === job.salaryMax || !job.salaryMax
                          ? `${job.salaryMin || 0} EGP`
                          : `${job.salaryMin || 0} - ${job.salaryMax} EGP`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.separator}></div>

                {(parsedSections["المهارات"] || parsedSections["Skills"]) && (
                  <>
                    <div className={styles.widget}>
                      <h2>{t("المهارات")}</h2>
                      <p
                        style={{
                          fontSize: "15px",
                          color: "var(--color-text-secondary)",
                          lineHeight: "1.6",
                          margin: 0,
                          fontWeight: 500,
                        }}
                      >
                        {t(
                          parsedSections["المهارات"] ||
                            parsedSections["Skills"],
                        )}
                      </p>
                    </div>
                    <div className={styles.separator}></div>
                  </>
                )}

                {(job.category || (job as any).categoryName) && (
                  <>
                    <div className={styles.widget}>
                      <h2>{t("الأقسام")}</h2>
                      <div className={styles.tagsContainer}>
                        <span className={styles.tagYellow}>
                          {job.category
                            ? t(job.category.name)
                            : t((job as any).categoryName)}
                        </span>
                      </div>
                    </div>
                    <div className={styles.separator}></div>
                  </>
                )}
              </div>
            </div>

            {/* Perks & Benefits */}
            <div className={styles.perksSection}>
              <div className={styles.perksHeader}>
                <h2>{t("المزايا والفوائد")}</h2>
                <p>{t("نحن نقدم مزايا رائعة لموظفينا.")}</p>
              </div>
              <div className={styles.perksGrid}>
                {job.company?.benefits && job.company.benefits.length > 0 ? (
                  job.company.benefits.map((benefit: Benefit, idx: number) => (
                    <div key={idx} className={styles.perkCard}>
                      <div
                        className={styles.perkIcon}
                        style={{
                          fontSize: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {benefit.emoji}
                      </div>
                      <h3>{t(benefit.name)}</h3>
                      <p>{t(benefit.desc)}</p>
                    </div>
                  ))
                ) : (
                  <p>{t("لا توجد مزايا محددة.")}</p>
                )}
              </div>
            </div>

            {/* Similar Jobs */}
            <div className={styles.similarJobsSection}>
              <div className={styles.similarHeader}>
                <h2>{t("وظائف مشابهة")}</h2>
                <Link to="/JobListing" className={styles.companyLink}>
                  {t("عرض كل الوظائف")}{" "}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ transform: "rotate(180deg)" }}
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </Link>
              </div>

              <div className={styles.similarGrid}>
                {similarJobs.length > 0 ? (
                  similarJobs.map((simJob: Job) => (
                    <div
                      key={simJob.jobId}
                      className={styles.similarJobCard}
                      onClick={() => {
                        navigate("/Job details", {
                          state: { jobId: simJob.jobId },
                        });
                        window.scrollTo(0, 0);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <div
                        className={styles.simLogo}
                        style={{
                          backgroundColor: simJob.company?.logoUrl
                            ? "transparent"
                            : "#4640de",
                        }}
                      >
                        <img
                          src={
                            simJob.user?.avatarUrl
                              ? (simJob.user.avatarUrl.startsWith("http")
                                  ? simJob.user.avatarUrl
                                  : `${API_BASE_URL}${simJob.user.avatarUrl.startsWith("/") ? "" : "/"}${simJob.user.avatarUrl}`)
                              : simJob.company?.logoUrl
                                ? (simJob.company.logoUrl.startsWith("http")
                                  ? simJob.company.logoUrl
                                  : `${API_BASE_URL}${simJob.company.logoUrl.startsWith("/") ? "" : "/"}${simJob.company.logoUrl}`)
                                : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(simJob.company?.name || simJob.user?.fullName || "Company")}`
                          }
                          alt={simJob.company?.name || simJob.user?.fullName}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "inherit",
                          }}
                        />
                      </div>
                      <div className={styles.simDetails}>
                        <div className={styles.simTitleGroup}>
                          <h3>{simJob.title}</h3>
                          <p>
                            {simJob.company?.name || "Jobito"} •{" "}
                            {simJob.address || t("عالمي")}
                          </p>
                        </div>
                        <div className={styles.simTags}>
                          <span className={styles.tagGreen}>
                            {simJob.jobType === "full-time"
                              ? t("دوام كامل")
                              : t("دوام جزئي")}
                          </span>
                          {simJob.category && (
                            <span className={styles.tagYellowOutline}>
                              {t(simJob.category.name)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>{t("لا توجد وظائف مشابهة متاحة.")}</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className={styles.applicantsContainer}>
            <AllApplicants jobIdProp={jobId} />
          </div>
        )}
      </div>

      <ApplyJobModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        jobId={jobId}
        isTradesman={!!job?.user || job?.classification === "خدمات" || job?.classification === "services" || job?.classification === "Services"}
        jobTitle={t(job?.title || "")}
        companyName={t(job?.company?.name || "شركة")}
        location={t(job?.address || "الموقع")}
        jobType={job?.jobType === "full-time" ? t("دوام كامل") : t("دوام جزئي")}
        isActive={job?.isActive}
        logoUrl={
          job?.company?.logoUrl
            ? job.company.logoUrl.startsWith("http")
              ? job.company.logoUrl
              : `${API_BASE_URL}${job.company.logoUrl.startsWith("/") ? "" : "/"}${job.company.logoUrl}`
            : undefined
        }
      />
    </div>
  );
};
