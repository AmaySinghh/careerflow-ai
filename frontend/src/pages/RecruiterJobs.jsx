import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyJobs, deleteJob, getInterviewQuestions } from "../services/api";

export default function RecruiterJobs() {
  const [jobs, setJobs] = useState([]);
  const [applicantCounts, setApplicantCounts] = useState({});
  const [shortlistedCounts, setShortlistedCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState({});
  const [loadingQuestions, setLoadingQuestions] = useState({});
  const navigate = useNavigate();

  const handleGetQuestions = async (jobId) => {
    setLoadingQuestions((prev) => ({ ...prev, [jobId]: true }));
    try {
      const result = await getInterviewQuestions(jobId);
      setQuestions((prev) => ({ ...prev, [jobId]: result.questions }));
      fetchJobs();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingQuestions((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const fetchJobs = async () => {
    try {
      const result = await getMyJobs();
      setJobs(result.jobs);
      setApplicantCounts(result.applicant_counts || {});
      setShortlistedCounts(result.shortlisted_counts || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (jobId) => {
    if (!confirm("Delete this job? This cannot be undone.")) return;
    try {
      await deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err) {
      alert(err.message);
    }
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return "Salary not disclosed";
    const fmt = (n) => `₹${(n / 100000).toFixed(1)}L`;
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return `Up to ${fmt(max)}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Job Listings</h1>
            <p className="text-gray-400 text-sm mt-1">
              {jobs.length} jobs posted
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              ← Dashboard
            </button>
            <button
              onClick={() => navigate("/recruiter/jobs/create")}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
            >
              + Post New Job
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : jobs.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-4">No jobs posted yet.</p>
            <button
              onClick={() => navigate("/recruiter/jobs/create")}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
            >
              Post Your First Job
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const hasShortlisted = (shortlistedCounts[job.id] || 0) > 0;
              const hasQuestions =
                job.interview_questions && job.interview_questions.length > 0;

              return (
                <div
                  key={job.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-5"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold">{job.title}</h2>
                      <p className="text-purple-400 text-sm">{job.company}</p>
                      <p className="text-gray-400 text-sm mt-1">
                        📍 {job.location}
                      </p>
                      <p className="text-green-400 text-sm mt-1">
                        {formatSalary(job.salary_min, job.salary_max)}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className={`text-xs font-medium ${
                            applicantCounts[job.id] > 0
                              ? "text-blue-400"
                              : "text-gray-500"
                          }`}
                        >
                          👥 {applicantCounts[job.id] || 0} applicant
                          {applicantCounts[job.id] !== 1 ? "s" : ""}
                        </span>
                        {hasShortlisted && (
                          <span className="text-xs text-yellow-400 font-medium">
                            ⭐ {shortlistedCounts[job.id]} shortlisted
                          </span>
                        )}
                      </div>
                      {job.required_skills &&
                        job.required_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {job.required_skills.map((skill, i) => (
                              <span
                                key={i}
                                className="bg-gray-700 text-blue-300 text-xs px-2 py-0.5 rounded"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() =>
                          navigate(`/recruiter/jobs/${job.id}/applicants`)
                        }
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-xs"
                      >
                        View Applicants
                        {applicantCounts[job.id] > 0 && (
                          <span className="ml-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {applicantCounts[job.id]}
                          </span>
                        )}
                      </button>

                      {hasQuestions ? (
                        <div className="bg-green-900 border border-green-700 px-3 py-1.5 rounded text-xs text-green-300 text-center">
                          ✓ Screening Active
                        </div>
                      ) : hasShortlisted ? (
                        <button
                          onClick={() => handleGetQuestions(job.id)}
                          disabled={loadingQuestions[job.id]}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-3 py-1.5 rounded text-xs"
                        >
                          {loadingQuestions[job.id]
                            ? "Generating..."
                            : "✨ Set Screening Questions"}
                        </button>
                      ) : (
                        <button
                          disabled
                          className="bg-gray-600 opacity-40 px-3 py-1.5 rounded text-xs cursor-not-allowed"
                          title="Available after candidates are shortlisted"
                        >
                          ✨ Questions
                        </button>
                      )}

                      <button
                        onClick={() =>
                          navigate(`/recruiter/jobs/${job.id}/edit`)
                        }
                        className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1.5 rounded text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {questions[job.id] && (
                    <div className="mt-4 border-t border-gray-700 pt-4">
                      <p className="text-xs text-indigo-300 font-medium mb-3">
                        ✨ Screening Questions
                      </p>
                      <div className="space-y-2">
                        {questions[job.id].map((q, i) => (
                          <div key={i} className="bg-gray-700 rounded p-3">
                            <span
                              className={`text-xs px-2 py-0.5 rounded mr-2 ${
                                q.type === "Technical"
                                  ? "bg-blue-900 text-blue-300"
                                  : q.type === "Problem Solving"
                                    ? "bg-yellow-900 text-yellow-300"
                                    : q.type === "Behavioral"
                                      ? "bg-green-900 text-green-300"
                                      : "bg-purple-900 text-purple-300"
                              }`}
                            >
                              {q.type}
                            </span>
                            <span className="text-sm text-gray-300">
                              {q.question}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
