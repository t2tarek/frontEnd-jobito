import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./Messagingapp.module.css";
import { useJobitoAuth } from "../../context/LinkContxt";
import { useTranslation } from "../../context/translation-context";

const EMOJIS = [
  "😊",
  "😂",
  "❤️",
  "👍",
  "🎉",
  "🔥",
  "✨",
  "💯",
  "😍",
  "🙏",
  "👋",
  "😎",
  "🤔",
  "💪",
  "🥳",
  "😅",
  "🫡",
  "🤝",
  "💼",
  "✅",
  "⭐",
  "📌",
  "🎯",
  "📎",
  "😇",
  "🥹",
  "😄",
];

const avatarColors = [
  "#3b5bdb",
  "#12b886",
  "#f03e3e",
  "#fab005",
  "#7950f2",
  "#e64980",
  "#1c7ed6",
  "#37b24d",
];

function Avatar({
  name,
  size = "md",
  color = "",
}: {
  name: string;
  size?: string;
  color?: string;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const bg = color || avatarColors[name.charCodeAt(0) % avatarColors.length];
  const sz =
    size === "lg"
      ? styles.initialsLg
      : size === "sm"
        ? styles.initialsSm
        : styles.initials;
  return (
    <div className={sz} style={{ background: bg }}>
      {initials}
    </div>
  );
}

const getInitialContacts = (t: any) => [
  {
    id: 1,
    name: t("Jan Mayer", "جان ماير"),
    role: t("Recruiter at Nomad", "مسؤول توظيف في نوماد"),
    online: true,
    time: t("12 mins ago", "منذ 12 دقيقة"),
    messages: [
      {
        id: 1,
        from: "them",
        text: t("Hi Jake, I wanted to reach out because we saw your work contributions and were very impressed.", "مرحباً جيك، أردت التواصل معك لأننا رأينا مساهماتك في العمل وكنا معجبين جداً بما قدمته."),
        time: t("12 mins ago", "منذ 12 دقيقة"),
      },
      {
        id: 2,
        from: "them",
        text: t("We'd like to invite you for a quick interview.", "نريد دعوتك لإجراء مقابلة سريعة."),
        time: t("12 mins ago", "منذ 12 دقيقة"),
      },
      {
        id: 3,
        from: "me",
        text: t("Hi Jan, sure I'd love to. Thank you for taking the time to see my work!", "أهلاً جان، بالتأكيد يسعدني ذلك. شكراً لك على وقتك لرؤية أعمالي!"),
        time: t("12 mins ago", "منذ 12 دقيقة"),
      },
    ],
  },
  {
    id: 2,
    name: t("Joe Bartmann", "جو بارتمان"),
    role: t("HR at Devi", "الموارد البشرية في ديفي"),
    online: false,
    time: "3:40 PM",
    messages: [
      {
        id: 1,
        from: "them",
        text: t("Hi, thanks for the interview...", "مرحباً، شكراً لك على المقابلة..."),
        time: "3:40 PM",
      },
    ],
  },
  {
    id: 3,
    name: t("Ally Wells", "آلي ويلز"),
    role: t("Designer at Figma", "مصممة في فيجما"),
    online: false,
    time: "3:40 PM",
    messages: [
      {
        id: 1,
        from: "them",
        text: t("Hi, thanks for the interview...", "مرحباً، شكراً لك على المقابلة..."),
        time: "3:40 PM",
      },
    ],
  },
];

interface MessagingAppProps {
  setShowHeader: (value: boolean) => void;
}

export const MessagingApp: React.FC<MessagingAppProps> = ({
  setShowHeader,
}) => {
  const { t } = useTranslation();
  const { user } = useJobitoAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setShowHeader(false);
    return () => setShowHeader(true);
  }, [setShowHeader]);

  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    setContacts(getInitialContacts(t));
  }, [t]);
  const [activeId, setActiveId] = useState<number | string>(1);
  const [input, setInput] = useState("");
  const processedRef = useRef(false);

  useEffect(() => {
    if (location.state?.preselectedUser) {
      const pUser = location.state.preselectedUser;
      const initialMessage = location.state.initialMessage;

      setContacts((prev) => {
        const existingIndex = prev.findIndex((c) => c.name === pUser.fullName);
        const targetId = existingIndex >= 0 ? prev[existingIndex].id : Date.now();
        
        // Deep copy the array to force React to re-render properly
        const newContacts = prev.map(c => 
          c.id === targetId ? { ...c, messages: [...c.messages] } : c
        );

        if (existingIndex < 0) {
          const newContact = {
            id: targetId,
            name: pUser.fullName,
            role: t("Job Applicant", "متقدم لوظيفة"),
            online: true,
            time: t("Now", "الآن"),
            messages: [],
          };
          newContacts.unshift(newContact);
        }

        const targetContact = newContacts.find(c => c.id === targetId);

        if (initialMessage && targetContact) {
          const hasSent = targetContact.messages.some(
            (m: any) => m.text === initialMessage
          );
          if (!hasSent) {
            const nowStr = new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            targetContact.messages.push({
              id: Date.now() + Math.random(),
              from: "me",
              text: initialMessage,
              time: nowStr,
            });
            targetContact.time = nowStr;
            console.log("📨 Auto-sent initial message to", pUser.fullName);
          }
        }

        setActiveId(targetId);
        return newContacts;
      });
    }
  }, [location.state]);
  const [search, setSearch] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [starred, setStarred] = useState<{ [key: number]: boolean }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const active = contacts.find((c) => c.id === activeId);

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, active?.messages?.length]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const newMsg = { id: Date.now(), from: "me", text, time: timeStr };
    setContacts((prev: any) =>
      prev.map((c: any) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, newMsg], time: timeStr }
          : c,
      ),
    );
    setInput("");
    inputRef.current?.focus();
    setShowEmoji(false);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const lastPreview = (c: { messages: { text: string }[] }) => {
    const last = c.messages[c.messages.length - 1];
    return (
      last?.text?.slice(0, 30) + (last?.text?.length > 30 ? "..." : "") || ""
    );
  };

  return (
    <div
      className={styles.app}
      onClick={() => showEmoji && setShowEmoji(false)}
    >
      {/* SIDEBAR */}
      <div className={styles.sidebar}>
        <div className={styles.searchWrap}>
          <div className={styles.searchBox}>
            <svg
              width="14"
              height="14"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#8892a4"
              strokeWidth="2.5"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              placeholder={t("Search in messages...", "البحث في الرسائل...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.contacts}>
          {filtered.map((c) => (
            <div
              key={c.id}
              className={`${styles.contact} ${c.id === activeId ? styles.contactActive : ""}`}
              onClick={() => setActiveId(c.id)}
            >
              <div className={styles.contactAvatar}>
                <Avatar name={c.name} />
                {c.online && <div className={styles.onlineDot} />}
              </div>
              <div className={styles.contactInfo}>
                <div className={styles.contactTop}>
                  <span className={styles.contactName}>{c.name}</span>
                  <span className={styles.contactTime}>{c.time}</span>
                </div>
                <div className={styles.contactPreview}>{lastPreview(c)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT PANEL */}
      {active ? (
        <div className={styles.chat}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <Avatar name={active.name} />
            <div className={styles.chatHeaderInfo}>
              <div className={styles.chatHeaderName}>{active.name}</div>
              <div className={styles.chatHeaderRole}>{active.role}</div>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.iconBtn} title={t("Pin", "تثبيت")}>
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
              <button
                className={`${styles.iconBtn} ${starred[active.id] ? styles.starred : ""}`}
                onClick={() =>
                  setStarred((s) => ({ ...s, [active.id]: !s[active.id] }))
                }
                title={t("Star", "تميز")}
              >
                ★
              </button>
              <button className={styles.iconBtn} title={t("More", "المزيد")}>
                ⋯
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={styles.messagesArea}>
            <div className={styles.chatIntro}>
              <div className={styles.introAvatar}>
                <Avatar name={active.name} size="lg" />
              </div>
              <div className={styles.introName}>{active.name}</div>
              <div className={styles.introRole}>{active.role}</div>
              <div className={styles.introDesc}>
                {t("This is the beginning of your conversation with", "هذه بداية محادثتك مع")} <b>{active.name}</b>
              </div>
            </div>

            <div className={styles.dayDivider}>
              <div className={styles.dayPill}>
                <svg
                  width="12"
                  height="12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
                {t("Today", "اليوم")}
              </div>
            </div>

            {active.messages.reduce((acc: React.ReactNode[], msg, i) => {
              const isLast =
                !active.messages[i + 1] ||
                active.messages[i + 1].from !== msg.from;
              const isOut = msg.from === "me";

              acc.push(
                <div
                  key={msg.id}
                  className={`${styles.msgRow} ${isOut ? styles.outgoing : ""}`}
                >
                  {!isOut &&
                    (isLast ? (
                      <div className={styles.msgAvatar}>
                        <Avatar name={active.name} size="sm" />
                      </div>
                    ) : (
                      <div className={styles.msgAvatarPlaceholder} />
                    ))}
                  <div
                    className={`${styles.bubble} ${isOut ? styles.outgoingBubble : styles.incomingBubble}`}
                  >
                    {msg.text}
                  </div>
                  {isOut &&
                    (isLast ? (
                      <div className={styles.msgAvatar}>
                        <Avatar
                          name={user?.name || t("You", "أنت")}
                          size="sm"
                          color="#495057"
                        />
                      </div>
                    ) : (
                      <div className={styles.msgAvatarPlaceholder} />
                    ))}
                </div>,
              );

              if (isLast) {
                acc.push(
                    <div
                      key={`meta-${msg.id}`}
                      className={styles.msgMeta}
                      style={{
                        textAlign: isOut ? "left" : "left",
                        paddingLeft: isOut ? "44px" : "44px",
                      }}
                    >
                    {isOut
                      ? `${t("You", "أنت")} · ${msg.time}`
                      : `${active.name.split(" ")[0]} · ${msg.time}`}
                  </div>,
                );
              }
              return acc;
            }, [])}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={styles.inputBar} style={{ position: "relative" }}>
            <button className={styles.attachBtn} title={t("Attach File", "إرفاق ملف")}>
              📎
            </button>
            <input
              ref={inputRef}
              className={styles.msgInput}
              placeholder={t("Write a reply...", "اكتب رداً...")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button
              className={styles.emojiBtn}
              onClick={(e) => {
                e.stopPropagation();
                setShowEmoji((s) => !s);
              }}
              title={t("Emoji", "إيموجي")}
            >
              😊
            </button>
            <button
              className={styles.sendBtn}
              onClick={sendMessage}
              disabled={!input.trim()}
              title={t("Send", "إرسال")}
            >
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>

            {showEmoji && (
              <div
                className={styles.emojiPicker}
                onClick={(e) => e.stopPropagation()}
              >
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => addEmoji(e)}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.chat}>
          <div className={styles.chatPlaceholder}>
            <div className={styles.icon}>💬</div>
            <p>{t("Choose a conversation to start", "اختر محادثة للبدء")}</p>
          </div>
        </div>
      )}
    </div>
  );
};
