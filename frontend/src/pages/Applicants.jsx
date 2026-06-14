import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getJobApplicants,
  updateApplicationStatus,
  getCandidateSummary,
} from "../services/api";

const STATUSES = [
  "Applied",
  "Shortlisted",
  "Interview",
  "Rejected",
  "Selected",
];

const STATUS_COLORS = {
  Applied: "bg-gray-700 text-gray-300",
  Shortlisted: "bg-blue-900 text-blue-300",
  Interview: "bg-yellow-900 text-yellow-300",
  Rejected: "bg-red-900 text-red-300",
  Selected: "bg-green-900 text-green-300",
};

const RANK_BADGES = ["🥇", "🥈", "🥉"];

export default function Applicants() {
  const { jobId } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summaries, setSummaries] = useState({});
  const [loadingSummary, setLoadingSummary] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    getJobApplicants(jobId)
      .then(setApplicants)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleGetSummary = async (applicationId) => {
    setLoadingSummary((prev) => ({ ...prev, [applicationId]: true }));
    try {
      const result = await getCandidateSummary(applicationId);
      setSummaries((prev) => ({ ...prev, [applicationId]: result.summary }));
    } catch (err) {
      setSummaries((prev) => ({
        ...prev,
        [applicationId]: "Failed to generate summary.",
      }));
    } finally {
      setLoadingSummary((prev) => ({ ...prev, [applicationId]: false }));
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await updateApplicationStatus(applicationId, newStatus);
      setApplicants((prev) =>
        prev.map((a) =>
          a.id === applicationId ? { ...a, status: newStatus } : a,
        ),
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const highScorerCount = applicants.filter(
    (a) =>
      a.assessment_score !== null &&
      a.assessment_score !== undefined &&
      a.assessment_score >= 60,
  ).length;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Applicants</h1>
            <p className="text-gray-400 text-sm mt-1">
              {applicants.length} applicant(s) — ranked by match score
            </p>
          </div>
          <button
            onClick={() => navigate("/recruiter/jobs")}
            className="text-sm text-gray-400 hover:text-gray-200"
          >
            ← My Jobs
          </button>
        </div>

        {highScorerCount > 0 && (
          <div className="mb-4 bg-green-900 border border-green-700 rounded px-4 py-3 flex items-center gap-2">
            <span className="text-lg">🔔</span>
            <p className="text-green-300 text-sm font-medium">
              {highScorerCount} candidate
              {highScorerCount !== 1 ? "s have" : " has"} scored 60+ on the
              screening assessment — ready for selection review.
            </p>
          </div>
        )}

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : applicants.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">No applications yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applicants.map((applicant, index) => (
              <div
                key={applicant.id}
                className={`bg-gray-800 border rounded-lg p-5 ${
                  index === 0
                    ? "border-yellow-600"
                    : index === 1
                      ? "border-gray-400"
                      : index === 2
                        ? "border-orange-700"
                        : "border-gray-700"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      {index < 3 && (
                        <span className="text-xl">{RANK_BADGES[index]}</span>
                      )}
                      <h2 className="text-lg font-semibold">
                        {applicant.candidate_name || "Unknown"}
                      </h2>
                      {index < 3 && (
                        <span className="text-xs text-gray-400">
                          #{index + 1} ranked
                        </span>
                      )}
                      {applicant.assessment_score !== null &&
                        applicant.assessment_score !== undefined &&
                        applicant.assessment_score >= 60 && (
                          <span
                            className="text-lg"
                            title="High scorer — consider selecting"
                          >
                            🔔
                          </span>
                        )}
                    </div>
                    <p className="text-gray-400 text-sm ml-7">
                      {applicant.candidate_email}
                    </p>
                  </div>
                  <select
                    value={applicant.status}
                    onChange={(e) =>
                      handleStatusChange(applicant.id, e.target.value)
                    }
                    className={`text-xs px-2 py-1 rounded border-0 cursor-pointer ${STATUS_COLORS[applicant.status]}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-6 mt-3">
                  {applicant.resume_score !== null && (
                    <div>
                      <p className="text-xs text-gray-500">Resume Score</p>
                      <p className="text-purple-400 font-bold text-lg">
                        {applicant.resume_score}/100
                      </p>
                    </div>
                  )}
                  {applicant.match_score !== null && (
                    <div>
                      <p className="text-xs text-gray-500">Job Match</p>
                      <p
                        className={`font-bold text-lg ${
                          applicant.match_score >= 70
                            ? "text-green-400"
                            : applicant.match_score >= 40
                              ? "text-yellow-400"
                              : "text-red-400"
                        }`}
                      >
                        {applicant.match_score}%
                      </p>
                    </div>
                  )}
                  {applicant.assessment_score !== null &&
                    applicant.assessment_score !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500">Assessment</p>
                        <div className="flex items-center gap-1">
                          <p
                            className={`font-bold text-lg ${
                              applicant.assessment_score >= 70
                                ? "text-green-400"
                                : applicant.assessment_score >= 40
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }`}
                          >
                            {applicant.assessment_score}/100
                          </p>
                          {applicant.assessment_score >= 60 && (
                            <span className="text-base">🔔</span>
                          )}
                        </div>
                      </div>
                    )}
                  <div>
                    <p className="text-xs text-gray-500">Applied</p>
                    <p className="text-gray-300 text-sm">
                      {new Date(applicant.applied_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {applicant.assessment_feedback && (
                  <div className="mt-3 bg-indigo-950 border border-indigo-800 rounded p-3">
                    <p className="text-xs text-indigo-300 font-medium mb-1">
                      Screening Assessment Feedback
                    </p>
                    <p className="text-sm text-gray-300">
                      {applicant.assessment_feedback}
                    </p>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {applicant.strength_skills &&
                    applicant.strength_skills.length > 0 && (
                      <div>
                        <p className="text-xs text-green-500 mb-1">
                          ✓ Strengths
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {applicant.strength_skills.map((skill, i) => (
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
                  {applicant.missing_skills &&
                    applicant.missing_skills.length > 0 && (
                      <div>
                        <p className="text-xs text-red-500 mb-1">
                          ✗ Missing Skills
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {applicant.missing_skills.map((skill, i) => (
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

                {applicant.resume_skills &&
                  applicant.resume_skills.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">
                        All Candidate Skills
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {applicant.resume_skills.map((skill, i) => (
                          <span
                            key={i}
                            className="bg-gray-700 text-blue-300 text-xs px-2 py-0.5 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="mt-3 border-t border-gray-700 pt-3">
                  <button
                    onClick={() => handleGetSummary(applicant.id)}
                    disabled={loadingSummary[applicant.id]}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded"
                  >
                    {loadingSummary[applicant.id]
                      ? "Generating..."
                      : "✨ AI Summary"}
                  </button>
                  {summaries[applicant.id] && (
                    <div className="mt-2 bg-indigo-950 border border-indigo-800 rounded p-3">
                      <p className="text-xs text-indigo-300 font-medium mb-1">
                        AI Candidate Summary
                      </p>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">
                        {summaries[applicant.id]}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
