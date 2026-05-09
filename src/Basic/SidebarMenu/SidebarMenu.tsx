import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../context/translation-context";
import { useJobitoAuth } from "../../context/LinkContxt";
import { Mail, FileText, Info, MessageSquare } from "lucide-react";
import styles from "./SidebarMenu.module.css";

const SidebarMenu: React.FC = () => {
  const { user } = useJobitoAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isTradesman = user?.classification === "tradesman";

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className={styles.sidebarWrapper}>
      <label className={styles.hamburger}>
        <input
          type="checkbox"
          checked={isOpen}
          onChange={() => setIsOpen(!isOpen)}
        />
        <svg viewBox="0 0 32 32">
          <path
            className={`${styles.line} ${styles.lineTopBottom}`}
            d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
          ></path>
          <path className={styles.line} d="M7 16 27 16"></path>
        </svg>
      </label>

      <div className={`${styles.input} ${isOpen ? styles.inputOpen : ""}`}>
        <button
          className={styles.value}
          onClick={() => handleNavigate("/contact")}
        >
          <Mail size={20} color="#7D8590" />
          {t("اتصل بنا")}
        </button>
        <button
          className={styles.value}
          onClick={() => handleNavigate("/MyApplications")}
        >
          <FileText size={20} color="#7D8590" />
          {t("طلباتي")}
        </button>
        <button
          className={styles.value}
          onClick={() => handleNavigate("/chat")}
        >
          <MessageSquare size={20} color="#7D8590" />
          {t("الرسائل")}
        </button>
        <button
          className={styles.value}
          onClick={() => handleNavigate("/about")}
        >
          <Info size={20} color="#7D8590" />
          {t("عن المنصة")}
        </button>
      </div>
    </div>
  );
};

export default SidebarMenu;
