import { Routes, Route, Navigate } from "react-router-dom";
import { getToken, getAdminToken } from "./api.js";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Marks from "./pages/Marks.jsx";
import Recommendation from "./pages/Recommendation.jsx";
import History from "./pages/History.jsx";
import Courses from "./pages/Courses.jsx";
import CourseDetail from "./pages/CourseDetail.jsx";
import MyLearning from "./pages/MyLearning.jsx";
import Fields from "./pages/Fields.jsx";
import Privacy from "./pages/Privacy.jsx";
import NotFound from "./pages/NotFound.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

function Protected({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}
function AdminProtected({ children }) {
  return getAdminToken() ? children : <Navigate to="/admin/login" replace />;
}

// Signed-in page wrapped in the standard Layout (fixed title/sub).
const S = (title, sub, el) => <Protected><Layout title={title} sub={sub}>{el}</Layout></Protected>;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminProtected><AdminDashboard /></AdminProtected>} />

      <Route path="/dashboard" element={S("Dashboard", "Your elective recommendation overview", <Dashboard />)} />
      <Route path="/marks" element={S("My Academic Results", "Enter the marks you scored (0–100). Leave a subject at 0 if you didn't take it.", <Marks />)} />
      <Route path="/history" element={S("Recommendation History", "Every recommendation you've generated", <History />)} />
      <Route path="/recommendation" element={S("Your Elective Recommendations", "Ranked by how well they fit you", <Recommendation />)} />
      <Route path="/recommendation/:id" element={S("Your Elective Recommendations", "Ranked by how well they fit you", <Recommendation />)} />
      <Route path="/courses" element={S("Courses & Curriculum", "The full B.E. (CSE) scheme, semester by semester", <Courses />)} />
      {/* CourseDetail renders its own Layout so the topbar title is the course */}
      <Route path="/course/:code" element={<Protected><CourseDetail /></Protected>} />
      <Route path="/my-learning" element={S("My Learning", "Your enrolled courses and progress", <MyLearning />)} />
      <Route path="/fields" element={S("Fields & Electives", "Choose a specialization track (Elective Focus) and plan your electives", <Fields />)} />

      <Route path="/" element={<Navigate to={getToken() ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={S("Not found", "", <NotFound />)} />
    </Routes>
  );
}
