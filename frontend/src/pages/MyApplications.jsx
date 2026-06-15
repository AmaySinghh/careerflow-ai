import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyApplications } from "../services/api";

const STATUS_COLORS = {
  Applied: "bg-gray-700 text-gray-300",
  Shortlisted: "bg-blue-900 text-blue-300",
  Interview: "bg-yellow-900 text-yellow-300",
  Rejected: "bg-red-900 text-red-300",
  Selected: "bg-green-900 text-green-300",
};

function getMissingAndStrengths(candidateSkills, requiredSkills) {
  if (!requiredSkills || requiredSkills.length === 0)
    return { missing: [], strengths: [] };
  if (!candidateSkills || candidateSkills.length === 0)
    return { missing: requiredSkills, strengths: [] };
  const candidateSet = new Set(candidateSkills.map((s) => s.toLowerCase()));
  const missing = requiredSkills.filter(
    (s) => !candidateSet.has(s.toLowerCase()),
  );
  const strengths = requiredSkills.filter((s) =>
    candidateSet.has(s.toLowerCase()),
  );
  return { missing, strengths };
}

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getMyApplications()
      .then(setApplications)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Applications</h1>
            <p className="text-gray-400 text-sm mt-1">
              {applications.length} application(s)
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-gray-400 hover:text-gray-200"
          >
            ← Dashboard
          </button>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : applications.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-4">No applications yet.</p>
            <button
              onClick={() => navigate("/jobs")}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
            >
              Browse Jobs
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const { missing, strengths } = getMissingAndStrengths(
                app.candidate_skills || [],
                app.job_required_skills,
              );

              return (
                <div
                  key={app.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold">{app.job_title}</h2>
                      <p className="text-blue-400 text-sm">{app.job_company}</p>
                      <p className="text-gray-400 text-sm mt-1">
                        📍 {app.job_location}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded font-medium ${
                        STATUS_COLORS[app.status] || STATUS_COLORS.Applied
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <div className="flex gap-6 mt-3">
                    {app.match_score !== null &&
                      app.match_score !== undefined && (
                        <div>
                          <p className="text-xs text-gray-500">Job Match</p>
                          <p
                            className={`font-bold text-lg ${
                              app.match_score >= 70
                                ? "text-green-400"
                                : app.match_score >= 40
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }`}
                          >
                            {app.match_score}%
                          </p>
                        </div>
                      )}
                    {app.assessment_score !== null &&
                      app.assessment_score !== undefined && (
                        <div>
                          <p className="text-xs text-gray-500">
                            Assessment Score
                          </p>
                          <p
                            className={`font-bold text-lg ${
                              app.assessment_score >= 70
                                ? "text-green-400"
                                : app.assessment_score >= 40
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }`}
                          >
                            {app.assessment_score}/100
                          </p>
                        </div>
                      )}
                    <div>
                      <p className="text-xs text-gray-500">Applied On</p>
                      <p className="text-gray-300 text-sm">
                        {new Date(app.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {app.job_required_skills &&
                    app.job_required_skills.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {strengths.length > 0 && (
                          <div>
                            <p className="text-xs text-green-500 mb-1">
                              ✓ Your Strengths
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {strengths.map((skill, i) => (
                                <span
                                  key={i}
                                  className="bg-green-900 text-green-300 text-xs px-2 py-0.5 rounded"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {missing.length > 0 && (
                          <div>
                            <p className="text-xs text-red-500 mb-1">
                              ✗ Skills to Learn
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {missing.map((skill, i) => (
                                <span
                                  key={i}
                                  className="bg-red-900 text-red-300 text-xs px-2 py-0.5 rounded"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  <div className="mt-4 pt-3 border-t border-gray-700 flex items-center gap-3">
                    {app.assessment_score !== null &&
                    app.assessment_score !== undefined ? (
                      <span className="text-xs text-green-400">
                        ✓ Screening completed — Score: {app.assessment_score}
                        /100
                      </span>
                    ) : app.status === "Shortlisted" &&
                      app.has_assessment_questions ? (
                      <button
                        onClick={() =>
                          navigate(`/applications/${app.id}/interview`)
                        }
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded"
                      >
                        🎯 Take Screening Assessment
                      </button>
                    ) : app.status === "Shortlisted" &&
                      !app.has_assessment_questions ? (
                      <span className="text-xs text-gray-500">
                        ⏳ Recruiter hasn't set up screening questions yet
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
