import { useState, useMemo } from "react";
import { NavBar } from "../../Subject to/Header/NavBar/NavBar";
import styles from "./Header.module.css";
import { HeaderActions } from "../../Subject to/Header/HeaderActions/HeaderActions";
import { Logo } from "../../Subject to/Header/Logo/Logo";
import { HeaderActionscompany } from "../../Subject to/Header/HeaderActionscompany/HeaderActionscompany";
import { useJobitoAuth } from "../../context/LinkContxt";
import { Logocompany } from "../../Subject to/Header/Logocompany/Logocompany";
import { useTranslation } from "../../context/translation-context";
import { useTheme } from "../../context/ThemeContext";
import SidebarMenu from "../../Basic/SidebarMenu/SidebarMenu";
import {
  Home,
  Search,
  Building2,
  Info,
  Mail,
  LayoutDashboard,
  UserCircle,
  FileText,
  MessageSquare,
  List,
  Plus,
  Moon,
  Sun,
  Menu,
} from "lucide-react";

export function Header() {
  const { isAuthenticated, user, role } = useJobitoAuth();
  const { language, setLanguage, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const guestNavLinks = useMemo(() => [
    { label: t("الرئيسية"), path: "/", icon: <Home size={16} /> },
    { label: t("بحث عن وظائف"), path: "/find-jobs", icon: <Search size={16} /> },
    { label: t("تصفح الشركات"), path: "/browse-companies", icon: <Building2 size={16} /> },

    { label: t("عن المنصة"), path: "/about", icon: <Info size={16} /> },
    { label: t("اتصل بنا"), path: "/contact", icon: <Mail size={16} /> },
  ], [t]);

  const authNavLinks = useMemo(() => [
    { label: t("الرئيسية"), path: "/", icon: <Home size={16} /> },
    { label: t("بحث عن وظائف"), path: "/find-jobs", icon: <Search size={16} /> },
    { label: t("لوحة التحكم"), path: "/JobDashboard", icon: <LayoutDashboard size={16} /> },
    { label: t("تصفح الشركات"), path: "/browse-companies", icon: <Building2 size={16} /> },

    { label: t("الملف الشخصي"), path: "/Profile", icon: <UserCircle size={16} /> },
    { label: t("الرسائل"), path: "/chat", icon: <MessageSquare size={16} /> },
  ], [t]);

  const navLinkscompany = useMemo(() => [
    { label: t("الرئيسية"), path: "/home", icon: <Home size={16} /> },
    { label: t("الرسائل"), path: "/chat", icon: <MessageSquare size={16} /> },
    { label: t("الملف الشخصي"), path: "/Profile", icon: <UserCircle size={16} /> },
    { label: t("قائمة الوظائف"), path: "/JobListing", icon: <List size={16} /> },
  ], [t]);

  const navLinkstradesman = useMemo(() => [
    { label: t("الرئيسية"), path: "/", icon: <Home size={16} /> },
    { label: t("بحث عن وظائف"), path: "/find-jobs", icon: <Search size={16} /> },
    { label: t("أعمالي"), path: "/JobListing", icon: <List size={16} /> },
    { label: t("تصفح الشركات"), path: "/browse-companies", icon: <Building2 size={16} /> },

    { label: t("الملف الشخصي"), path: "/Profile", icon: <UserCircle size={16} /> },
    { label: t("الرسائل"), path: "/chat", icon: <MessageSquare size={16} /> },
  ], [t]);



  const toggleLanguage = () => {
    setLanguage(language === "ar" ? "en" : "ar");
  };

  const navLinksuser = isAuthenticated ? (user?.classification === "tradesman" ? navLinkstradesman : authNavLinks) : guestNavLinks;
  const navLinks = role === "company" ? navLinkscompany : navLinksuser;

  const isDarkHeader = role === "company";
  const LogoComponent = role === "company" ? Logocompany : Logo;
  const HeaderActionsComponent = role === "company" ? HeaderActionscompany : HeaderActions;

  return (
    <>
      <header className={isDarkHeader ? styles.rootcompany : styles.rootUser}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {isAuthenticated && (
              <SidebarMenu />
            )}
            <LogoComponent />
          </div>
          <NavBar
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
            navLinks={navLinks}
          />
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <button
            className={styles.themeToggleBtn}
            onClick={toggleTheme}
            title={theme === "light" ? "Dark Mode" : "Light Mode"}
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button className={styles.langBtn} onClick={toggleLanguage} title={language === "ar" ? "English" : "العربية"}>
            <span>{language === "ar" ? "EN" : "AR"}</span>
          </button>
          {role === "company" ? (
            <HeaderActionscompany />
          ) : (
            <HeaderActions isAuthenticated={isAuthenticated} user={user} />
          )}
        </div>
      </header>
    </>
  );
}
