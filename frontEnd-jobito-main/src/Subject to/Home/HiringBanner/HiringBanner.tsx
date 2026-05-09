import React from "react";
import styles from "./HiringBanner.module.css";
import img1 from "../../../assets/WhatsApp Image 2026-02-20 at 12.19.07 AM.jpeg";
import img2 from "../../../assets/WhatsApp Image 2026-02-20 at 12.19.09 AM.jpeg";
import img3 from "../../../assets/WhatsApp Image 2026-02-20 at 12.16.48 AM (1).jpeg";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../context/translation-context";

const HiringBanner: React.FC = () => {
  const { t } = useTranslation();
  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: 40, y: 30 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const imageVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6 },
    },
  };
  const navigate = useNavigate();

  return (
    <motion.div 
      className={styles.bannerWrapper}
      initial="hidden"
      whileInView="visible"
      viewport={{ margin: "-100px" }}
      variants={containerVariants}
    >
      <div className={styles.bannerContainer}>
        {/* Right Side: Text */}
        <div className={styles.rightContent}>
          <motion.div className={styles.textGroup} variants={itemVariants}>
            <h2 className={styles.hiringTitle}>{t("نحن")} {t("نوظف!")}</h2>
            <p className={styles.description}>
              {t("جميع الشركات")}
              <br />
              <span className={styles.mutedText}>& {t("واستكشاف الفرص")}</span>
            </p>
          </motion.div>
        </div>

        {/* Left Side: Button */}
        <div className={styles.leftContent}>
          <motion.button 
            className={styles.applyBtn}
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate("/user-information")}
            whileTap={{ scale: 0.95 }}
          >
            <span className={styles.btnText}>{t("قدم الآن")}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default HiringBanner;

