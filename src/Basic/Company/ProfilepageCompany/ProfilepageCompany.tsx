import React, { useEffect, useState } from "react";
import styles from "./ProfilepageCompany.module.css";
import { useJobitoAuth } from "../../../context/LinkContxt";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "../../../context/translation-context";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5200";

const getFullImageUrl = (url?: string, seed?: string) => {
  if (!url)
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${seed || "company"}`;
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

const GlobeAltIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const UserGroupIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const LocationMarkerIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

interface Benefit {
  title: string;
  description: string;
}

interface CompanyData {
  companyId: number;
  name: string;
  description: string;
  address: string;
  contactEmail: string;
  website?: string;
  industry?: string;
  employees?: string;
  foundedDay?: string;
  foundedMonth?: string;
  foundedYear?: string;
  foundedDate?: string;
  logoUrl?: string;
  socialLinks?: Record<string, string>;
  benefits?: Benefit[];
  techStack?: string[];
  locationTags?: string[];
  jobs: any[];
}

export default function ProfilepageCompany() {
  const { user, apiFetch } = useJobitoAuth();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t, language } = useTranslation();

  const isReadOnly = !!id;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const endpoint = id
          ? `${API_BASE_URL}/api/companies/${id}`
          : `${API_BASE_URL}/api/companies/my/profile`;

        const res = await apiFetch(endpoint);
        if (res.ok) {
          const rawData = await res.json();
          const companyData: CompanyData = {
            ...rawData,
            companyId: Number(rawData.Id || rawData.id || rawData.companyId || rawData.company_id),
            name: rawData.Name || rawData.name,
            description: rawData.Description || rawData.description,
            address: rawData.Address || rawData.address,
            contactEmail: rawData.ContactEmail || rawData.contactEmail || rawData.contact_email,
            website: rawData.Website || rawData.website,
            industry: rawData.Industry || rawData.industry,
            employees: rawData.Employees || rawData.employees,
            logoUrl: rawData.LogoUrl || rawData.logoUrl || rawData.logo_url,
            socialLinks: rawData.SocialLinks || rawData.socialLinks,
            benefits: rawData.Benefits || rawData.benefits,
            techStack: rawData.TechStack || rawData.techStack,
            locationTags: rawData.LocationTags || rawData.locationTags,
            verificationStatus: rawData.VerificationStatus || rawData.verificationStatus || rawData.verification_status,
            foundedYear: rawData.EstablishedYear || rawData.establishedYear || rawData.FoundedYear || rawData.foundedYear,
            foundedMonth: rawData.FoundedMonth || rawData.foundedMonth,
            foundedDay: rawData.FoundedDay || rawData.foundedDay,
            jobs: rawData.Jobs || rawData.jobs || []
          };

          // Only fetch jobs if the profile response didn't include them
          if (!companyData.jobs || companyData.jobs.length === 0) {
            try {
              const jobsRes = await apiFetch(`${API_BASE_URL}/api/jobs`);
              if (jobsRes.ok) {
                const jobsResult = await jobsRes.json();
                const allJobs =
                  jobsResult.data ||
                  (Array.isArray(jobsResult) ? jobsResult : []);
                companyData.jobs = allJobs.filter(
                  (j: any) =>
                    Number(j.companyId || j.company_id) ===
                      Number(companyData.companyId) ||
                    (j.company?.name || j.company_name) === companyData.name,
                );
              }
            } catch (e) {
              console.error("Failed to fetch jobs fallback", e);
            }
          }

          if (
            companyData.foundedDay &&
            companyData.foundedMonth &&
            companyData.foundedYear
          ) {
            companyData.foundedDate = `${companyData.foundedMonth} ${companyData.foundedDay}, ${companyData.foundedYear}`;
          }

          setCompany(companyData);
        }
      } catch (err) {
        console.error("Error fetching company profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();

    window.addEventListener("jobito-profile-updated", fetchProfile);
    return () => {
      window.removeEventListener("jobito-profile-updated", fetchProfile);
    };
  }, [apiFetch, id]);

  if (loading)
    return <div className={styles.loading}>{t("جاري تحميل الملف الشخصي...")}</div>;

  const companyName =
    t(company?.name || "") || t(user?.companyName || "") || t(user?.name || "") || t("اسم الشركة");
  const companyEmail = company?.contactEmail || user?.email || "";
  const companyLogo = company?.logoUrl || user?.avatarUrl || user?.avatar;
  const companyDesc = t(company?.description || "") || t("لا يوجد وصف للشركة حتى الآن.");

  const displayLocation =
    t(company?.address || "") ||
    (Array.isArray(company?.locationTags) && company.locationTags.length > 0
      ? t(company.locationTags[0])
      : t("عالمي"));

  return (
    <div className={styles.pageContainer} dir="ltr">
      {/* Header Section */}
      <section className={styles.headerSection}>
        <div className={styles.headerContent}>
          <div className={styles.topInfo}>
            <div className={styles.logoAndInfo}>
              <div className={styles.mainLogo}>
                <img
                  src={getFullImageUrl(companyLogo, companyName)}
                  alt={companyName}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `https://api.dicebear.com/7.x/identicon/svg?seed=${companyName}`;
                  }}
                />
              </div>
              <div className={styles.basicMeta}>
                <h1 className={styles.companyName}>{companyName}</h1>
                <a
                  href={company?.website || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.websiteLink}
                >
                  {company?.website || ""}
                </a>
              </div>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <div className={styles.statIcon}>
                  <CalendarIcon />
                </div>
                <div className={styles.statText}>
                  <span className={styles.statLabel}>{t("تاريخ التأسيس")}</span>
                  <span className={styles.statValue}>
                    {t(company?.foundedDate || "") || t("31 يوليو، 2011")}
                  </span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIcon}>
                  <UserGroupIcon />
                </div>
                <div className={styles.statText}>
                  <span className={styles.statLabel}>{t("عدد الموظفين")}</span>
                  <span className={styles.statValue}>
                    {t(company?.employees || "") || t("+100")}
                  </span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIcon}>
                  <LocationMarkerIcon />
                </div>
                <div className={styles.statText}>
                  <span className={styles.statLabel}>{t("الموقع")}</span>
                  <span className={styles.statValue}>{displayLocation}</span>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIcon}>
                  <GlobeAltIcon />
                </div>
                <div className={styles.statText}>
                  <span className={styles.statLabel}>{t("مجال العمل")}</span>
                  <span className={styles.statValue}>
                    {t(company?.industry || "") || t("التكنولوجيا")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {!isReadOnly && (
            <div className={styles.headerActions}>
              <button
                className={styles.primaryBtn}
                onClick={() => navigate("/ProfileSettings")}
              >
                {t("إعدادات الملف الشخصي")}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className={styles.contentGrid}>
        {/* Company Profile */}
        <section>
          <div className={styles.sectionHeading}>
            <h2>{t("ملف الشركة")}</h2>
          </div>
          <div className={styles.descriptionText}>
            <p>{companyDesc}</p>
          </div>
        </section>

        {/* Contact info */}
        <section>
          <div className={styles.sectionHeading}>
            <h2>{t("التواصل")}</h2>
          </div>
          <div className={styles.contactChips}>
            {(() => {
              let links: any = company?.socialLinks || {};
              if (typeof links === "string")
                try {
                  links = JSON.parse(links);
                } catch (e) {
                  links = {};
                }
              return (
                <>
                  <a href={links.twitter || "#"} className={styles.contactChip}>
                    <TwitterIcon />{" "}
                    {t(links.twitter?.split("/").pop() || "twitter.com/nomad")}
                  </a>
                  <a
                    href={links.facebook || "#"}
                    className={styles.contactChip}
                  >
                    <FacebookIcon />{" "}
                    {t(links.facebook?.split("/").pop() || "facebook.com/NomadHQ")}
                  </a>
                  <a
                    href={links.linkedin || "#"}
                    className={styles.contactChip}
                  >
                    <LinkedInIcon />{" "}
                    {t(links.linkedin?.split("/").pop() || "linkedin.com/company/nomad")}
                  </a>
                  <a
                    href={`mailto:${companyEmail}`}
                    className={styles.contactChip}
                  >
                    <MailIcon /> {companyEmail || "nomad@gmail.com"}
                  </a>
                </>
              );
            })()}
          </div>
        </section>

        {/* Benefits Section */}
        <section>
          <div className={styles.sectionHeading}>
            <h2>{t("المميزات")}</h2>
          </div>
          <div className={styles.benefitsGrid}>
            {(() => {
              let benefits: any[] = company?.benefits || [];
              if (typeof benefits === "string")
                try {
                  benefits = JSON.parse(benefits);
                } catch (e) {
                  benefits = [];
                }
              if (benefits.length === 0) {
                return [
                  {
                    title: t("رعاية صحية كاملة"),
                    desc: t("نحن نؤمن بأن الفريق السعيد والصحي هو أساس التقدم والازدهار."),
                  },
                  {
                    title: t("إجازات غير محدودة"),
                    desc: t("نمنحك المرونة الكافية للموازنة بين حياتك الشخصية والعملية."),
                  },
                  {
                    title: t("تطوير المهارات"),
                    desc: t("ندعمك دائماً للتعلم والارتقاء بمهاراتك من خلال الدورات والمؤتمرات."),
                  },
                ].map((b, i) => (
                  <div key={i} className={styles.benefitCard}>
                    <div className={styles.benefitInfo}>
                      <h3>{b.title}</h3>
                      <p>{b.desc}</p>
                    </div>
                  </div>
                ));
              }
              return benefits.map((b, i) => (
                <div key={i} className={styles.benefitCard}>
                  <div className={styles.benefitInfo}>
                    <h3>{t(b.title || b || "")}</h3>
                    <p>{t(b.description || b.desc || "")}</p>
                  </div>
                </div>
              ));
            })()}
          </div>
        </section>

        {/* Open Positions */}
        <section>
          <div className={styles.sectionHeading}>
            <h2 className={styles.premiumTitle}>{t("الوظائف المتاحة")}</h2>
            <Link to="/JobListing" className={styles.textLink}>
              {t("عرض كل الوظائف ←")}
            </Link>
          </div>
          <div className={styles.jobsGrid}>
            {company?.jobs && company.jobs.length > 0 ? (
              company.jobs.slice(0, 4).map((job, idx) => (
                <div
                  key={idx}
                  className={styles.jobCard}
                  onClick={() =>
                    navigate("/Job details", {
                      state: { jobId: job.jobId || job.job_id },
                    })
                  }
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.cardLogo}>
                      <img
                        src={getFullImageUrl(company?.logoUrl, companyName)}
                        alt=""
                      />
                    </div>
                    <span className={styles.cardTypeBadge}>
                      {t(job.jobType || "") || t("Full-time")}
                    </span>
                  </div>

                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{t(job.title || "")}</h3>
                    <p className={styles.cardMeta}>
                      {t(companyName)} • {t(job.address || "") || t("Remote")}
                    </p>

                    <div className={styles.cardTags}>
                      <span className={`${styles.tag} ${styles.tagOrange}`}>
                        {t("برمجة")}
                      </span>
                      <span className={`${styles.tag} ${styles.tagBlue}`}>
                        {t("Design")}
                      </span>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.footerDivider} />
                    <div className={styles.footerProgress}>
                      <span>
                        {t("تقدموا")} {job.appliedCount || 0} {t("من")}{" "}
                        {job.slotsAvailable || 10} {t("متاح")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.noJobs}>{t("لا توجد وظائف معلنة حالياً.")}</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

const PlusIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const EditIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const MailIcon = () => (
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
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
