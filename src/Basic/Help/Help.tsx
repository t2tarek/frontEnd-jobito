import { useState, useEffect } from "react";
import { useJobitoAuth } from "../../context/LinkContxt";
import styles from "./Help.module.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5200";

interface HelpArticle {
  articleId: number;
  title: string;
  titleEn?: string;
  content: string;
  contentEn?: string;
  categoryId: number;
}

interface HelpCategory {
  helpCategoryId: number;
  name: string;
  nameEn?: string;
  icon?: string;
  articles?: HelpArticle[];
}

const HelpCenter = () => {
  const { apiFetch } = useJobitoAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | null>(
    null,
  );
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchHelpData = async () => {
      try {
        setIsLoading(true);
        const res = await apiFetch(`${API_BASE_URL}/api/support/help/categories`);
        if (!res.ok) throw new Error("Failed to fetch help categories");
        const data: HelpCategory[] = await res.json();
        setCategories(data);
        if (data.length > 0) {
          setSelectedCategory(data[0]);
          setArticles(data[0].articles || []);
        }
      } catch (err) {
        console.error("Error loading help center:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHelpData();
  }, [apiFetch]);

  const handleCategoryChange = (cat: HelpCategory) => {
    setSelectedCategory(cat);
    setArticles(cat.articles || []);
  };

  const getDisplayName = (item: {
    name?: string;
    nameEn?: string;
    title?: string;
    titleEn?: string;
  }) => {
    return item.name || item.title;
  };

  const getContent = (article: HelpArticle) => {
    return article.content;
  };

  const handleFeedback = (articleId: number, value: string) => {
    setFeedback((prev) => ({
      ...prev,
      [articleId]: value,
    }));
  };

  const filteredArticles = articles.filter(
    (article) =>
      getDisplayName(article)
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      getContent(article)?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className={styles.helpCenter}>
      {/* Header with search */}
      <header className={styles.helpHeader}>
        <div className={styles.headerContent}>
          <h1>مركز المساعدة</h1>
          <div className={styles.searchContainer}>
            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder="كيف يمكننا مساعدتك؟"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className={styles.searchButton}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M19 19L15 15"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                بحث
              </button>
            </div>
            <div className={styles.sortDropdown}>
              <label>ترتيب حسب:</label>
              <select>
                <option>الأكثر صلة</option>
                <option>الأحدث</option>
                <option>أبجدي</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className={styles.mainContent}>
        {/* Sidebar with categories */}
        <aside className={styles.categoriesSidebar}>
          <h2>الفئات</h2>
          <nav>
            {categories.map((category) => (
              <button
                key={category.helpCategoryId}
                className={`${styles.categoryLink} ${selectedCategory?.helpCategoryId === category.helpCategoryId ? styles.categoryLinkActive : ""}`}
                onClick={() => handleCategoryChange(category)}
              >
                {getDisplayName(category)}
              </button>
            ))}
          </nav>
        </aside>

        {/* Articles section */}
        <main className={styles.articlesSection}>
          {isLoading ? (
            <div className={styles.loading}>جاري التحميل...</div>
          ) : filteredArticles.length > 0 ? (
            filteredArticles.map((article) => (
              <article key={article.articleId} className={styles.helpArticle}>
                <h2>{getDisplayName(article)}</h2>
                <p className={styles.articleContent}>{getContent(article)}</p>

                <div className={styles.articleFeedback}>
                  <span className={styles.feedbackLabel}>
                    هل كان هذا المقال مفيداً؟
                  </span>
                  <div className={styles.feedbackButtons}>
                    <button
                      className={`${styles.feedbackBtn} ${feedback[article.articleId] === "yes" ? styles.feedbackBtnYesActive : ""}`}
                      onClick={() => handleFeedback(article.articleId, "yes")}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5 8L7 10L11 6M15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      نعم
                    </button>
                    <button
                      className={`${styles.feedbackBtn} ${feedback[article.articleId] === "no" ? styles.feedbackBtnNoActive : ""}`}
                      onClick={() => handleFeedback(article.articleId, "no")}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 10L6 6M10 6L6 10M15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      لا
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className={styles.noResults}>
              <p>لا توجد مقالات تطابق بحثك.</p>
            </div>
          )}

          {/* Contact section */}
          <div className={styles.contactSection}>
            <h3>لم تجد ما تبحث عنه؟</h3>
            <button className={styles.contactButton}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 6L10 11L18 6M4 16H16C17.1046 16 18 15.1046 18 14V6C18 4.89543 17.1046 4 16 4H4C2.89543 4 2 4.89543 2 6V14C2 15.1046 2.89543 16 4 16Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              تواصل مع الدعم
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HelpCenter;
