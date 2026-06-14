import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getJobs, applyToJob, getMyApplications } from "../services/api";

const LOCATIONS = [
  "",
  "Bangalore, Karnataka",
  "Mumbai, Maharashtra",
  "Pune, Maharashtra",
  "Chennai, Tamil Nadu",
  "Hyderabad, Telangana",
  "Noida, Uttar Pradesh",
];

const CATEGORIES = [
  { label: "All Categories", keyword: "" },
  { label: "Backend Development", keyword: "backend" },
  { label: "Frontend Development", keyword: "frontend" },
  { label: "Full Stack", keyword: "full stack" },
  { label: "DevOps", keyword: "devops" },
  { label: "Data Engineering", keyword: "data" },
  { label: "Fresher / Entry Level", keyword: "fresher" },
  { label: "Python", keyword: "python" },
  { label: "React", keyword: "react" },
  { label: "Robotics & Automation", keyword: "robotics" },
];

function ApplyButton({ jobId, initialApplied }) {
  const [status, setStatus] = useState(initialApplied ? "applied" : "idle");

  useEffect(() => {
    if (initialApplied) setStatus("applied");
  }, [initialApplied]);

  const handleApply = async () => {
    setStatus("loading");
    try {
      await applyToJob(jobId);
      setStatus("applied");
    } catch (err) {
      if (err.message.includes("Already applied")) {
        setStatus("applied");
      } else if (err.message.includes("Candidate access required")) {
        setStatus("recruiter");
      } else {
        setStatus("error");
      }
    }
  };

  if (status === "applied")
    return <span className="text-green-400 text-sm">✓ Applied</span>;
  if (status === "recruiter") return null;
  if (status === "error")
    return <span className="text-red-400 text-sm">Error applying</span>;

  return (
    <button
      onClick={handleApply}
      disabled={status === "loading"}
      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-3 py-1 rounded"
    >
      {status === "loading" ? "Applying..." : "Apply Now"}
    </button>
  );
}

function Jobs() {
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [applicantCounts, setApplicantCounts] = useState({});
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const navigate = useNavigate();
  const pageSize = 10;

  useEffect(() => {
    getMyApplications()
      .then((apps) => setAppliedJobIds(new Set(apps.map((a) => a.job_id))))
      .catch(() => {});
  }, []);

  const fetchJobs = async (overridePage = page) => {
    setLoading(true);
    setError("");
    try {
      const combinedSearch = [search, category].filter(Boolean).join(" ");
      const result = await getJobs({
        search: combinedSearch,
        location,
        page: overridePage,
        pageSize,
      });
      setJobs(result.jobs);
      setTotal(result.total);
      setApplicantCounts(result.applicant_counts || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(1);
  }, []);

  useEffect(() => {
    fetchJobs(page);
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs(1);
  };

  const totalPages = Math.ceil(total / pageSize);

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
          <h1 className="text-2xl font-bold">Job Listings</h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-gray-400 hover:text-gray-200"
          >
            ← Back to Dashboard
          </button>
        </div>

        {searchParams.get("search") && (
          <div className="mb-4 bg-green-900 border border-green-700 rounded px-4 py-2 text-sm text-green-300">
            Showing jobs matched to your resume skills:{" "}
            <span className="font-medium">{searchParams.get("search")}</span>
          </div>
        )}

        <form onSubmit={handleSearch} className="space-y-3 mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search title, company, skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-400"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
            >
              Search
            </button>
          </div>

          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.keyword} value={c.keyword}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc === "" ? "All Locations" : loc}
                </option>
              ))}
            </select>
          </div>
        </form>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {loading ? (
          <p className="text-gray-400 text-sm">Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <p className="text-gray-400 text-sm">No jobs found.</p>
        ) : (
          <>
            <p className="text-gray-400 text-sm mb-4">{total} jobs found</p>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold">{job.title}</h2>
                      <p className="text-blue-400 text-sm">{job.company}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {job.source === "internal" && (
                        <span className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded">
                          Hiring Now
                        </span>
                      )}
                      <span className="text-green-400 text-sm font-medium">
                        {formatSalary(job.salary_min, job.salary_max)}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">
                    📍 {job.location}
                  </p>
                  {job.source === "internal" && applicantCounts[job.id] > 0 && (
                    <p className="text-gray-500 text-xs mt-0.5">
                      👥 {applicantCounts[job.id]} applicant
                      {applicantCounts[job.id] !== 1 ? "s" : ""}
                    </p>
                  )}
                  <p className="text-gray-300 text-sm mt-3 line-clamp-2">
                    {job.description}
                  </p>
                  <div className="flex gap-3 mt-3 items-center">
                    {job.source === "internal" && (
                      <ApplyButton
                        jobId={job.id}
                        initialApplied={appliedJobIds.has(job.id)}
                      />
                    )}
                    {job.source_url && (
                      <a
                        href={job.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        View Job →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50 text-sm"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-400">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50 text-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Jobs;
