import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import styles from "./NavBar.module.css";

export type NavLinkType = {
  label: string;
  path: string;
  icon?: React.ReactNode;
};

type NavBarProps = {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  navLinks: NavLinkType[];
};

export function NavBar({ mobileOpen, setMobileOpen, navLinks }: NavBarProps) {
  const location = useLocation();

  return (
    <>
      {/* ── Hamburger (mobile) ── */}
      <button
        className={styles.burger}
        onClick={() => setMobileOpen((p) => !p)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* ── Nav links (desktop) ── */}
      <nav className={styles.nav}>
        {navLinks.map((link) => {
          const active = location.pathname === link.path;
          return (
            <div className={styles.navItem} key={link.path}>
              <Link
                to={link.path}
                className={`${styles.link} ${active ? styles.linkActive : ""}`}
              >
                {link.icon && <span className={styles.navIcon}>{link.icon}</span>}
                <span className={styles.navLabel}>{link.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      {mobileOpen && (
        <nav className={styles.mobileNav}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`${styles.mobileLink} ${location.pathname === link.path ? styles.mobileLinkActive : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              {link.icon && <span className={styles.navIcon}>{link.icon}</span>}
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
