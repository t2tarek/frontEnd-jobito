import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./All Applicants.css";
import { useJobitoAuth } from "../../../context/LinkContxt";
import { useTranslation } from "../../../context/translation-context";
import { useToast } from "../../../context/ToastContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5200";

interface Applicant {
  applicationId: number;
  status: string;
  appliedAt: string;
  portfolioUrl?: string;
  coverLetter?: string;
  resumeUrl?: string;
  user: {
    userId: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
    phone?: string;
    skills?: string[];
  };
}

const SortIcon = () => (
  <svg
    width="10"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginRight: "4px", opacity: 0.5 }}
  >
    <polyline points="7 10 12 5 17 10" />
    <polyline points="7 14 12 19 17 14" />
  </svg>
);

const CustomCheckbox = () => <div className="custom-checkbox"></div>;

export default function AllApplicants({ jobIdProp }: { jobIdProp?: string | number | null }) {
  const { t, language } = useTranslation();
  const { apiFetch } = useJobitoAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const jobId = jobIdProp ? String(jobIdProp) : searchParams.get("jobId");

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState("Table View");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilters, setStatusFilters] = useState({
    hired: false,
    declined: false,
    inreview: false,
    waitlisted: false,
  });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const toggleFilter = (key: keyof typeof statusFilters) => {
    setStatusFilters((prev) => ({ ...prev, [key]: !prev[key] }));
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchApplicants = async () => {
      if (!jobId) {
        setError(t("لم يتم تحديد الوظيفة"));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await apiFetch(`${API_BASE_URL}/api/applications/job/${jobId}`);
        if (!res.ok) {
          throw new Error(t("فشل في جلب بيانات المتقدمين"));
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data || [];
        setApplicants(list);
      } catch (err) {
        console.error("Error fetching applicants:", err);
        setError(err instanceof Error ? t(err.message) : t("خطأ غير متوقع"));
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, [jobId, apiFetch]);

  const handleDeleteApplicant = async (applicationId: number) => {
    if (!window.confirm(t("هل أنت متأكد من رغبتك في حذف هذا المتقدم بشكل نهائي؟")))
      return;
    try {
      const res = await apiFetch(
        `${API_BASE_URL}/api/applications/${applicationId}`,
        {
          method: "DELETE",
        },
      );
      if (res.ok) {
        setApplicants((prev) =>
          prev.filter((app) => app.applicationId !== applicationId),
        );
        showToast(t("تم الحذف بنجاح"), "success");
      } else {
        showToast(t("حدث خطأ أثناء محاولة الحذف"), "error");
      }
    } catch (err) {
      console.error(err);
      showToast(t("حدث خطأ أثناء محاولة الحذف"), "error");
    }
  };

  const getBadgeClass = (stage: string) => {
    const s = (stage || "applied").toLowerCase();
    switch (s) {
      case "applied":
      case "inreview":
      case "reviewing":
      case "interviewed":
      case "interviewing":
        return "badge-inreview";
      case "shortlisted":
      case "waitlisted":
        return "badge-waitlisted";
      case "declined":
        return "badge-declined";
      case "hired":
        return "badge-hired";
      default:
        return "badge-inreview";
    }
  };

  const getTranslatedStage = (stage: string) => {
    const s = (stage || "applied").toLowerCase();
    switch (s) {
      case "applied":
      case "inreview":
      case "reviewing":
        return t("تحت المراجعة");
      case "shortlisted":
      case "waitlisted":
        return t("في الانتظار");
      case "declined":
        return t("مرفوض");
      case "hired":
        return t("تم التوظيف");
      case "interviewed":
      case "interviewing":
        return t("تمت المقابلة");
      case "offered":
        return t("عرض عمل");
      default:
        return t(stage);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const loc = language === "ar" ? "ar-EG" : "en-US";
    return new Date(dateStr).toLocaleDateString(loc, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getAvatarUrl = (url?: string, name?: string) => {
    if (url) {
      if (url.startsWith("http")) return url;
      return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
    }
    return `https://api.dicebear.com/7.x/initials/svg?seed=${name || "User"}`;
  };

  const filteredApplicants = applicants.filter((app) => {
    const matchesSearch =
      (app.user?.fullName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (app.user?.email || "").toLowerCase().includes(searchTerm.toLowerCase());

    const anyFilterActive =
      statusFilters.hired ||
      statusFilters.declined ||
      statusFilters.inreview ||
      statusFilters.waitlisted;
    if (!anyFilterActive) return matchesSearch;

    const s = (app.status || "applied").toLowerCase();
    const matchesStatus =
      (statusFilters.hired && s === "hired") ||
      (statusFilters.declined && s === "declined") ||
      (statusFilters.waitlisted && ["waitlisted", "shortlisted"].includes(s)) ||
      (statusFilters.inreview &&
        [
          "applied",
          "inreview",
          "reviewing",
          "interviewing",
          "interviewed",
        ].includes(s));

    return matchesSearch && matchesStatus;
  });

  // Calculate pages
  const totalPages = Math.ceil(filteredApplicants.length / pageSize) || 1;
  const paginatedApplicants = filteredApplicants.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // If currentPage is greater than totalPages (e.g. on search or filter change), reset it
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  if (loading) {
    return (
      <div className="applicant-page">
        <div
          style={{ textAlign: "center", padding: "60px 0", color: "var(--color-text-muted)" }}
        >
          {t("جاري تحميل المتقدمين...")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="applicant-page">
        <div
          style={{ textAlign: "center", padding: "60px 0", color: "#FF6B6B" }}
        >
          ⚠️ {error}
        </div>
      </div>
    );
  }

  return (
    <div className="applicant-page">
      <div className="top-p-header">
        <h2 className="top-p-title">{t("إجمالي المتقدمين")} : {applicants.length}</h2>
        <div className="top-p-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder={t("البحث عن متقدم...")}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      <div className="filter-checkboxes">
        <label
          className={`filter-chip ${statusFilters.hired ? "filter-chip-active filter-chip-hired" : ""}`}
        >
          <input
            type="checkbox"
            checked={statusFilters.hired}
            onChange={() => toggleFilter("hired")}
          />
          {t("تم التوظيف")}
        </label>
        <label
          className={`filter-chip ${statusFilters.declined ? "filter-chip-active filter-chip-declined" : ""}`}
        >
          <input
            type="checkbox"
            checked={statusFilters.declined}
            onChange={() => toggleFilter("declined")}
          />
          {t("مرفوض")}
        </label>
        <label
          className={`filter-chip ${statusFilters.waitlisted ? "filter-chip-active filter-chip-waitlisted" : ""}`}
        >
          <input
            type="checkbox"
            checked={statusFilters.waitlisted}
            onChange={() => toggleFilter("waitlisted")}
          />
          {t("في الانتظار")}
        </label>
        <label
          className={`filter-chip ${statusFilters.inreview ? "filter-chip-active filter-chip-inreview" : ""}`}
        >
          <input
            type="checkbox"
            checked={statusFilters.inreview}
            onChange={() => toggleFilter("inreview")}
          />
          {t("تحت المراجعة")}
        </label>
      </div>

      <div className="table-container">
        <table className="applicant-table">
          <thead>
            <tr>
              <th style={{ width: 40, textAlign: "center" }}>
                <CustomCheckbox />
              </th>
              <th>
                {t("الاسم الكامل")} <SortIcon />
              </th>
              <th>
                {t("البريد الإلكتروني")} <SortIcon />
              </th>
              <th>
                {t("مرحلة التوظيف")} <SortIcon />
              </th>
              <th>
                {t("تاريخ التقديم")} <SortIcon />
              </th>
              <th>
                {t("الهاتف")} <SortIcon />
              </th>
              <th>
                {t("الإجراء")} <SortIcon />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredApplicants.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {t("لا يوجد متقدمون لهذه الوظيفة بعد.")}
                </td>
              </tr>
            ) : (
              paginatedApplicants.map((app) => (
                <tr key={app.applicationId}>
                  <td style={{ textAlign: "center" }}>
                    <CustomCheckbox />
                  </td>
                  <td>
                    <div className="app-user">
                      <img
                        src={getAvatarUrl(
                          app.user?.avatarUrl,
                          app.user?.fullName,
                        )}
                        alt={t(app.user?.fullName || "User")}
                      />
                      <span>{t(app.user?.fullName || "مستخدم")}</span>
                    </div>
                  </td>
                  <td className="app-role">{t(app.user?.email || "—")}</td>
                  <td>
                    <span className={`app-badge ${getBadgeClass(app.status)}`}>
                      {getTranslatedStage(app.status)}
                    </span>
                  </td>
                  <td className="app-date">{formatDate(app.appliedAt)}</td>
                  <td className="app-role">{t(app.user?.phone || "—")}</td>
                  <td>
                    <div className="app-actions">
                      {app.resumeUrl && (
                        <a
                          href={
                            app.resumeUrl.startsWith("http")
                              ? app.resumeUrl
                              : `${API_BASE_URL}${app.resumeUrl}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="see-app-btn"
                          style={{ textDecoration: "none" }}
                        >
                          {t("السيرة الذاتية")}
                        </a>
                      )}
                      {app.portfolioUrl && (
                        <a
                          href={app.portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="see-app-btn"
                          style={{ textDecoration: "none" }}
                        >
                          {t("Portfolio")}
                        </a>
                      )}
                      <button
                        className="see-app-btn"
                        onClick={() =>
                          navigate(`/ApplicantDetails/${app.applicationId}`)
                        }
                      >
                        {t("عرض الطلب")}
                      </button>
                      <button
                        className="delete-app-btn"
                        onClick={() => handleDeleteApplicant(app.applicationId)}
                        title="حذف المتقدم"
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
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredApplicants.length > 0 && (
        <div className="pagination-footer">
          <div 
            className="page-size-wrap"
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "10px", 
              whiteSpace: "nowrap",
              color: "var(--color-text)",
              fontWeight: "500"
            }}
          >
            <span>{t("عرض")}</span>
            <select
              style={{
                background: "transparent",
                border: `1px solid var(--color-border)`,
                color: "var(--color-text)",
                padding: "6px 12px",
                borderRadius: "6px",
                outline: "none",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px"
              }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
            <span>{t("لكل صفحة")}</span>
          </div>
          
          {totalPages > 1 && (
            <div className="page-controls" style={{ display: "flex", alignItems: "center", gap: "8px", flexDirection: "row" }}>
              <button
                className="page-nav"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ opacity: currentPage === 1 ? 0.3 : 1, cursor: currentPage === 1 ? "default" : "pointer" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
              
              <div style={{ display: "flex", gap: "6px", flexDirection: "row" }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      cursor: "pointer",
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "6px",
                      border: "none",
                      fontWeight: "600",
                      fontSize: "14px",
                      backgroundColor: currentPage === pageNum ? "var(--color-primary)" : "transparent",
                      color: currentPage === pageNum ? "#fff" : "var(--color-text)",
                      transition: "0.2s"
                    }}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              
              <button
                className="page-nav"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ opacity: currentPage === totalPages ? 0.3 : 1, cursor: currentPage === totalPages ? "default" : "pointer" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
