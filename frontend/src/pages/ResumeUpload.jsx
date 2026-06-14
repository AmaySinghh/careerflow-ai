import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  uploadResume,
  analyzeResume,
  getMyResumes,
  deleteResume,
} from "../services/api";

function ScoreChart({ history }) {
  const scored = history
    .filter((r) => r.score !== null)
    .slice(0, 8)
    .reverse();
  if (scored.length < 2) return null;

  const max = 100;
  const chartWidth = 400;
  const chartHeight = 120;
  const padLeft = 30;
  const padBottom = 20;
  const innerW = chartWidth - padLeft;
  const innerH = chartHeight - padBottom;

  const points = scored.map((r, i) => {
    const x = padLeft + (i / (scored.length - 1)) * innerW;
    const y = innerH - (r.score / max) * innerH;
    return { x, y, score: r.score, date: r.uploaded_at };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <div className="mt-4">
      <h2 className="text-lg font-semibold mb-2">Score History</h2>
      <div className="bg-gray-900 border border-gray-700 rounded p-3 overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full"
          style={{ minWidth: "280px" }}
        >
          {[0, 25, 50, 75, 100].map((v) => {
            const y = innerH - (v / max) * innerH;
            return (
              <g key={v}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="#374151"
                  strokeWidth="0.5"
                />
                <text
                  x={padLeft - 4}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="8"
                  fill="#9CA3AF"
                >
                  {v}
                </text>
              </g>
            );
          })}
          <path
            d={pathD}
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill="#a855f7" />
              <text
                x={p.x}
                y={p.y - 8}
                textAnchor="middle"
                fontSize="9"
                fill="#e9d5ff"
              >
                {p.score}
              </text>
            </g>
          ))}
        </svg>
        <p className="text-xs text-gray-500 text-center mt-1">
          Score trend across your last {scored.length} analyses
        </p>
      </div>
    </div>
  );
}

function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resumeId, setResumeId] = useState(null);

  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");

  const [history, setHistory] = useState([]);

  const navigate = useNavigate();

  const fetchHistory = async () => {
    try {
      const resumes = await getMyResumes();
      setHistory(resumes);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setAnalysis(null);
    setAnalyzeError("");

    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setLoading(true);
    try {
      const result = await uploadResume(file);
      setSuccess(result);
      setResumeId(result.id);
      setFile(null);
      fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzeError("");
    setAnalysis(null);
    setAnalyzing(true);
    try {
      const result = await analyzeResume(resumeId);
      setAnalysis(result);
      fetchHistory();
    } catch (err) {
      setAnalyzeError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeFromHistory = async (id) => {
    setResumeId(id);
    setAnalysis(null);
    setAnalyzeError("");
    setAnalyzing(true);
    try {
      const result = await analyzeResume(id);
      setAnalysis(result);
      fetchHistory();
    } catch (err) {
      setAnalyzeError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteResume = async (id, filename) => {
    const confirmed = confirm(`Delete "${filename}"?`);
    if (!confirmed) return;
    try {
      const result = await deleteResume(id);
      if (result.had_applications) {
        alert(
          `Resume deleted. Note: This resume was used in ${result.application_count} application(s). Your applications remain active but the recruiter can no longer view this resume.`,
        );
      }
      setHistory((prev) => prev.filter((r) => r.id !== id));
      if (resumeId === id) {
        setResumeId(null);
        setAnalysis(null);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Resume</h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-gray-400 hover:text-gray-200"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-4">Upload New Resume</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-sm text-gray-300 bg-gray-700 border border-gray-600 rounded p-2 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white file:text-sm file:cursor-pointer hover:file:bg-blue-700"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && (
              <p className="text-green-400 text-sm">
                Uploaded "{success.filename}" successfully.
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded"
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
          </form>
        </div>

        {history.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <h2 className="text-lg font-semibold mb-3">Resume History</h2>
            <div className="space-y-2">
              {history.map((r) => (
                <div
                  key={r.id}
                  className="flex justify-between items-center bg-gray-700 rounded px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{r.filename}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs text-gray-400">
                        {new Date(r.uploaded_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      {r.score !== null && (
                        <span className="text-xs text-purple-400 font-medium">
                          Score: {r.score}/100
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAnalyzeFromHistory(r.id)}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded"
                    >
                      Analyze
                    </button>
                    <button
                      onClick={() => handleDeleteResume(r.id, r.filename)}
                      className="bg-red-700 hover:bg-red-800 text-white text-xs px-3 py-1.5 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <ScoreChart history={history} />
          </div>
        )}

        {(resumeId || analyzing) && (
          <div className="bg-gray-800 p-6 rounded-lg">
            {!analysis && !analyzing && (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2 rounded"
              >
                Analyze Resume
              </button>
            )}

            {analyzing && (
              <p className="text-gray-400 text-sm text-center py-4">
                Analyzing your resume...
              </p>
            )}

            {analyzeError && (
              <p className="text-red-400 text-sm mt-2">{analyzeError}</p>
            )}

            {analysis && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold">Score</h2>
                    <p className="text-3xl font-bold text-purple-400">
                      {analysis.score} / 100
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const preferredSkills = analysis.skills.filter(
                        (s) =>
                          !["C/C++", "C++", "C", "Arduino", "ROS"].includes(s),
                      );
                      const searchSkills =
                        preferredSkills.length > 0
                          ? preferredSkills.slice(0, 2)
                          : analysis.skills.slice(0, 2);
                      navigate(
                        `/jobs?search=${encodeURIComponent(searchSkills[0])}`,
                      );
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded"
                  >
                    Find Matching Jobs →
                  </button>
                </div>

                <div>
                  <h2 className="text-lg font-semibold">Detected Skills</h2>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {analysis.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="bg-gray-700 text-blue-300 text-xs px-2 py-1 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold">Suggestions</h2>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    {analysis.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Enhanced Resume Text
                  </h2>
                  <pre className="whitespace-pre-wrap text-sm text-gray-300 bg-gray-900 border border-gray-700 rounded p-3 max-h-96 overflow-y-auto">
                    {analysis.enhanced_text}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ResumeUpload;
