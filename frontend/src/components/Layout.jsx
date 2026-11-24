import { NavLink, useNavigate } from "react-router-dom";
import { getUser, clearAuth } from "../api.js";
import Advisor from "../pages/Advisor.jsx";

function LogoutLink() {
  const navigate = useNavigate();
  return (
    <a className="nav-item logout" style={{ cursor: "pointer" }}
      onClick={() => { clearAuth(); navigate("/login"); }}>
      <span className="ico">🚪</span> Sign Out
    </a>
  );
}

function Sidebar() {
  const item = ({ isActive }) => "nav-item" + (isActive ? " active" : "");
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">🎓</div>
        <div className="brand-text">
          <strong>EduPath</strong>
          <span>Elective Advisor</span>
        </div>
      </div>
      <nav className="nav">
        <NavLink to="/dashboard" className={item}><span className="ico">🏠</span> Dashboard</NavLink>
        <NavLink to="/marks" className={item}><span className="ico">📝</span> My Results</NavLink>
        <NavLink to="/history" className={item}><span className="ico">🕑</span> Recommendations</NavLink>
        <NavLink to="/courses" className={item}><span className="ico">📚</span> Courses &amp; Curriculum</NavLink>
        <NavLink to="/my-learning" className={item}><span className="ico">✅</span> My Learning</NavLink>
        <NavLink to="/fields" className={item}><span className="ico">🧭</span> Fields &amp; Electives</NavLink>
      </nav>
      <div className="sidebar-foot"><LogoutLink /></div>
    </aside>
  );
}

function Topbar({ title, sub }) {
  const user = getUser();
  return (
    <header className="topbar">
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="page-sub">{sub}</p>
      </div>
      {user && (
        <div className="user-chip">
          <div className="avatar">{(user.name || "?")[0].toUpperCase()}</div>
          <div className="user-meta">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
        </div>
      )}
    </header>
  );
}

// Full signed-in layout: sidebar + topbar + content + floating advisor.
export default function Layout({ title, sub, children }) {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <Topbar title={title} sub={sub} />
        <main className="content">{children}</main>
      </div>
      <Advisor />
    </div>
  );
}
