import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRecruiterStats } from "../services/api";

function DonutChart({ stats }) {
  const total = stats.total_applicants;
  if (!total) return null;

  const segments = [
    { label: "Pending", value: stats.pending, color: "#6B7280" },
    { label: "Shortlisted", value: stats.shortlisted, color: "#3B82F6" },
    { label: "Interview", value: stats.interviews, color: "#EAB308" },
    { label: "Selected", value: stats.selected, color: "#22C55E" },
    { label: "Rejected", value: stats.rejected, color: "#EF4444" },
  ].filter((s) => s.value > 0);

  const cx = 60;
  const cy = 60;
  const r = 50;
  const innerR = 30;
  let cumAngle = -Math.PI / 2;

  const paths = segments.map((seg) => {
    const angle = (seg.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    const x2 = cx + r * Math.cos(cumAngle + angle);
    const y2 = cy + r * Math.sin(cumAngle + angle);
    const ix1 = cx + innerR * Math.cos(cumAngle);
    const iy1 = cy + innerR * Math.sin(cumAngle);
    const ix2 = cx + innerR * Math.cos(cumAngle + angle);
    const iy2 = cy + innerR * Math.sin(cumAngle + angle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
    cumAngle += angle;
    return { ...seg, d };
  });

  return (
    <div className="bg-gray-700 rounded-lg p-4 mb-4">
      <p className="text-sm font-medium text-gray-300 mb-3">
        Application Pipeline
      </p>
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 120 120" className="w-28 h-28 flex-shrink-0">
          {paths.map((p, i) => (
            <path key={i} d={p.d} fill={p.color} />
          ))}
          <text
            x="60"
            y="56"
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill="white"
          >
            {total}
          </text>
          <text x="60" y="68" textAnchor="middle" fontSize="7" fill="#9CA3AF">
            total
          </text>
        </svg>
        <div className="flex flex-col gap-1.5">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-xs text-gray-300">{seg.label}</span>
              <span className="text-xs font-medium text-white ml-auto pl-4">
                {seg.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  const isRecruiter = user?.role === "recruiter";

  useEffect(() => {
    if (isRecruiter) {
      getRecruiterStats()
        .then(setStats)
        .catch(() => {});
    }
  }, [isRecruiter]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">
              {isRecruiter ? "Recruiter Portal" : "Job Seeker Portal"}
            </p>
          </div>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
          >
            Log Out
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-5 mb-6">
          <p className="text-lg">Welcome, {user.full_name || user.email}</p>
          <p className="text-gray-400 text-sm">{user.email}</p>
          <span
            className={`inline-block mt-2 text-xs px-2 py-1 rounded font-medium ${
              isRecruiter
                ? "bg-purple-900 text-purple-300"
                : "bg-blue-900 text-blue-300"
            }`}
          >
            {isRecruiter ? "Recruiter" : "Job Seeker"}
          </span>
        </div>

        {isRecruiter ? (
          <div className="space-y-4">
            {stats && (
              <>
                <div className="grid grid-cols-3 gap-3 mb-2">
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-purple-400">
                      {stats.total_jobs}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">Jobs Posted</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-400">
                      {stats.total_applicants}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Total Applicants
                    </p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-400">
                      {stats.pending}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">Pending</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-400">
                      {stats.shortlisted}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">Shortlisted</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-orange-400">
                      {stats.interviews}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">Interview</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">
                      {stats.selected}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">Selected</p>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4 text-center mb-2">
                  <p className="text-2xl font-bold text-red-400">
                    {stats.rejected}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">Rejected</p>
                </div>

                <DonutChart stats={stats} />
              </>
            )}

            <h2 className="text-lg font-semibold">Recruiter Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate("/recruiter/jobs")}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded text-sm font-medium"
              >
                My Job Listings
              </button>
              <button
                onClick={() => navigate("/recruiter/jobs/create")}
                className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded text-sm font-medium"
              >
                Post a New Job
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold mb-3">Candidate Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate("/resume-upload")}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded text-sm font-medium"
              >
                Upload & Analyze Resume
              </button>
              <button
                onClick={() => navigate("/jobs")}
                className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded text-sm font-medium"
              >
                Browse Jobs
              </button>
              <button
                onClick={() => navigate("/applications")}
                className="bg-yellow-600 hover:bg-yellow-700 px-4 py-3 rounded text-sm font-medium"
              >
                My Applications
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
