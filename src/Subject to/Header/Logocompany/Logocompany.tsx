import { useEffect, useState } from "react";
import styles from "./Logocompany.module.css";
import { useJobitoAuth } from "../../../context/LinkContxt";
import { useTranslation } from "../../../context/translation-context";

export const Logocompany = () => {
  const { role, apiFetch } = useJobitoAuth();
  const { t } = useTranslation();
  const [dbCompany, setDbCompany] = useState<any>(null);
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5200";

  useEffect(() => {
    if (role === "company") {
      const fetchProfile = async () => {
        try {
          const res = await apiFetch(`${API_BASE_URL}/api/companies/my/profile`);
          if (res.ok) {
            const data = await res.json();
            setDbCompany(data);
          }
        } catch (e) {
          console.error("Failed to load company profile from DB", e);
        }
      };
      fetchProfile();

      window.addEventListener("jobito-profile-updated", fetchProfile);
      return () => {
        window.removeEventListener("jobito-profile-updated", fetchProfile);
      };
    }
  }, [role, apiFetch, API_BASE_URL]);

  const getAvatarUrl = (url?: string) => {
    if (url) {
      if (url.startsWith("http")) return url;
      return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
    }
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${dbCompany?.Name || dbCompany?.name || "company"}`;
  };

  const currentLogo = getAvatarUrl(dbCompany?.LogoUrl || dbCompany?.logoUrl || dbCompany?.logo_url);
  const companyName = dbCompany?.Name || dbCompany?.name || t("Company");

  return (
    <div className={styles.Logocompanycompany}>
      <div className={styles.companyLogo}>
        <img src={currentLogo} alt={companyName} />
      </div>
      <div className={styles.companyInfo}>
        <div className={styles.companyName}>{companyName}</div>
      </div>
    </div>
  );
};
