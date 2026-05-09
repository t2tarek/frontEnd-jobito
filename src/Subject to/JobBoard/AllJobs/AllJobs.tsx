import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./AllJobs.module.css";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useJobitoAuth } from "../../../context/LinkContxt.js";
import { useRef } from "react";
import { useTranslation } from "../../../context/translation-context";
import { useToast } from "../../../context/ToastContext";
import {
  FiGrid,
  FiList,
  FiChevronUp,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

import { API_BASE_URL } from "../../../services/api.js";

const getFullImageUrl = (url?: string, seed?: string, job?: Job) => {
  // Priority 1: Use the Tradesman's personal avatar if available
  if (job?.user?.avatarUrl) {
    const avatar = job.user.avatarUrl;
    if (avatar.startsWith("http")) return avatar;
    return `${API_BASE_URL}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
  }

  // Priority 2: Use the logoUrl (Company Logo)
  if (url) {
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  }

  // Priority 3: Fallback to the first image from the job's own images array
  if (job?.images && job.images.length > 0) {
    const firstImg = job.images[0];
    if (firstImg.startsWith("http")) return firstImg;
    return `${API_BASE_URL}${firstImg.startsWith("/") ? "" : "/"}${firstImg}`;
  }

  // Priority 4: Fallback based on classification or default
  const categorySeed = seed || "company";
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${categorySeed}`;
};

interface Job {
  jobId: string | number;
  title: string;
  company?: {
    name: string;
    address?: string;
    logoUrl?: string;
  };
  address: string;
  jobType: string;
  slotsAvailable: number;
  salary?: number;
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  expiresAt?: string;
  createdAt?: string;
  appliedCount?: number;
  category?: { name: string };
  categoryId?: number;

  user?: {
    avatarUrl?: string;
    fullName?: string;
  };
  applications?: any[];
  classification?: string;
  images?: string[];
}

const sidebarVariant: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

interface AllJobsProps {
  searchKeyword?: string;
  location?: string;
  category?: string;
}

const AllJobs: React.FC<AllJobsProps> = ({
  searchKeyword = "",
  location = "",
  category = "",
}) => {
  const { apiFetch, isAuthenticated, role, user } = useJobitoAuth();
  const classification = user?.classification;
  const [jobs, setJobs] = useState<Job[]>([]);
  const { t } = useTranslation();


  // Mock Maintenance Orders removed - linking to backend real data

  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">(() => {
    return (localStorage.getItem("jobs_view") as "grid" | "list") || "list";
  });
  const [likedJobs, setLikedJobs] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Fetch Guards
  const fetchInProgress = useRef(false);
  const lastFetchParams = useRef<string | null>(null);
  const renderCount = useRef(0);
  renderCount.current++;

  // Persist view preference
  useEffect(() => {
    localStorage.setItem("jobs_view", view);
  }, [view]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;

  // Filter states
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>(
    classification === "tradesman" ? ["tradesman"] : []
  );
  const [selectedSalaries, setSelectedSalaries] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Category Auto-Filter from URL or Prop
  useEffect(() => {
    const categoryParam = category || searchParams.get("category");
    if (categoryParam) {
      console.log(`🎯 [AllJobs] Activating filter: ${categoryParam}`);
      
      // Map Arabic category names to internal classification values
      let filterValue = categoryParam;
      if (categoryParam === "خدمات") filterValue = "services";
      
      setSelectedLevels([filterValue]);
      
      // If it came from URL, clean it up
      if (searchParams.get("category")) {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("category");
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [category, searchParams, setSearchParams]);

  useEffect(() => {
    const currentParams = JSON.stringify({ searchKeyword, location });
    const abortController = new AbortController();
    const currentRender = renderCount.current;

    const fetchData = async () => {
      // 1. Prevent concurrent identical fetches
      if (
        fetchInProgress.current &&
        lastFetchParams.current === currentParams
      ) {
        console.log(
          `🚫 [AllJobs] [Render ${currentRender}] Skipping redundant fetch for same params.`,
        );
        return;
      }

      // 2. Track current fetch operation
      console.log(
        `🔍 [AllJobs] [Render ${currentRender}] Starting fetchData...`,
        { searchKeyword, location },
      );
      fetchInProgress.current = true;
      lastFetchParams.current = currentParams;

      setLoading(true);
      try {
        // Fetch Jobs: Use AI Smart Search when search keyword exists
        let jobsList: Job[] = [];

        // Ensure location is a string to avoid [object Object]
        const safeLocation = typeof location === "string" ? location : "";

        if (searchKeyword && searchKeyword.trim() !== "") {
          // 🧠 AI Smart Search - uses role tagging, query expansion, and scoring
          const smartParams = new URLSearchParams({ q: searchKeyword });
          // Removed classification filtering to show all jobs
          if (safeLocation) smartParams.append("location", safeLocation);

          const smartRes = await fetch(
            `${API_BASE_URL}/api/ai/smart-search?${smartParams.toString()}`,
            {
              headers: {
                "ngrok-skip-browser-warning": "69420",
              },
              signal: abortController.signal,
            },
          );

          console.log(
            `🧠 [AllJobs] Smart Search API Status: ${smartRes.status} for query: "${searchKeyword}"`,
          );

          if (!smartRes.ok) {
            throw new Error(`Smart Search error: ${smartRes.status}`);
          }

          const smartData = await smartRes.json();
          if (abortController.signal.aborted) return;

          jobsList = smartData.data || [];
          console.log(
            `✅ [AllJobs] Smart Search returned ${jobsList.length} jobs. Expanded tags: ${(smartData.expandedTags || []).join(", ")}`,
          );
        } else {
          // Regular fetch when no search keyword
          const queryParams = new URLSearchParams({
            limit: "100",
            ...(location && { location: location })
          });

          const jobsRes = await fetch(
            `${API_BASE_URL}/api/jobs?${queryParams.toString()}`,
            {
              headers: {
                "ngrok-skip-browser-warning": "69420",
              },
              signal: abortController.signal,
            },
          );

          console.log(`🌐 [AllJobs] Jobs API Status: ${jobsRes.status}`);

          if (!jobsRes.ok) {
            const errorText = await jobsRes.text();
            console.error(`❌ [AllJobs] Jobs API Error Detail:`, errorText);
            throw new Error(
              `Server returned ${jobsRes.status}: ${jobsRes.statusText}`,
            );
          }

          const jobsData = await jobsRes.json();
          if (abortController.signal.aborted) return;

          jobsList =
            jobsData && jobsData.data
              ? jobsData.data
              : Array.isArray(jobsData)
                ? jobsData
                : [];
        }

        console.log(`✅ [AllJobs] Received ${jobsList.length} jobs.`);


        const mappedJobs = jobsList.map(j => {
          const rawJob = j as any;
          const rawType = rawJob.JobType || rawJob.jobType;
          return {
            ...rawJob,
            jobId: rawJob.Id || rawJob.id || rawJob.JobId || rawJob.jobId,
            title: rawJob.Title || rawJob.title,
            description: rawJob.Description || rawJob.description,
            address: rawJob.Address || rawJob.address,
            jobType: Array.isArray(rawType) ? rawType[0] : rawType,
            classification: rawJob.Classification || rawJob.classification || "job_seeker",
            slotsAvailable: rawJob.SlotsAvailable !== undefined ? rawJob.SlotsAvailable : rawJob.slotsAvailable,
            appliedCount: rawJob.AppliedCount !== undefined ? rawJob.AppliedCount : rawJob.appliedCount,
            salary: rawJob.Salary !== undefined ? rawJob.Salary : rawJob.salary,
            salaryMin: rawJob.SalaryMin !== undefined ? rawJob.SalaryMin : rawJob.salaryMin,
            salaryMax: rawJob.SalaryMax !== undefined ? rawJob.SalaryMax : rawJob.salaryMax,
            createdAt: rawJob.CreatedAt || rawJob.createdAt,
            expiresAt: rawJob.ExpiresAt || rawJob.expiresAt,
            categoryId: rawJob.CategoryId || rawJob.categoryId,
            category: rawJob.Category || rawJob.category || { name: rawJob.CategoryName || rawJob.categoryName },
            user: (rawJob.User || rawJob.user || rawJob.UserFullName || rawJob.userFullName) ? {
              avatarUrl: rawJob.UserAvatarUrl || rawJob.userAvatarUrl,
              fullName: rawJob.UserFullName || rawJob.userFullName
            } : null,
            images: rawJob.Images || rawJob.images || [],
            company: rawJob.Company ? {
              name: rawJob.Company.Name || rawJob.Company.name,
              address: rawJob.Company.Address || rawJob.Company.address,
              logoUrl: rawJob.Company.LogoUrl || rawJob.Company.logoUrl || rawJob.Company.logo_url
            } : rawJob.company || { 
              name: rawJob.CompanyName || rawJob.companyName || "Jobito",
              logoUrl: rawJob.CompanyLogoUrl || rawJob.companyLogoUrl 
            }
          };
        });

        setJobs(mappedJobs);

        // Fetch Favorites
        if (isAuthenticated) {
          try {
            const favsRes = await apiFetch(`${API_BASE_URL}/api/favorites`, {
              signal: abortController.signal,
            });

            if (favsRes.ok && !abortController.signal.aborted) {
              const favIds = await favsRes.json();
              if (Array.isArray(favIds)) {
                const favMap: Record<string, boolean> = {};
                favIds.forEach((id) => {
                  if (id) favMap[id.toString()] = true;
                });
                setLikedJobs(favMap);
              }
            }
          } catch (favErr) {
            if (favErr instanceof Error && favErr.name === "AbortError") return;
            console.error("❌ [AllJobs] Error fetching favorites:", favErr);
          }
        }

        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          console.log("⏹️ [AllJobs] Fetch aborted by cleanup.");
          return;
        }
        console.error("❌ [AllJobs] CRITICAL Error fetching data:", err);
        setError(
          `${t("فشل في تحميل البيانات")}: ${err instanceof Error ? err.message : t("خطأ غير معروف")}`,
        );
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
          fetchInProgress.current = false;
        }
      }
    };

    fetchData();

    return () => {
      // Cancel pending request on unmount or dependency change
      console.log(
        `🚮 [AllJobs] [Render ${currentRender}] Cleaning up effect...`,
      );
      abortController.abort();
      fetchInProgress.current = false;
    };
  }, [searchKeyword, location, isAuthenticated, apiFetch]);

  const toggleLike = async (
    e: React.MouseEvent,
    jobId: string | number | undefined,
  ) => {
    e.stopPropagation();
    if (!jobId) return;

    const token =
      localStorage.getItem("access_token") || localStorage.getItem("token");
    if (!token) {
      showToast(t("يرجى تسجيل الدخول لحفظ الوظائف المفضلة."), "error");
      return;
    }

    try {
      const res = await apiFetch(`${API_BASE_URL}/api/favorites/toggle/${jobId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const result = await res.json();
        setLikedJobs((prev) => ({
          ...prev,
          [jobId.toString()]: result.isFavorite,
        }));
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const getJobLevel = (job: Job) => {
    // 1. Differentiate between Company Services and Individual Tradesmen
    if (!!job.user) return "tradesman";

    const jc = (job.classification || "").trim();
    if (jc === "خدمات" || jc === "services" || jc === "Services") return "services";

    // 2. Explicit classification field fallbacks (Exact Match First)
    if (jc === "غير تقني") return "غير تقني";
    if (jc === "تقني") return "تقني";
    if (jc === "tradesman" || jc === "tradesman_work") return "tradesman";

    const text = (job.title + " " + (job.description || "")).toLowerCase();

    // 3. Fallback: Check for explicit Classification tags in text (Check Non-Technical first!)
    if (text.includes("التصنيف: غير تقني") || text.includes("غير تقني")) return "غير تقني";
    if (text.includes("التصنيف: تقني") || text.includes("تقني")) return "تقني";

    if (text.includes("director") || text.includes("مدير")) return "مدير";
    if (text.includes("senior") || text.includes("خبير")) return "خبير";
    if (text.includes("mid") || text.includes("متوسط")) return "متوسط الخبرة";
    if (text.includes("vp") || text.includes("نائب")) return "نائب رئيس وأعلى";
    return "مبتدئ";
  };

  const getSalaryRange = (job: Job) => {
    const s = job.salary || job.salaryMin || 0;
    if (s >= 3000) return "٣٠٠٠$ أو أكثر";
    if (s >= 1500) return "١٥٠٠$ - ٢٠٠٠$";
    if (s >= 1000) return "١٠٠٠$ - ١٥٠٠$";
    if (s >= 700) return "٧٠٠$ - ١٠٠٠$";
    return null;
  };

  const filteredJobs = jobs.filter((job, index) => {
    const keywordLower = searchKeyword.toLowerCase();
    const keywordMatch =
      !searchKeyword ||
      job.title?.toLowerCase().includes(keywordLower) ||
      job.company?.name?.toLowerCase().includes(keywordLower);

    const locationMatch =
      !location || job.address?.toLowerCase().includes(location.toLowerCase());

    const typeMatch =
      selectedTypes.length === 0 ||
      selectedTypes.some((t) => {
        const jt = (job.jobType || "").toLowerCase();
        // Use standard English keys for reliable filtering
        if (t === "full-time") return jt === "full-time";
        if (t === "part-time") return jt === "part-time";
        if (t === "remote") return jt === "remote";
        if (t === "internship") return jt === "internship" || jt === "intern";
        if (t === "contract") return jt === "contract";
        if (t === "freelance") return jt === "freelance";
        if (t === "one-time") return jt === "one-time";

        return jt.includes(t.toLowerCase());
      });

    const categoryMatch =
      selectedCategories.length === 0 ||
      selectedCategories.some((cat) => {
        const cn = (job.category?.name || "").toLowerCase();
        const cid = job.categoryId;

        // Use standard keys for filtering
        if (cat === "design") return cn.includes("design") || cid === 16;
        if (cat === "sales") return cn.includes("sales") || cid === 15;
        if (cat === "marketing") return cn.includes("marketing") || cid === 14;
        if (cat === "business") return cn.includes("business");
        if (cat === "hr") return cn.includes("hr") || cid === 3;
        if (cat === "finance") return cn.includes("finance") || cid === 13;
        if (cat === "engineering") return cn.includes("engineering") || cid === 11;
        if (cat === "technology") return cn.includes("technology") || cid === 12;

        return cn.includes(cat.toLowerCase());
      });

    const levelMatch =
      selectedLevels.length === 0 || selectedLevels.includes(getJobLevel(job));

    const salaryMatch =
      selectedSalaries.length === 0 ||
      selectedSalaries.includes(getSalaryRange(job) || "");

    const result =
      keywordMatch &&
      locationMatch &&
      typeMatch &&
      categoryMatch &&
      levelMatch &&
      salaryMatch;
    if (index === 0)
      console.log(`🔍 [AllJobs] Filter Debug: Job[0] match=${result}`, {
        keywordMatch,
        locationMatch,
        typeMatch,
        categoryMatch,
        levelMatch,
        salaryMatch,
      });
    return result;
  });

  console.log(
    `📊 [AllJobs] Displaying ${filteredJobs.length} jobs out of ${jobs.length} total.`,
  );

  const displayJobs = filteredJobs;
  const totalItems = displayJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / jobsPerPage));
  const adjustedPage = Math.min(currentPage, totalPages);

  const currentJobs = displayJobs.slice(
    (adjustedPage - 1) * jobsPerPage,
    adjustedPage * jobsPerPage,
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={styles.jobsPage}>
      {classification !== "tradesman" && (
        <motion.aside
          className={styles.sidebar}
          variants={sidebarVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Category Filter including Tradesman items */}
          <Filter
            title={t("نوع التوظيف")}
            items={[
              { name: "دوام كامل", count: jobs.filter((j) => (j.jobType || "").toLowerCase() === "full-time").length, value: "full-time" },
              { name: "دوام جزئي", count: jobs.filter((j) => (j.jobType || "").toLowerCase() === "part-time").length, value: "part-time" },
              { name: "عن بعد", count: jobs.filter((j) => (j.jobType || "").toLowerCase() === "remote").length, value: "remote" },
              { name: "تدريب", count: jobs.filter((j) => (j.jobType || "").toLowerCase() === "internship").length, value: "internship" },
              { name: "عقد", count: jobs.filter((j) => (j.jobType || "").toLowerCase() === "contract").length, value: "contract" },

            ]}
            selected={selectedTypes}
            setSelected={setSelectedTypes}
          />

          <Filter
            title={t("التصنيفات")}
            items={[
              { name: t("تقني"), count: jobs.filter((j) => getJobLevel(j) === "تقني").length, value: "تقني" },
              { name: t("غير تقني"), count: jobs.filter((j) => getJobLevel(j) === "غير تقني").length, value: "غير تقني" },
              { name: "Services", count: jobs.filter((j) => getJobLevel(j) === "services").length, value: "services" },
              { name: "tradesman", count: jobs.filter((j) => getJobLevel(j) === "tradesman").length, value: "tradesman" },
            ]}
            selected={selectedLevels}
            setSelected={setSelectedLevels}
          />

          <Filter
            title={t("نطاق الراتب")}
            items={[
              {
                name: "٧٠٠$ - ١٠٠٠$",
                count: jobs.filter((j) => getSalaryRange(j) === "٧٠٠$ - ١٠٠٠$")
                  .length,
              },
              {
                name: "١٠٠٠$ - ١٥٠٠$",
                count: jobs.filter((j) => getSalaryRange(j) === "١٠٠٠$ - ١٥٠٠$")
                  .length,
              },
              {
                name: "١٥٠٠$ - ٢٠٠٠$",
                count: jobs.filter((j) => getSalaryRange(j) === "١٥٠٠$ - ٢٠٠٠$")
                  .length,
              },
              {
                name: "٣٠٠٠$ أو أكثر",
                count: jobs.filter((j) => getSalaryRange(j) === "٣٠٠٠$ أو أكثر")
                  .length,
              },
            ]}
            selected={selectedSalaries}
            setSelected={setSelectedSalaries}
          />
        </motion.aside>
      )}

      <main className={styles.jobsContent}>
        {error && <div className={styles.apiStatus}>⚠️ {error}</div>}

        <div className={styles.jobsHeader}>
          <div>
            <h2>{t("جميع الوظائف")}</h2>

            <p>{t("عرض")} {filteredJobs.length} {t("نتائج")}</p>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.sort}>
              {t("ترتيب حسب:")}:
              <select
                defaultValue="Newest"
                onChange={(e) => {
                  const sortType = e.target.value;
                  const sorted = [...jobs].sort((a, b) => {
                    if (sortType === "Newest")
                      return (
                        new Date(b.createdAt || 0).getTime() -
                        new Date(a.createdAt || 0).getTime()
                      );
                    if (sortType === "Oldest")
                      return (
                        new Date(a.createdAt || 0).getTime() -
                        new Date(b.createdAt || 0).getTime()
                      );
                    return 0;
                  });
                  setJobs(sorted);
                }}
              >
                <option value="Newest">{t("الأحدث")}</option>
                <option value="Oldest">{t("الأقدم")}</option>
              </select>
            </div>
            <div className={styles.viewToggles}>
              <button
                className={`${styles.toggleBtn} ${view === "grid" ? styles.active : ""}`}
                onClick={() => setView("grid")}
              >
                <FiGrid size={20} />
              </button>
              <button
                className={`${styles.toggleBtn} ${view === "list" ? styles.active : ""}`}
                onClick={() => setView("list")}
              >
                <FiList size={20} />
              </button>
            </div>
          </div>
        </div>

        <div
          className={`${styles.list} ${view === "grid" ? styles.gridView : ""}`}
        >
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className={styles.loading}>{t("جاري التحميل...")}</div>
            ) : currentJobs.length === 0 ? (
              <div className={styles.loading}>{t("لم يتم العثور على وظائف.")}</div>
            ) : (
              currentJobs.map((job, index) => (
                <motion.div
                  key={job.jobId || `job-${index}`}
                  className={view === "grid" ? styles.jobCard : styles.jobRow}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  layout
                  onClick={() =>
                    navigate("/Job details", { state: { jobId: job.jobId } })
                  }
                >
                  {view === "list" ? (

                    <div className={styles.jobRowContent}>
                      {/* Determine if it's a Tradesman/Service job */}
                      {!!job.user ? (
                        /* --- TRADESMAN LIST VIEW (As per image) --- */
                        <>
                          <div className={styles.jobRowLeft}>
                            <div className={styles.tradesmanAvatarCircle}>
                              <img
                                src={getFullImageUrl(
                                  job.user?.avatarUrl,
                                  job.user?.fullName || job.jobId?.toString(),
                                  job
                                )}
                                alt={t("Avatar")}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${job.jobId}`;
                                }}
                              />
                            </div>
                            <div className={styles.jobInfoColumn}>
                              <h3 className={styles.tradesmanJobTitle}>{t(job.title)}</h3>
                              <div className={styles.jobRowMeta}>
                                <span className={styles.locationNameText}>
                                  {t(job.company?.name || job.user?.fullName || "Provider")} • {t(job.address || "Paris, France")}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className={styles.jobRatingMiddle}>
                            <span className={styles.starIconSmall}>★</span>
                            <span className={styles.ratingValueText}>
                              {(3.5 + ((typeof job.jobId === 'number' ? job.jobId : 0) % 15) * 0.1).toFixed(2)}
                            </span>

                          </div>

                          <div className={styles.jobRowRight}>
                            <button
                              className={styles.premiumApplyBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate("/Job details", {
                                  state: { jobId: job.jobId },
                                });
                              }}
                            >
                              {t("Apply")}
                            </button>
                          </div>
                        </>
                      ) : (
                        /* --- COMPANY LIST VIEW (As previously designed) --- */
                        <>
                          <div className={styles.jobRowLeft}>
                            <div className={styles.jobLogoContainer}>
                              <img
                                src={getFullImageUrl(
                                  job.company?.logoUrl,
                                  job.company?.name || job.jobId?.toString(),
                                  job
                                )}
                                alt={t("Logo")}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${job.company?.name || job.jobId}`;
                                }}
                              />
                            </div>
                            <div className={styles.jobInfoColumn}>
                              <h3 className={styles.jobTitleText}>{t(job.title)}</h3>
                              <div className={styles.jobRowMeta}>
                                <span className={styles.companyNameText}>{t(job.company?.name || "Nomad")}</span>
                                <span className={styles.metaCircle}>•</span>
                                <span className={styles.locationNameText}>{t(job.address || "Paris, France")}</span>
                              </div>
                              <div className={styles.jobRowTags}>
                                <span className={styles.typePill}>
                                  {job.jobType === "full-time" ? t("Full-Time") : t(job.jobType)}
                                </span>
                                <div className={styles.verticalDivider}></div>
                                <span className={styles.catPillPrimary}>
                                  {t(job.category?.name || "Marketing")}
                                </span>
                                <span className={styles.catPillSecondary}>
                                  {t("Design")}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className={styles.jobRowRight}>
                            <button
                              className={styles.premiumApplyBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate("/Job details", {
                                  state: { jobId: job.jobId },
                                });
                              }}
                            >
                              {t("Apply")}
                            </button>
                            <div className={styles.capacityWrapper}>
                              <div className={styles.capacityBar}>
                                <div
                                  className={styles.capacityFill}
                                  style={{ width: `${Math.min(((job.appliedCount || job.applications?.length || 0) / (job.slotsAvailable || 10)) * 100, 100)}%` }}
                                ></div>
                              </div>
                              <span className={styles.capacityLabel}>
                                {job.appliedCount || job.applications?.length || 0} of {job.slotsAvailable || 10} capacity
                              </span>

                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* --- GRID VIEW --- */}
                      <div className={styles.cardHeader}>
                        <div className={styles.cardLogo}>
                          <img
                            src={getFullImageUrl(
                              job.company?.logoUrl,
                              job.company?.name || job.jobId?.toString(),
                              job
                            )}
                            alt={t("Logo")}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${job.company?.name || job.jobId}`;
                            }}
                          />
                        </div>
                        <div
                          className={`${styles.like} ${job.jobId && likedJobs[job.jobId.toString()] ? styles.liked : ""}`}
                          onClick={(e) => toggleLike(e, job.jobId)}
                        >
                          {job.jobId && likedJobs[job.jobId.toString()] ? (
                            <FaHeart size={22} />
                          ) : (
                            <FaRegHeart size={22} />
                          )}
                        </div>
                      </div>
                      <div className={styles.cardBody}>
                        <h3>{t(job.title || "عنوان الوظيفة")}</h3>
                        <p
                          style={{
                            fontWeight: "bold",
                            fontSize: "0.9rem",
                            color: "#6b7280",
                            marginBottom: "8px",
                          }}
                        >
                          {t(job.company?.name || "جوبيتو")}
                        </p>
                        <p className={styles.cardDesc}>
                          {job.description
                            ? job.description.length > 80
                              ? t(job.description.substring(0, 80)) + "..."
                              : t(job.description)
                            : t("لا يوجد وصف لهذه الوظيفة حالياً.")}
                        </p>
                      </div>
                      <div className={styles.cardFooter}>
                        <span className={`${styles.tag} ${styles.fulltime}`}>
                          {job.jobType === "full-time"
                            ? t("دوام كامل")
                            : job.jobType === "part-time"
                              ? t("دوام جزئي")
                              : job.jobType === "remote"
                                ? t("عن بعد")
                                : job.jobType === "internship"
                                  ? t("تدريب")
                                  : job.jobType === "contract"
                                    ? t("عقد")
                                    : job.jobType}
                        </span>
                        {job.address && (
                          <span
                            className={`${styles.tag} ${styles.tagBusiness}`}
                          >
                            {t(job.address)}
                          </span>
                        )}
                      </div>
                      <div className={styles.cardAction}>
                        <div className={styles.statusContainerGrid}>
                          <span className={styles.appliedBadge}>
                            <strong>
                              {job.applications?.length ||
                                job.appliedCount ||
                                0}
                            </strong>{" "}
                            {t("المتقدمين")}
                          </span>
                        </div>
                        <button
                          className={styles.applyBtnGrid}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isAuthenticated) {
                              navigate("/user-information");
                            } else {
                              navigate("/Job details", {
                                state: { jobId: job.jobId },
                              });
                            }
                          }}
                        >
                          {t("تقدم")}
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.navBtn}
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <FiChevronRight />
            </button>

            {Array.from({ length: totalPages }).map((_, index) => {
              const pageNumber = index + 1;
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNumber}
                    className={`${styles.pageBtn} ${currentPage === pageNumber ? styles.active : ""}`}
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              } else if (
                pageNumber === currentPage - 2 ||
                pageNumber === currentPage + 2
              ) {
                return (
                  <span key={pageNumber} className={styles.pageBtn}>
                    ...
                  </span>
                );
              }
              return null;
            })}

            <button
              className={styles.navBtn}
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <FiChevronLeft />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

