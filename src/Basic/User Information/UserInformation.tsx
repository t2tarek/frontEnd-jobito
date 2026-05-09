import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import BorderAnimatedContainer from "../../Subject to/User Information/BorderAnimatedContainer";
import styles from "./User_Information.module.css";
import { useTranslation } from "../../context/translation-context";
import { useJobitoAuth } from "../../context/LinkContxt";


import LoginPage from "../../Subject to/User Information/Login/Login";
import UI from "../../Subject to/User Information/CreateAcont/Up/UP";

export const UserInformation: React.FC = () => {
  const { isAuthenticated, role } = useJobitoAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      if (role === "company") navigate("/home", { replace: true });
      else navigate("/", { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const [showLogin, setShowLogin] = useState(true);
  const [isCustomer, setIsCustomer] = useState(true);
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    if (location.state) {
      if (location.state.showLogin !== undefined) setShowLogin(location.state.showLogin);
      if (location.state.isCustomer !== undefined) setIsCustomer(location.state.isCustomer);
    }
  }, [location.state]);

  const toggleLogin = () => setShowLogin(!showLogin);

  const pageVariants = {
    hidden: { opacity: 0, x: 50, scale: 0.95 },
    visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, x: -50, scale: 0.95, transition: { duration: 0.4 } },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <BorderAnimatedContainer>
          <AnimatePresence>
            {!showLogin && (
              <motion.div
                key="header-btns"
                style={{ position: "absolute", top: 32, right: 32, display: "flex", gap: "12px", zIndex: 10 }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <motion.button
                  className={styles.signInBtn}
                  style={{ position: "static", backgroundColor: "#f8fafc", color: "#4f46e5", border: "1px solid #4f46e5", boxShadow: "none" }}
                  onClick={() => setIsCustomer(!isCustomer)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isCustomer ? t("صاحب عمل؟ حساب شركة") : t("مستخدم ؟ إنشاء حساب")}
                </motion.button>
                <motion.button
                  className={styles.signInBtn}
                  style={{ position: "static" }}
                  onClick={toggleLogin}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t("تسجيل الدخول")}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {showLogin ? (
              <motion.div
                key="login"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-full h-full"
              >
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="w-full h-full"
                >
                  <LoginPage setShowLogin={setShowLogin} />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-full h-full"
              >
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="w-full h-full"
                >
                  <UI setShowLogin={setShowLogin} isCustomer={isCustomer} setIsCustomer={setIsCustomer} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </BorderAnimatedContainer>
      </div>
    </div>
  );
};
