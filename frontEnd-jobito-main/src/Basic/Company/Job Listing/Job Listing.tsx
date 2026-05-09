import { useState, useEffect, useCallback } from "react";
import "./Job Listing.css";
import { useNavigate } from "react-router-dom";
import { useJobitoAuth } from "../../../context/LinkContxt";
import { useTranslation } from "../../../context/translation-context";
import { useToast } from "../../../context/ToastContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5200";

interface Job {
  id?: number;
  jobId?: number;
  job_id?: number;
  title: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  jobType: string;
  slotsAvailable: number;
  salary: number;
  appliedCount?: number;
}

export default function JobListing() {
  const { user, apiFetch } = useJobitoAuth();
  const { t, language } = useTranslation();
  const { showToast } = useToast();
  console.log("Logged in as:", user?.name);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("المتقدمون");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterType, setFilterType] = useState({
    "full-time": false,
    "part-time": false,
    freelance: false,
    internship: false,
    "one-time": false,
    remote: false
  });

  const [filterStatus, setFilterStatus] = useState({
    active: false,
    closed: false
  });

  const toggleStatusFilter = (key: keyof typeof filterStatus) => {
    setFilterStatus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTypeFilter = (key: keyof typeof filterType) => {
    setFilterType(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchJobs = useCallback(async () => {
    try {
      let companyId;
      try {
        const profileRes = await apiFetch(
          `${API_BASE_URL}/api/companies/my/profile?_t=${Date.now()}`,
        );
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const cid = profileData.id || profileData.companyId || profileData.company_id;
          if (cid) {
            companyId = cid;
          }
        }
      } catch (e) {
        console.warn("Profile fetch failed:", e);
      }

      const params = new URLSearchParams();
      if (companyId) {
        params.append("companyId", companyId.toString());
      } else if (user?.id) {
        params.append("userId", user.id);
      }
      params.append("_t", Date.now().toString());

      const url = `${API_BASE_URL}/api/jobs?${params.toString()}`;
      const jobsRes = await apiFetch(url);

      if (!jobsRes.ok) {
        const errData = await jobsRes.json().catch(() => ({}));
        throw new Error(
          errData.message || `Failed to fetch jobs (Status: ${jobsRes.status})`,
        );
      }
      const jobsData = await jobsRes.json();
      const freshJobs = (jobsData.data || []).map((j: any) => ({
        ...j,
        jobId: j.Id || j.id || j.jobId || j.job_id,
        title: j.Title || j.title || "",
        isActive: j.IsActive !== undefined ? j.IsActive : (j.isActive !== undefined ? j.isActive : j.is_active),
        createdAt: j.CreatedAt || j.createdAt,
        updatedAt: j.UpdatedAt || j.updatedAt,
        jobType: j.JobType || j.jobType || "",
        slotsAvailable: j.SlotsAvailable || j.slotsAvailable || 0,
        salary: j.Salary || j.salary || 0,
        appliedCount: j.AppliedCount || j.appliedCount || 0
      }));
      console.log("🔥 [JobListing] Fresh Data from Server:", freshJobs);
      setJobs(freshJobs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [navigate, apiFetch]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDelete = async (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    const id = job.jobId || job.job_id;
    if (!id || !window.confirm(t("هل أنت متأكد من حذف هذه الوظيفة؟"))) return;

    try {
      const res = await apiFetch(`${API_BASE_URL}/api/jobs/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setJobs(jobs.filter((j) => (j.jobId || j.job_id) !== id));
      } else {
        const data = await res.json();
        showToast(t(data.message) || t("فشل حذف الوظيفة"), "error");
      }
    } catch {
      showToast(t("خطأ أثناء حذف الوظيفة"), "error");
    }
  };

  const handleToggleStatus = async (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    const id = job.jobId || job.job_id;
    const currentActive =
      job.isActive !== undefined ? job.isActive : job.is_active;

    if (id === undefined) return;

    try {
      const res = await apiFetch(`${API_BASE_URL}/api/jobs/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      if (res.ok) {
        const updated = await res.json();
        setJobs(
          jobs.map((j) =>
            (j.jobId || j.job_id) === id
              ? {
                ...j,
                isActive: updated.isActive,
                is_active: updated.isActive,
              }
              : j,
          ),
        );
      } else {
        const data = await res.json();
        showToast(t(data.message) || t("فشل تحديث الحالة"), "error");
      }
    } catch {
      showToast(t("خطأ أثناء تحديث الحالة"), "error");
    }
  };

  const handleEdit = async (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    const id = job.jobId || job.job_id;
    if (!id) return;

    try {
      // Fetch full job details to ensure we have description, benefits, etc.
      const res = await apiFetch(`${API_BASE_URL}/api/jobs/${id}?_t=${Date.now()}`);
      if (res.ok) {
        const fullJob = await res.json();
        // Ensure ID is passed consistently for the edit form
        fullJob.jobId = id;
        navigate("/PostJob", { state: { editJob: fullJob } });
      } else {
        showToast(t("فشل في جلب بيانات الوظيفة"), "error");
      }
    } catch (err) {
      console.error("Error fetching job for edit:", err);
      showToast(t("حدث خطأ أثناء جلب البيانات"), "error");
    }
  };

  const getStatusClass = (isActive: boolean) => {
    return isActive ? "status-open" : "status-closed";
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? t("مفتوح") : t("مغلق");
  };

  const getTypeClass = (type: any) => {
    const rawType = Array.isArray(type) ? type[0] : type;
    const t = (rawType || "").toLowerCase();
    return t === "full-time" || t === "part-time"
      ? "type-fulltime"
      : "type-freelance";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredJobs = jobs.filter(job => {
    const rawType = Array.isArray(job.jobType) ? job.jobType[0] : job.jobType;
    const sType = (rawType || "").toLowerCase();
    const isActive = job.isActive;

    const anyStatus = filterStatus.active || filterStatus.closed;
    const matchStatus = !anyStatus || (
      (filterStatus.active && isActive) ||
      (filterStatus.closed && !isActive)
    );

    const anyType = Object.values(filterType).some(v => v);
    const matchType = !anyType || (
      (filterType["full-time"] && (sType === "full-time" || sType === "دوام كامل")) ||
      (filterType["part-time"] && (sType === "part-time" || sType === "دوام جزئي")) ||
      (filterType.freelance && (sType === "freelance" || sType.includes("عمل حر") || sType.includes("freelance"))) ||
      (filterType.internship && (sType === "internship" || sType.includes("تدريب") || sType.includes("internship"))) ||
      (filterType["one-time"] && (sType === "one-time" || sType.includes("مرة واحدة") || sType.includes("one-time"))) ||
      (filterType.remote && (sType === "remote" || sType.includes("عن بعد") || sType.includes("remote")))
    );

    return matchStatus && matchType;
  });

  if (loading) return <div className="jl-loading">{t("جاري التحميل...")}</div>;
  if (error) return <div className="jl-error">{t("خطأ")}: {t(error)}</div>;

  return (
    <div className="job-listing-page">
      <div className="jl-header-area">
        <div className="jl-title-row">
          <div className="jl-title-group">
            <h1 className="jl-title">{t("قائمة الوظائف")}</h1>
            <p className="jl-subtitle">
              {t("إدارة الوظائف التي قمت بنشرها ومتابعة المتقدمين.")}
            </p>
          </div>
          <div className="jl-date-range-picker">
            <span className="jl-date-text">13 Apr — 19 Apr</span>
            <svg
              className="jl-date-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
              <rect x="7" y="14" width="2" height="2"></rect>
              <rect x="11" y="14" width="2" height="2"></rect>
              <path d="M15 14h2"></path>
              <path d="M15 18h2"></path>
              <rect x="7" y="18" width="2" height="2"></rect>
              <rect x="11" y="18" width="2" height="2"></rect>
            </svg>
          </div>
        </div>
      </div>

      <div className="jl-main-card">
        <div className="jl-card-toolbar">
          <h2 className="jl-card-title">{t("قائمة الوظائف")} ({jobs.length})</h2>
          <div className="filter-checkboxes" style={{ gap: "10px" }}>
            <label className={`filter-chip ${filterStatus.active ? "filter-chip-active filter-chip-hired" : ""}`}>
              <input type="checkbox" checked={filterStatus.active} onChange={() => toggleStatusFilter("active")} />
              {t("مفتوح")}
            </label>
            <label className={`filter-chip ${filterStatus.closed ? "filter-chip-active filter-chip-declined" : ""}`}>
              <input type="checkbox" checked={filterStatus.closed} onChange={() => toggleStatusFilter("closed")} />
              {t("مغلق")}
            </label>

            <span style={{ width: "1px", height: "30px", background: "var(--color-border)", margin: "0 10px" }}></span>

            <label className={`filter-chip ${filterType["full-time"] ? "filter-chip-active filter-chip-waitlisted" : ""}`}>
              <input type="checkbox" checked={filterType["full-time"]} onChange={() => toggleTypeFilter("full-time")} />
              {t("دوام كامل")}
            </label>
            <label className={`filter-chip ${filterType["part-time"] ? "filter-chip-active filter-chip-inreview" : ""}`}>
              <input type="checkbox" checked={filterType["part-time"]} onChange={() => toggleTypeFilter("part-time")} />
              {t("دوام جزئي")}
            </label>
            <label className={`filter-chip ${filterType.freelance ? "filter-chip-active filter-chip-waitlisted" : ""}`}>
              <input type="checkbox" checked={filterType.freelance} onChange={() => toggleTypeFilter("freelance")} />
              {t("عمل حر (Freelance)")}
            </label>
            <label className={`filter-chip ${filterType.internship ? "filter-chip-active filter-chip-inreview" : ""}`}>
              <input type="checkbox" checked={filterType.internship} onChange={() => toggleTypeFilter("internship")} />
              {t("تدريب (Internship)")}
            </label>
            <label className={`filter-chip ${filterType["one-time"] ? "filter-chip-active filter-chip-declined" : ""}`}>
              <input type="checkbox" checked={filterType["one-time"]} onChange={() => toggleTypeFilter("one-time")} />
              {t("عمل لمرة واحدة")}
            </label>
            <label className={`filter-chip ${filterType.remote ? "filter-chip-active filter-chip-hired" : ""}`}>
              <input type="checkbox" checked={filterType.remote} onChange={() => toggleTypeFilter("remote")} />
              {t("عن بعد (Remote)")}
            </label>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="jl-empty-state">{t("لا توجد وظائف تتطابق مع البحث.")}</div>
        ) : (
          <table className="jl-table">
            <thead>
              <tr>
                <th>{t("المسمى الوظيفي")}</th>
                <th>{t("الحالة")}</th>
                <th>{t("تاريخ النشر")}</th>
                <th>{t("نوع الوظيفة")}</th>
                <th>{t("المتقدمون")}</th>
                <th>{t("المقاعد")}</th>
                <th>{t("الإجراءات")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr
                  key={job.jobId || job.job_id}
                  onClick={() =>
                    navigate("/Job details", {
                      state: { jobId: job.jobId || job.job_id },
                    })
                  }
                >
                  <td className="jl-col-role">{job.title}</td>
                  <td>
                    <span
                      className={`jl-status-badge ${getStatusClass(job.isActive)}`}
                    >
                      {getStatusText(job.isActive)}
                    </span>
                  </td>
                  <td className="jl-col-date">{formatDate(job.createdAt)}</td>
                  <td>
                    <span
                      className={`jl-type-badge ${getTypeClass(job.jobType)}`}
                    >
                      {t(Array.isArray(job.jobType) ? job.jobType[0] : job.jobType) || t("دوام كامل")}
                    </span>
                  </td>
                  <td className="jl-col-appl">
                    <button
                      className="jl-applicants-link"
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--color-primary)",
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "underline",
                        fontSize: "inherit",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/AllApplicants?jobId=${job.jobId || job.job_id}`,
                        );
                      }}
                    >
                      {job.appliedCount || 0}
                    </button>
                  </td>
                  <td className="jl-col-needs">
                    <strong>{job.slotsAvailable}</strong>
                  </td>
                  <td>
                    <div className="jl-actions">
                      <button
                        className="jl-action-btn edit"
                        title={t("تعديل")}
                        onClick={(e) => handleEdit(e, job)}
                      >
                        <svg
                          width="18"
                          height="18"
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
                        className={`jl-action-btn ${job.isActive ? "close" : "reopen"}`}
                        title={job.isActive ? t("إغلاق") : t("فتح")}
                        onClick={(e) => handleToggleStatus(e, job)}
                      >
                        {job.isActive ? (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              x="3"
                              y="3"
                              width="18"
                              height="18"
                              rx="2"
                              ry="2"
                            />
                            <line x1="9" y1="9" x2="15" y2="15" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                          </svg>
                        ) : (
                          <svg
                            width="18"
                            height="18"
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
                        className="jl-action-btn delete"
                        title={t("حذف")}
                        onClick={(e) => handleDelete(e, job)}
                      >
                        <svg
                          width="18"
                          height="18"
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
