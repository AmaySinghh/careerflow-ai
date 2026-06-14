import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createJob } from "../services/api";

export default function CreateJob() {
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    salary_min: "",
    salary_max: "",
    description: "",
    required_skills: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      await createJob({
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Post a New Job</h1>
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
              placeholder="e.g. Python Backend Developer"
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
              placeholder="e.g. Acme Corp"
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
              placeholder="e.g. Bangalore, Karnataka"
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
                placeholder="e.g. 500000"
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
                placeholder="e.g. 800000"
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
              placeholder="Describe the role, responsibilities, and requirements..."
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
              placeholder="e.g. Python, FastAPI, PostgreSQL, Docker"
              className={inputClass}
            />
            <p className="text-gray-500 text-xs mt-1">
              These skills are used for candidate match scoring.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded font-medium"
          >
            {loading ? "Posting..." : "Post Job"}
          </button>
        </form>
      </div>
    </div>
  );
}
