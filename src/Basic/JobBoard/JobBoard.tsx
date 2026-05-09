import { MapPin, Search } from "lucide-react";
import Styles from "./JobBoard.module.css";
import AllJobs from "../../Subject to/JobBoard/AllJobs/AllJobs";
import { motion, type Variants } from "framer-motion";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "../../context/translation-context";
import { useJobitoAuth } from "../../context/LinkContxt";

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

const sectionVariant: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", delay: 0.2 },
  },
};

export default function JobBoard() {
  const { apiFetch, isAuthenticated, role, user } = useJobitoAuth();
  const classification = user?.classification;
  const [searchParams] = useSearchParams();
  
  const initialSearch = searchParams.get("search") || "";
  const initialLocation = searchParams.get("location") || "";
  const initialCategory = searchParams.get("category") || "";

  const [search, setSearch] = useState(initialSearch);
  const [location, setLocation] = useState(initialLocation);
  const { t } = useTranslation();

  const [appliedFilters, setAppliedFilters] = useState({
    search: initialSearch,
    location: initialLocation,
    category: initialCategory
  });

  const handleSearch = () => {
    setAppliedFilters({ search, location, category: "" }); // Reset category on manual search? Or keep it?
  };

  return (
    <div className={Styles.page}>
      {/* ── Hero Section ── */}
      <section className={Styles.heroSection}>
        <div className={Styles.container}>
          <motion.div
            className={Styles.content}
            variants={heroContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Title */}
            <motion.h1 className={Styles.title} variants={fadeUp}>
              {classification === "tradesman" ? t("ابحث عن") : t("ابحث عن")}{" "}
              <span className={Styles.purpleText}>
                {classification === "tradesman" ? t("طلبات صيانة") : t("وظيفة أحلامك")}{" "}
              </span>
            </motion.h1>

            <motion.p className={Styles.description} variants={fadeUp}>
              {classification === "tradesman" 
                ? t("الآلاف من طلبات العمل المنزلي في انتظارك. ابدأ العمل الآن.")
                : t("الآلاف من فرص العمل في انتظارك. ابدأ مسيرتك المهنية اليوم.")}
            </motion.p>

            {/* Search Bar */}
            <motion.div
              className={Styles.searchBar}
              variants={searchBarVariant}
            >
              <div className={Styles.inputGroup}>
                <Search className={Styles.icon} size={20} />
                <input
                  type="text"
                  placeholder={classification === "tradesman" 
                    ? t("ما هي الخدمة التي تستطيع تقديمها؟ (سباكة، نجارة...)") 
                    : t("مسمى الوظيفة أو الكلمة الرئيسية...")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>

              <div className={Styles.divider}></div>

              <div className={Styles.inputGroup}>
                <MapPin className={Styles.icon} size={20} />
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  <option value="">{t("أي مكان")}</option>
                  <option value="Cairo">{t("القاهرة، مصر")}</option>
                  <option value="Alexandria">{t("الإسكندرية، مصر")}</option>
                </select>
              </div>

              <button className={Styles.searchBtn} onClick={handleSearch}>
                {t("بحث")}
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Jobs Section ── */}
      <motion.div
        className={Styles.cardJobBoard}
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <AllJobs
          searchKeyword={appliedFilters.search}
          location={appliedFilters.location}
          category={appliedFilters.category}
        />
      </motion.div>
    </div>
  );
}