interface FilterItem {
  name: string;
  count: number;
  value?: string;
}
interface FilterProps {
  title: string;
  items: FilterItem[];
  selected: string[];
  setSelected: (items: string[]) => void;
}

const Filter: React.FC<FilterProps> = ({
  title,
  items,
  selected,
  setSelected,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useTranslation();
  const toggleItem = (name: string) =>
    selected.includes(name)
      ? setSelected(selected.filter((i) => i !== name))
      : setSelected([...selected, name]);

  return (
    <div className={styles.filter}>
      <div className={styles.filterHeader} onClick={() => setIsOpen(!isOpen)}>
        <h4>{title}</h4>
        <span className={styles.chevron}>
          {isOpen ? <FiChevronUp /> : <FiChevronDown />}
        </span>
      </div>
      {isOpen && (
        <div className={styles.filterList}>
          {items.map((item) => {
            const itemValue = item.value || item.name;
            const isChecked = selected.includes(itemValue);
            return (
              <div 
                key={item.name} 
                className={`${styles.filterRow} ${isChecked ? styles.rowActive : ""}`}
                onClick={() => toggleItem(itemValue)}
              >
                <div className={styles.checkboxStyled}>
                   {isChecked && <span className={styles.checkMark}>✓</span>}
                </div>
                <span className={styles.filterText}>
                   {t(item.name)}
                </span>
                <span className={styles.filterCount}>({item.count})</span>
              </div>

            );
          })}
        </div>
      )}
    </div>
  );
};

export default AllJobs;
