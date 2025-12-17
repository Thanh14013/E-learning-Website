import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "../../services/toastService";
import Testimonials from "../../components/homepage/Testimonials";
import styles from "./home.module.css";

export function Home() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 12;

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get("/courses?limit=40");
        const coursesData = response.data.data || [];
        console.log("📚 Fetched courses:", coursesData);
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast.error("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchValue)}`);
    }
  };

  // Pagination logic
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const displayedCourses = showAll
    ? courses.slice(indexOfFirstCourse, indexOfLastCourse)
    : courses.slice(0, 4);
  const totalPages = Math.ceil(courses.length / coursesPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 800, behavior: "smooth" });
  };

  return (
    <div className={styles.homeContainer}>
      {/* HERO SECTION */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Welcome to <span>MasterDev</span></h1>
          <p className={styles.subtitle}>
            Practice your coding skills with interactive lessons, real-time feedback, and a supportive community.
          </p>

          {/* Search Bar */}
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="🔍 Search for courses, lessons..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
              Search
            </button>
          </form>
        </div>
        <img
          src="/assets/hero-image.svg"
          alt="Learning"
          className={styles.heroImage}
        />
      </section>

      {/* COURSES PREVIEW - Right after search */}
      <section className={styles.coursesPreview}>
        <h2 className={styles.sectionTitle}>Popular Courses</h2>

        {loading ? (
          <div className={styles.loading}>Loading courses...</div>
        ) : !courses || courses.length === 0 ? (
          <div className={styles.noCourses}>No courses available</div>
        ) : (
          <>
            <div className={styles.courseGridPreview}>
              {courses.slice(0, 4).map((course) => (
                <div key={course._id} className={styles.courseCard} onClick={() => navigate(`/courses/${course._id}`)}>
                  <img
                    src={course.thumbnail || "https://via.placeholder.com/400x250?text=Course"}
                    alt={course.title}
                    className={styles.courseImage}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/400x250?text=Course";
                    }}
                  />
                  <div className={styles.courseContent}>
                    <div className={styles.courseMeta}>
                      <span className={styles.courseCategory}>{course.category}</span>
                      <span className={styles.courseLevel}>{course.level}</span>
                    </div>
                    <h3>{course.title}</h3>
                    <p className={styles.courseDescription}>
                      {course.description?.substring(0, 80)}
                      {course.description?.length > 80 ? "..." : ""}
                    </p>
                    <div className={styles.courseFooter}>
                      <div className={styles.courseRating}>
                        ⭐ {course.rating?.toFixed(1) || "N/A"}
                        <span className={styles.reviewCount}>({course.totalReviews || 0})</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.viewMoreContainer}>
              <button
                className={styles.viewMoreBtn}
                onClick={() => navigate("/courses")}
              >
                View More →
              </button>
            </div>
          </>
        )}
      </section>

      {/* FEATURES SECTION */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Why Choose MasterDev?</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <h3>AI-Powered Feedback</h3>
            <p>Get instant Speaking and Writing evaluations powered by GPT & DeepSeek APIs.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>Interactive Lessons</h3>
            <p>Learn through videos, quizzes, and live sessions with teachers.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>Progress Tracking</h3>
            <p>Track your coding progress and achievements over time.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>Community Support</h3>
            <p>Discuss, share tips, and connect with other learners.</p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <Testimonials />
    </div>
  );
}

export default Home;