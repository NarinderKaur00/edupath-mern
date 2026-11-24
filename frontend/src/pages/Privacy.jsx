import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Privacy() {
  useEffect(() => {
    document.body.style.background = "var(--bg)";
    return () => { document.body.style.background = ""; };
  }, []);

  return (
    <div className="content" style={{ maxWidth: 800, margin: "0 auto", padding: "36px 20px" }}>
      <Link to="/" className="btn btn-ghost btn-sm">← Back</Link>
      <h1 className="page-title" style={{ margin: "16px 0" }}>Privacy Policy</h1>
      <section className="panel">
        <p className="muted small">In the spirit of India's <strong>DPDP Act, 2023</strong>. This is a
          student project; adapt before any real-world use.</p>

        <h3 className="panel-title" style={{ marginTop: 16 }}>What we collect</h3>
        <ul className="book-list">
          <li>Your name and email (to create your account).</li>
          <li>Your subject marks (to generate elective/field recommendations).</li>
          <li>Your course enrollments and progress.</li>
        </ul>

        <h3 className="panel-title" style={{ marginTop: 16 }}>Why we use it</h3>
        <ul className="book-list">
          <li>Only to run the recommendation model and show your learning progress.</li>
          <li>We do <strong>not</strong> sell or share your data with third parties.</li>
        </ul>

        <h3 className="panel-title" style={{ marginTop: 16 }}>Your rights</h3>
        <ul className="book-list">
          <li><strong>Consent</strong> — we ask for it at sign-up; you can withdraw by deleting your account.</li>
          <li><strong>Access / portability</strong> — your data can be exported by an admin on request.</li>
          <li><strong>Erasure</strong> — an admin can delete your account and all data anytime.</li>
        </ul>

        <h3 className="panel-title" style={{ marginTop: 16 }}>Retention</h3>
        <p className="muted small">Your data is kept only while your account exists and is removed
          immediately when your account is deleted.</p>
      </section>
    </div>
  );
}
