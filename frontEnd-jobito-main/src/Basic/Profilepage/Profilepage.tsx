import { useState, useEffect } from "react";
import styles from "./Profilepage.module.css";
import { useJobitoAuth } from "../../context/LinkContxt";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../context/translation-context";
import type {
  ExperienceItem as Experience,
  EducationItem as Education,
} from "../../context/LinkContxt";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5200";

const BriefcaseIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const GraduationIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 10L12 5 2 10l10 5 10-5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);
const PlusIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
const MailIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const PhoneIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const GlobeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const InstagramIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
const TwitterIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </svg>
);
const Share2Icon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const getAvatarUrl = (path: string | undefined | null) => {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5200";
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

export default function ProfilePage() {
  const { user, apiFetch } = useJobitoAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<any>(null);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [showMoreExp, setShowMoreExp] = useState(false);
  const [showMoreEdu, setShowMoreEdu] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiFetch(`${API_BASE_URL}/api/users/me`);
        if (response.ok) {
          const raw = await response.json();
          // Normalize PascalCase (.NET) → camelCase, fallback to camelCase if already mapped
          const normalized = {
            id:             raw.Id             ?? raw.id,
            fullName:       raw.FullName       ?? raw.fullName,
            name:           raw.FullName       ?? raw.fullName       ?? raw.name,
            email:          raw.Email          ?? raw.email,
            phone:          raw.PhoneNumber    ?? raw.phoneNumber    ?? raw.phone,
            avatarUrl:      raw.AvatarUrl      ?? raw.avatarUrl      ?? raw.avatar,
            avatar:         raw.AvatarUrl      ?? raw.avatarUrl      ?? raw.avatar,
            classification: raw.Classification ?? raw.classification,
            location:       raw.Location       ?? raw.location,
            role:           raw.Role           ?? raw.role,
            // Rich fields – backend returns PascalCase, fallback to camelCase, then JWT
            bio:         raw.Bio         ?? raw.bio         ?? user?.bio,
            skills:      raw.Skills      ?? raw.skills      ?? user?.skills      ?? [],
            experiences: raw.Experiences ?? raw.experiences ?? user?.experiences ?? [],
            educations:  raw.Educations  ?? raw.educations  ?? user?.educations  ?? [],
            portfolios:  raw.Portfolios  ?? raw.portfolios  ?? user?.portfolios  ?? [],
            socialLinks: raw.SocialLinks ?? raw.socialLinks ?? user?.socialLinks,
            banner_url:  raw.BannerUrl   ?? raw.banner_url  ?? user?.banner_url,
            services:    raw.Services    ?? raw.services    ?? [],
          };
          setProfile(normalized);
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    };
    fetchProfile();
  }, [apiFetch, user]);


  const profileUser = profile || user;
  
  // Sync classification from context to profile state if context user changes
  useEffect(() => {
    if (user?.classification && profile && profile.classification !== user.classification) {
      setProfile(prev => prev ? { ...prev, classification: user.classification } : null);
    }
  }, [user?.classification, profile]);

  const experiences = (profileUser?.experiences || []) as Experience[];
  const educations = (profileUser?.educations || []) as Education[];
  const skills = profileUser?.skills || [];
  const portfolios = (profileUser?.portfolios || []) as string[];
  const services = profileUser?.services || [];
  const socialLinks = profileUser?.socialLinks || {
    instagram: "",
    twitter: "",
    linkedin: "",
    github: "",
  };

  const displayName =
    t(profileUser?.fullName || "") || t(profileUser?.name || "") || t("اسم المستخدم");
  const displayAvatar = profileUser?.avatarUrl || profileUser?.avatar;
  const displayBio = t(profileUser?.bio || "") || t("أضف نبذة عن نفسك...");
  const displayLocation = t(profileUser?.location || "") || t("الموقع غير محدد");

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={`${styles.card} ${styles.heroCard}`}>
          <div
            className={styles.heroBanner}
            style={{
              backgroundImage: profileUser?.banner_url
                ? `url(${getAvatarUrl(profileUser.banner_url)})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
          <div className={styles.heroBody}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatar}>
                {displayAvatar ? (
                  <img src={getAvatarUrl(displayAvatar) || ""} alt="avatar" />
                ) : (
                  displayName[0] || "U"
                )}
              </div>
            </div>
            <div className={styles.heroInfo}>
              <div className={styles.heroName}>{displayName}</div>
              <div className={styles.heroRole}>
                {profileUser?.role === "company"
                  ? t("حساب شركة")
                  : profileUser?.classification === "tradesman"
                  ? t("صنايعي")
                  : t("باحث عن عمل")}
              </div>
              <div className={styles.heroLoc}>
                <svg
                  width="12"
                  height="12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                {t(displayLocation)}
              </div>
            </div>
            <div className={styles.heroActions}>
              <button
                className={styles.editProfileBtn}
                onClick={() => navigate("/edit-profile")}
              >
                {t("تعديل الملف الشخصي")}
              </button>
              <div className={styles.openBadge}>
                <div className={styles.openDot} />
                {t("متاح للفرص")}
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>{t("نبذة عني")}</span>
            </div>
            <div
              className={`${styles.aboutText} ${aboutExpanded ? styles.expanded : styles.collapsed}`}
            >
              {displayBio}
            </div>
            <button
              className={styles.showMore}
              onClick={() => setAboutExpanded((e) => !e)}
            >
              {aboutExpanded ? t("عرض أقل ↑") : t("عرض المزيد ↓")}
            </button>
          </div>
        </div>

        {/* Experiences */}
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>{t("الخبرات")}</span>
            </div>
             {experiences
              .slice(0, showMoreExp ? undefined : 4)
              .map((exp, idx) => (
                <div className={styles.expItem} key={idx}>
                  <div className={styles.expLogo}>
                    <BriefcaseIcon />
                  </div>
                  <div className={styles.expContent}>
                    <div className={styles.expTop}>
                      <div>
                        <div className={styles.expTitle}>{t(exp.role || "")}</div>
                        <div className={styles.expCompany}>{t(exp.period || "")}</div>
                        <div className={styles.expLoc}>{t(exp.location || "")}</div>
                      </div>
                    </div>
                    {exp.desc && (
                      <div className={styles.expDesc}>{t(exp.desc)}</div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
        {/* Education */}
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>{t("التعليم")}</span>
            </div>
            {educations
              .slice(0, showMoreEdu ? undefined : 4)
              .map((edu, idx) => (
                <div className={styles.expItem} key={idx}>
                  <div className={styles.expLogo}>
                    <GraduationIcon />
                  </div>
                  <div className={styles.expContent}>
                    <div className={styles.expTop}>
                      <div>
                        <div className={styles.eduSchool}>{t(edu.school || "")}</div>
                        <div className={styles.eduDegree}>{t(edu.degree || "")}</div>
                        <div className={styles.eduPeriod}>{t(edu.period || "")}</div>
                        <div className={styles.expLoc}>{t(edu.location || "")}</div>
                      </div>
                    </div>
                    {edu.desc && (
                      <div className={styles.eduDesc}>{t(edu.desc)}</div>
                    )}
                  </div>
                </div>
              ))}
            {educations.length === 0 && (
              <div className={styles.detailVal}>{t("غير محدد")}</div>
            )}
            {educations.length > 4 && (
              <button
                className={styles.showMore}
                onClick={() => setShowMoreEdu((e) => !e)}
              >
                {showMoreEdu ? t("عرض أقل ↑") : t("عرض المزيد ↓")}
              </button>
            )}
          </div>
        </div>


        {/* Skills */}
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>{t("المهارات")}</span>
            </div>
             <div className={styles.skillsWrap}>
              {skills.map((s) => (
                <div className={styles.skillTag} key={s}>
                  {t(s || "")}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Serves Section - Only for Tradesmen */}
        {profileUser?.classification === "tradesman" && services.length > 0 && (
          <div className={styles.card}>
            <div className={styles.cardBody}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>{t("Serves")}</span>
              </div>
              <div className={styles.servesList}>
                {services.map((srv: string, idx: number) => (
                  <div key={idx} className={styles.servesItem}>
                    {t(srv)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Portfolio */}
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>{t("المعرض")}</span>
            </div>
            <div className={styles.portfolioGrid}>
              {portfolios.map((img, idx) => (
                <div className={styles.portfolioItem} key={idx}>
                  <img
                    src={getAvatarUrl(img) || ""}
                    alt={`Gallery ${idx}`}
                    className={styles.portfolioImg}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== RIGHT ===== */}
      <div className={styles.right}>
        {/* Additional Details */}
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>{t("تفاصيل إضافية")}</span>
            </div>
            {[
              {
                icon: <MailIcon />,
                label: t("البريد الإلكتروني"),
                val: t(profileUser?.email || "") || t("غير محدد"),
              },
              {
                icon: <PhoneIcon />,
                label: t("الهاتف"),
                val: t(profileUser?.phone || "") || t("غير محدد"),
              },

            ].map((d) => (
              <div className={styles.detailRow} key={d.label}>
                <div className={styles.detailIcon}>{d.icon}</div>
                <div>
                  <div className={styles.detailLabel}>{d.label}</div>
                  <div className={styles.detailVal}>{d.val}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Links - only show if at least one link exists */}
        {(() => {
          const allLinks = [
            {
              icon: <InstagramIcon />,
              label: t("إنستجرام"),
              link: socialLinks.instagram,
              color: "#E1306C",
            },
            {
              icon: <TwitterIcon />,
              label: t("تويتر"),
              link: socialLinks.twitter,
              color: "#1DA1F2",
            },
          ];
          const activeLinks = allLinks.filter((s) => s.link && s.link.trim() !== "");
          if (activeLinks.length === 0) return null;

          return (
            <div className={styles.card}>
              <div className={styles.cardBody}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>{t("روابط التواصل الاجتماعي")}</span>
                </div>
                {activeLinks.map((s) => (
                  <div className={styles.socialRow} key={s.label}>
                    <div className={styles.socialIcon} style={{ color: s.color }}>{s.icon}</div>
                    <div>
                      <div className={styles.socialLabel}>{s.label}</div>
                      <a
                        className={styles.socialLink}
                        href={s.link.startsWith("http") ? s.link : `https://${s.link}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {s.link}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
