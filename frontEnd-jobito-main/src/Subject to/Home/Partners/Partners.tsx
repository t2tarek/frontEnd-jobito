import { useState } from "react";
import Marquee from "react-fast-marquee";
import { useTranslation } from "../../../context/translation-context";
import styles from "./Partners.module.css";

type Partner = {
  id: number;
  name: string;
  logo?: string;
};

const EGYPTIAN_PARTNERS: Partner[] = [
  { id: -1, name: "فودافون مصر", logo: "https://icon.horse/icon/vodafone.com.eg" },
  { id: -2, name: "اتصالات مصر", logo: "https://icon.horse/icon/etisalat.eg" },
  { id: -3, name: "البنك الأهلي المصري", logo: "https://icon.horse/icon/nbe.com.eg" },
  { id: -4, name: "أورانج مصر", logo: "https://icon.horse/icon/orange.eg" },
  { id: -5, name: "طلبات", logo: "https://icon.horse/icon/talabat.com" },
  { id: -6, name: "سويفل", logo: "https://icon.horse/icon/swvl.com" },
  { id: -7, name: "فوري", logo: "https://icon.horse/icon/fawry.com" },
  { id: -8, name: "WE", logo: "https://icon.horse/icon/te.eg" },
];

export default function Partners() {
  const { t } = useTranslation();
  const [partners] = useState<Partner[]>(EGYPTIAN_PARTNERS);

  // Company names are proper nouns — do NOT translate them
  // This prevents animation clash when the translation service updates
  const ReviewCard = ({ logo, name }: { logo?: string; name: string }) => {
    const [imgError, setImgError] = useState(false);
    return (
      <figure className={`${styles.reviewCard} ${(!logo || imgError) ? styles.nameOnly : ""}`} title={name}>
        {logo && !imgError ? (
          <img 
            src={logo} 
            alt={name} 
            className={styles.partnerLogo} 
            onError={() => setImgError(true)}
          />
        ) : (
          <span className={styles.partnerName}>{name}</span>
        )}
      </figure>
    );
  };

  return (
    <div className={styles.testimonial}>
      <h2>
        {t("نثق بهم ويثقون بنا")}
      </h2>

      <div className={styles.marqueeContainer}>
        {/* Row 1: scrolls left */}
        <Marquee
          pauseOnHover={true}
          speed={40}
          gradient={false}
          direction="left"
          className={styles.marqueeBand}
        >
          {partners.map((partner, idx) => (
            <ReviewCard
              key={`row1-${partner.id}-${idx}`}
              logo={partner.logo}
              name={partner.name}
            />
          ))}
        </Marquee>

        {/* Row 2: scrolls right (reverse) */}
        <Marquee
          pauseOnHover={true}
          speed={40}
          gradient={false}
          direction="right"
          className={styles.marqueeBand}
        >
          {/* Reversing the array slightly varies the second row if preferred, 
              but using the same mapping is absolutely fine. */}
          {partners.map((partner, idx) => (
            <ReviewCard
              key={`row2-${partner.id}-${idx}`}
              logo={partner.logo}
              name={partner.name}
            />
          ))}
        </Marquee>
      </div>
    </div>
  );
}
