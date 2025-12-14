import React from "react";
import { useNavigate } from "react-router-dom";
import Testimonials from "../../components/homepage/Testimonials";
import styles from "./home.module.css";

export function Home() {
  const navigate = useNavigate();

  return (
    <div className={styles.homeContainer}>
      {/* HERO SECTION */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Welcome to <span>IELTS Hub</span></h1>
          <p className={styles.subtitle}>
            Practice your IELTS Speaking and Writing with AI feedback, quizzes, and real-time lessons.
          </p>
          <button className={styles.ctaButton} onClick={() => navigate("/courses")}>
            Start Learning
          </button>
        </div>
        <img
          src="/assets/hero-image.svg"
          alt="Learning"
          className={styles.heroImage}
        />
      </section>

      {/* FEATURES SECTION */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Why Choose IELTS Hub?</h2>
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
            <p>Track your IELTS band improvement over time.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>Community Support</h3>
            <p>Discuss, share tips, and connect with other learners.</p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <Testimonials />

      {/* COURSES PREVIEW */}
      <section className={styles.courses}>
        <h2 className={styles.sectionTitle}>Popular Courses</h2>
        <div className={styles.courseGrid}>
          {["Speaking Mastery", "Writing Task 2 Pro", "Listening Boost"].map((course, i) => (
            <div key={i} className={styles.courseCard}>
              <img
                src={`/assets/course-${i + 1}.jpg`}
                alt={course}
                className={styles.courseImage}
              />
              <h3>{course}</h3>
              <p>Short description for {course} course.</p>
              <button
                className={styles.learnMore}
                onClick={() => navigate(`/courses/${i + 1}`)}
              >
                Learn More →
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
export default Home;