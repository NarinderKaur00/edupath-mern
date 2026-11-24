import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="panel">
      <div className="empty">
        <div className="empty-ico">🔍</div>
        <p>Page not found.</p>
        <Link to="/dashboard" className="btn btn-primary btn-sm">← Back to Dashboard</Link>
      </div>
    </div>
  );
}
