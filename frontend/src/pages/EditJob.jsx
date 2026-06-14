import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMyJobs, updateJob } from "../services/api";

export default function EditJob() {
  const { jobId } = useParams();
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getMyJobs().then((result) => {
      const job = result.jobs.find((j) => j.id === parseInt(jobId));
      if (job) {
        setForm({
          title: job.title,
          company: job.company,
          location: job.location,
          salary_min: job.salary_min || "",
          salary_max: job.salary_max || "",
          description: job.description,
          required_skills: (job.required_skills || []).join(", "),
        });
      }
    });
  }, [jobId]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const skills = form.required_skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await updateJob(parseInt(jobId), {
        title: form.title,
        company: form.company,
        location: form.location,
        salary_min: form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max) : null,
        description: form.description,
        required_skills: skills,
      });
      navigate("/recruiter/jobs");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500";

  if (!form)
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 text-gray-400">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Job</h1>
          <button
            onClick={() => navigate("/recruiter/jobs")}
            className="text-sm text-gray-400 hover:text-gray-200"
          >
            ← Back
          </button>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-gray-800 rounded-lg p-6"
        >
          <div>
            <label className="block text-gray-300 text-sm mb-1">
              Job Title *
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">
              Company *
            </label>
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">
              Location *
            </label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-gray-300 text-sm mb-1">
                Min Salary (₹/year)
              </label>
              <input
                name="salary_min"
                value={form.salary_min}
                onChange={handleChange}
                type="number"
                className={inputClass}
              />
            </div>
            <div className="flex-1">
              <label className="block text-gray-300 text-sm mb-1">
                Max Salary (₹/year)
              </label>
              <input
                name="salary_max"
                value={form.salary_max}
                onChange={handleChange}
                type="number"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">
              Job Description *
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={5}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">
              Required Skills (comma-separated)
            </label>
            <input
              name="required_skills"
              value={form.required_skills}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white py-2 rounded font-medium"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
