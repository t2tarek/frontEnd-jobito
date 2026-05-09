import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Building2, MapPin } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import styles from "./CompaniesJobs.module.css";
import { useTranslation } from "../../context/translation-context";
import { useJobitoAuth } from "../../context/LinkContxt";



const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5200";

interface Company {
  id: number;
  name: string;
  desc: string;
  tags: string[];
  jobsCount: number;
  logoUrl?: string;
  industry?: string;
  classification?: string;
  employees?: string;
}

// Interfaces matching the .NET backend API response
interface APIJob {
  id: number;
  title?: string;
  classification?: string;
  category?: { name?: string };
}

interface APICompany {
  id: number;
  name?: string;
  description?: string;
  logoUrl?: string;
  industry?: string;
  classification?: string;
  employees?: string;
  jobs?: APIJob[];
}

const DEFAULT_CLASSIFICATIONS = [
  "تقني", "غير تقني"
];

const heroContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const searchBarVariant: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.45 },
  },
};

const CompaniesJobs = () => {
  const { t } = useTranslation();
  const { apiFetch } = useJobitoAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const itemsPerPage = 6;

  // Wrap in useCallback so it can be called both from useEffect and retry button
  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);

      // Use apiFetch so ngrok headers + auth token are sent automatically
      const response = await apiFetch(`${API_BASE_URL}/api/companies?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const rawData = await response.json();
      // .NET backend returns PascalCase – normalize to camelCase
      const rawList: any[] = rawData.data ?? (Array.isArray(rawData) ? rawData : []);

      const uniqueCompaniesMap = new Map<string, Company>();

      rawList.forEach((item) => {
        // Normalize: support both PascalCase (.NET) and camelCase
        const id          = item.Id          ?? item.id;
        const name        = item.Name        ?? item.name;
        const description = item.Description ?? item.description;
        const logoUrl     = item.LogoUrl     ?? item.logoUrl;
        const industry    = item.Industry    ?? item.industry;
        const classification = item.Classification ?? item.classification;
        const employees   = item.Employees   ?? item.employees;
        const jobs        = item.Jobs        ?? item.jobs ?? [];

        if (id == null) return; // skip malformed entries

        const tagsSet = new Set<string>();
        jobs.forEach((job: any) => {
          const cls = job.Classification ?? job.classification;
          const cat = job.Category ?? job.category;
          if (cls) tagsSet.add(cls);
          else if (cat?.name || cat?.Name) tagsSet.add(cat.name ?? cat.Name);
        });

        const companyObj: Company = {
          id,
          name:           name ?? "شركة غير مسماة",
          desc:           description ?? t("شركة رائدة في مجالها."),
          tags:           Array.from(tagsSet),
          jobsCount:      jobs.length,
          logoUrl,
          industry,
          classification,
          employees,
        };

        const existing = uniqueCompaniesMap.get(id.toString());
        if (
          !existing ||
          (companyObj.jobsCount > 0 && existing.jobsCount === 0) ||
          (companyObj.classification && !existing.classification)
        ) {
          uniqueCompaniesMap.set(id.toString(), companyObj);
        }
      });

      setCompanies(Array.from(uniqueCompaniesMap.values()));

    } catch (err) {
      console.error("Error fetching companies:", err);
      setError(t("تعذر تحميل الشركات. تأكد من تشغيل الخادم ثم حاول مرة أخرى."));
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, apiFetch, t]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = company.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesIndustry =
      selectedIndustries.length === 0 ||
      (company.classification && selectedIndustries.includes(company.classification));

    return matchesSearch && matchesIndustry;
  });

  const industryCounts = companies.reduce((acc, company) => {
    if (company.classification) {
      acc[company.classification] = (acc[company.classification] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Add defaults to industryCounts
  DEFAULT_CLASSIFICATIONS.forEach(ind => {
    if (industryCounts[ind] === undefined) industryCounts[ind] = 0;
  });

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCompanies = filteredCompanies.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const handleSearchClick = () => {
    setCurrentPage(1);
    // The useEffect will refetch due to dependencies
  };

  const handleIndustryChange = (industry: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry)
        ? prev.filter((i) => i !== industry)
        : [...prev, industry],
    );
    setCurrentPage(1);
  };

  return (
    <div>
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <motion.div
            className={styles.content}
            variants={heroContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 className={styles.title} variants={fadeUp}>
              {t("ابحث عن")}{" "}
              <span className={styles.purpleText}>
                {t("الشركات التي تحلم بها")}
              </span>
            </motion.h1>

            <motion.p className={styles.description} variants={fadeUp}>
              {t("اكتشف أفضل الشركات وبيئات العمل المثالية لمستقبلك المهني.")}
            </motion.p>

            <motion.div
              className={styles.searchBar}
              variants={searchBarVariant}
            >
              <div className={styles.inputGroup}>
                <Search className={styles.icon} size={20} />
                <input
                  type="text"
                  placeholder={t("اسم الشركة أو المجال...")}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className={styles.divider}></div>

              <div className={styles.inputGroup}>
                <MapPin className={styles.icon} size={20} />
                <select
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">{t("أي مكان")}</option>
                  <option value="Cairo">{t("القاهرة، مصر")}</option>
                  <option value="Alexandria">{t("الإسكندرية، مصر")}</option>
                </select>
              </div>

              <button 
                className={styles.searchBtn}
                onClick={handleSearchClick}
              >
                {t("بحث")}
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <div className={styles.Companiespage}>
        <aside className={styles.sidebar}>
          <div className={styles.filterSection}>
            <h4 className={styles.filterTitle}>{t("التصنيف")}</h4>
            <div className={styles.filterList}>
              {Object.entries(industryCounts).map(([ind, count]) => (
                <label key={ind} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={selectedIndustries.includes(ind)}
                    onChange={() => handleIndustryChange(ind)}
                  />
                  <span className={styles.labelSpan}>
                    {t(ind)} <span className={styles.countText}>({count})</span>
                  </span>
                </label>
              ))}
              {Object.keys(industryCounts).length === 0 && !isLoading && (
                <p className={styles.emptyText}>{t("لا توجد قطاعات.")}</p>
              )}
            </div>
          </div>

        </aside>

        <main className={styles.Companiespagemu}>
          <div className={styles.CompaniesHeader}>
            <div>
              <h2>{t("جميع الشركات")}</h2>
              <p>
                {t("إجمالي الشركات المدرجة:")} {filteredCompanies.length}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className={styles.loaderContainer}>
              <div className={styles.spinner}></div>
              <p>{t("جاري التحميل...")}</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p>{error}</p>
              <button
                onClick={() => fetchCompanies()}
                style={{
                  marginTop: "10px",
                  padding: "5px 15px",
                  cursor: "pointer",
                }}
              >
                {t("إعادة المحاولة")}
              </button>
            </div>
          ) : filteredCompanies.length > 0 ? (
            <>
              <div className={styles.Companiesgrid}>
                {currentCompanies.map((company) => (
                  <div 
                    key={company.id} 
                    className={styles.Companycard}
                    onClick={() => navigate(`/Company/${company.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.Cardtop}>
                      <div className={styles.Logoplaceholder}>
                        {company.logoUrl ? (
                          <img
                            src={
                              company.logoUrl.startsWith("http")
                                ? company.logoUrl
                                : `${API_BASE_URL}${company.logoUrl.startsWith("/") ? "" : "/"}${company.logoUrl}`
                            }
                            alt={company.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: "inherit",
                            }}
                          />
                        ) : (
                          <Building2 size={24} color="#4640de" />
                        )}
                      </div>
                      <span className={styles.Jobscount}>
                        {company.jobsCount} {t("وظائف شاغرة")}
                      </span>
                    </div>

                    <h3>{t(company.name)}</h3>
                    <p className={styles.desc}>{t(company.desc)}</p>

                    <div className={styles.tags}>
                      {company.tags.length > 0 ? (
                        company.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`${styles.tag} ${styles.paymentgateway}`}
                          >
                            {t(tag)}
                          </span>
                        ))
                      ) : (
                        <span className={styles.noTag}>{t("خدمات عامة")}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    {" > "}
                  </button>
                  <div className={styles.pageNumbers}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={
                            currentPage === page ? styles.activePage : ""
                          }
                        >
                          {page}
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                     {" < "}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.noResults}>
              <h3>{t("لم يتم العثور على نتائج.")}</h3>
              <p>{t("حاول البحث بكلمات أخرى.")}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CompaniesJobs;
