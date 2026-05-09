import React from "react";
import styles from "./ModeSwitcherBar.module.css";
import { useJobitoAuth } from "../../context/LinkContxt";
import { useTranslation } from "../../context/translation-context";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, PlusCircle } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5200";

const ModeSwitcherBar: React.FC = () => {
  const { user, isAuthenticated, role, apiFetch, updateUser, login } = useJobitoAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Only show for users/students, not companies
  const isIndividual = role === "user";
  if (!isAuthenticated || !isIndividual) {
    return null;
  }

  const classification = user?.classification || "job_seeker";

  const handleToggleMode = async () => {
    const newType = classification === "job_seeker" ? "tradesman" : "job_seeker";
    try {
      const payload = {
        role: "user",
        classification: newType,
      };

      const response = await apiFetch(`${API_BASE_URL}/api/users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        // The backend returns a freshly signed access_token containing the updated classification
        if (data.access_token) {
          // login function from context saves it to localStorage and dispatches auth-changed
          login(data.access_token);
        }
        
        // Update local state reactively without full page reload
        updateUser({ classification: newType });
      }
    } catch (error) {
      console.error("Failed to toggle mode", error);
    }
  };

  return (
    <div className={styles.switcherBar}>
      <div className={styles.leftSide}>
        <button className={styles.switchBtn} onClick={handleToggleMode}>
          <ArrowLeftRight size={16} />
          {classification === "tradesman" ? t("العودة إلى باحث عن عمل") : t("التبديل إلى الوضع الصناعي")}
        </button>
        <span className={styles.statusText}>
          {t("الوضع الحالي:")} {classification === "tradesman" ? t("صنايعي") : t("باحث عن عمل")}
        </span>
      </div>

      <div className={styles.rightSide}>
        {classification === "tradesman" && (
          <button className={styles.postJobBtn} onClick={() => navigate("/PostWork")}>
            <PlusCircle size={16} />
            {t("أضف خدمة / وظيفة")}
          </button>
        )}
      </div>
    </div>
  );
};

export default ModeSwitcherBar;
