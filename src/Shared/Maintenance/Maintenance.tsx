import React from "react";
import { motion } from "framer-motion";
import { useJobitoAuth } from "../../context/LinkContxt";

const Maintenance: React.FC = () => {
  const { setIsMaintenanceMode, isBackendOffline } = useJobitoAuth();

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
        color: "var(--color-text)",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
        textAlign: "center",
        padding: "20px",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          duration: 0.8,
        }}
        style={{
          width: 120,
          height: 120,
          background: "linear-gradient(135deg, #FF7A2A 0%, #FFB084 100%)",
          borderRadius: "30%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 40,
          boxShadow: "0 20px 40px rgba(255, 122, 42, 0.3)",
        }}
      >
        <i className="fas fa-tools" style={{ fontSize: 60, color: "white" }}></i>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 800,
          marginBottom: 16,
          background: "linear-gradient(135deg, var(--color-text) 0%, #4A6ED1 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        الموقع تحت الصيانة الان
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          fontSize: "clamp(1rem, 2vw, 1.25rem)",
          color: "var(--color-text-muted)",
          maxWidth: 600,
          lineHeight: 1.6,
          marginBottom: 32,
        }}
      >
        نحن نعمل حالياً على تحسين تجربتكم وتطوير خدماتنا. سنعود إليكم قريباً بشكل أفضل.
        <br />
        شكراً لتفهمكم!
      </motion.p>

      {/* زر الاستمرار يظهر فقط إذا كان السيرفر يعمل (أي أن الصيانة مقصودة) */}
      {!isBackendOffline && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={() => setIsMaintenanceMode(false)}
          style={{
            padding: "14px 32px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(135deg, #4A6ED1 0%, #3551A1 100%)",
            color: "white",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 40,
            boxShadow: "0 10px 20px rgba(74, 110, 209, 0.2)",
          }}
        >
          الاستمرار على أي حال
        </motion.button>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          padding: "12px 24px",
          background: "rgba(74, 110, 209, 0.1)",
          borderRadius: "50px",
          border: "1px solid rgba(74, 110, 209, 0.2)",
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            width: 8,
            height: 8,
            background: "#4A6ED1",
            borderRadius: "50%",
          }}
        />
        <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "#4A6ED1" }}>
          جاري العمل على التحديثات
        </span>
      </motion.div>

      <div
        style={{
          position: "absolute",
          bottom: "40px",
          opacity: 0.3,
          fontSize: "0.8rem",
          letterSpacing: "4px",
          fontWeight: 600,
        }}
      >
        JOBITO SYSTEM
      </div>
    </div>
  );
};

export default Maintenance;
