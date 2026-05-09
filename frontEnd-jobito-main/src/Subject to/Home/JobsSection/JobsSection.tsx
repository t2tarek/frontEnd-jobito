import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import styles from "./JobsSection.module.css";
import { useTranslation } from "../../../context/translation-context";
import { useJobitoAuth } from "../../../context/LinkContxt";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5200";

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

  // Priority 4: Fallback based on default identicon
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${seed || 'company'}`;
};

interface Job {
  jobId: string | number;
  title: string;
  titleEn?: string;
  company?: {
    name: string;
    nameEn?: string;
    logo?: string;
    logoUrl?: string;
  };
  address: string;
  jobType: string;
  salary?: number | string;
  category?: { name: string };
  categoryId?: number;
  rating?: number;
  user?: {
    avatarUrl?: string;
    name?: string;
  };
  images?: string[];
}

/* ═══════════════════════════════════════
   COMPANY CARD — Horizontal row
   ═══════════════════════════════════════ */
const CompanyJobCard: React.FC<{ job: Job; variants: Variants }> = ({ job, variants }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/Job details", { state: { jobId: job.jobId } });
    window.scrollTo(0, 0);
  };


  const jobTypeLabel =
    job.jobType === "Full Time" ? t("دوام كامل") :
    job.jobType === "Part Time" ? t("دوام جزئي") :
    job.jobType === "Contract" ? t("عقد") :
    job.jobType === "Internship" ? t("تدريب") :
    t("دوام كامل");

  return (
    <motion.div variants={variants} whileHover={{ y: -5, transition: { duration: 0.3 } }}>
      <div onClick={handleCardClick} className={styles.companyCard} style={{ cursor: 'pointer' }}>

        <div className={styles.cardHeader}>
          <div className={styles.companyLogo}>
            <img
              src={getFullImageUrl(
                job.company?.logoUrl || job.company?.logo,
                job.company?.name || job.jobId?.toString(),
                job
              )}
              alt={job.company?.name || "Company"}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  `https://api.dicebear.com/7.x/identicon/svg?seed=${job.company?.name || job.jobId}`;
              }}
            />
          </div>
          <div className={styles.jobTypeBadge}>
            {jobTypeLabel}
          </div>
        </div>

        <div className={styles.cardBody}>
          <h3 className={styles.jobTitle}>{job.title}</h3>
          <p className={styles.companyMeta}>
            {t(job.company?.name || "Jobito")} • {t(job.address)}
          </p>
        </div>

        <div className={styles.cardTags}>
          {job.category?.name && (
            <span className={`${styles.pill} ${styles[job.category.name.toLowerCase()] || styles.defaultPill}`}>
              {t(job.category.name)}
            </span>
          )}
          {/* Mock extra tag to match image aesthetics if only one cat provided */}
          {!job.category?.name && <span className={`${styles.pill} ${styles.defaultPill}`}>{t("General")}</span>}
        </div>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════
   TRADESMAN CARD — Horizontal row
   ═══════════════════════════════════════ */
const TradesmanJobCard: React.FC<{ job: Job; variants: Variants }> = ({ job, variants }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/Job details", { state: { jobId: job.jobId } });
    window.scrollTo(0, 0);
  };


  // Generate a pseudo-random rating between 3.5–5.0 for display
  const displayRating = job.rating || 
    (3.5 + ((typeof job.jobId === 'number' ? job.jobId : parseInt(String(job.jobId), 10) || 0) % 15) * 0.1).toFixed(2);

  return (
    <motion.div variants={variants} whileHover={{ y: -5, transition: { duration: 0.3 } }}>
      <div onClick={handleCardClick} className={styles.tradesmanCard} style={{ cursor: 'pointer' }}>

        <div className={styles.cardHeader}>
          <div className={styles.tradesmanAvatar}>
            <img
              src={getFullImageUrl(
                job.user?.avatarUrl || job.company?.logoUrl || job.company?.logo,
                job.jobId?.toString(),
                job
              )}
              alt={job.user?.name || job.title}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${job.jobId}`;
              }}
            />
          </div>
          <div className={styles.jobTypeBadge}>
            {t("Freelance")}
          </div>
        </div>

        <div className={styles.cardBody}>
          <h3 className={styles.jobTitle}>{job.title}</h3>
          <p className={styles.companyMeta}>
            {t(job.company?.name || job.user?.name || "Provider")} • {t(job.address)}
          </p>
        </div>

        <div className={styles.cardTags}>
           <div className={styles.tradesmanRating}>
            <span className={styles.ratingStar}>★</span>
            <span className={styles.ratingValue}>{displayRating}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════
   MAIN SECTION
   ═══════════════════════════════════════ */
const JobsSection = () => {
  const { t } = useTranslation();
  const { user } = useJobitoAuth();
  const classification = user?.classification;
  const isTradesman = classification === "tradesman";
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/jobs?_t=${Date.now()}`);
        if (!response.ok) throw new Error("Failed to fetch jobs");
        
        const result = await response.json();
        const jobsData = result.data || (Array.isArray(result) ? result : []);
        
        // Map backend fields (PascalCase) to frontend fields (camelCase)
        const mappedJobs = jobsData.map((j: any) => {
          const rawType = j.JobType || j.jobType;
          return {
            ...j,
            jobId: j.Id || j.id || j.JobId || j.jobId,
            title: j.Title || j.title,
            address: j.Address || j.address,
            jobType: Array.isArray(rawType) ? rawType[0] : rawType,
            salary: j.Salary !== undefined ? j.Salary : j.salary,
            categoryId: j.CategoryId || j.categoryId,
            category: j.Category || j.category || { name: j.CategoryName || j.categoryName },
            user: j.User || j.user,
            images: j.Images || j.images || [],
            company: j.Company ? {
              name: j.Company.Name || j.Company.name,
              address: j.Company.Address || j.Company.address,
              logoUrl: j.Company.LogoUrl || j.Company.logoUrl || j.Company.logo_url
            } : j.company || { name: j.CompanyName || j.companyName || "Jobito" }
          };
        });

        setJobs(mappedJobs.slice(0, 8)); 
        setError(null);
      } catch (err) {
        console.error("Error loading jobs:", err);
        setError("حدث خطأ في تحميل الوظائف");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [isTradesman]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  return (
    <motion.div 
      className={styles.jobsContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ margin: "-50px" }}
      variants={containerVariants}
    >
      <motion.div className={styles.sectionHeader} variants={cardVariants}>
        <h2>
          {t("jobs")} <span>{t("Featured")}</span>
        </h2>
        <Link to="/find-jobs" className={styles.showAllLink}>
          {t("Show all jobs")} →
        </Link>
      </motion.div>

      {isLoading ? (
        <div className={styles.loader}>{t("جاري التحميل...")}</div>
      ) : error ? (
        <div className={styles.error}>{t(error)}</div>
      ) : (
        <motion.div className={styles.featuredGrid} variants={containerVariants}>
          {jobs.map((job) =>
            isTradesman ? (
              <TradesmanJobCard key={job.jobId} job={job} variants={cardVariants} />
            ) : (
              <CompanyJobCard key={job.jobId} job={job} variants={cardVariants} />
            )
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default JobsSection;
