import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/api";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("candidate");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await registerUser({ email, password, full_name: fullName, role });
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Create Account
        </h1>

        {error && (
          <div className="bg-red-500/20 text-red-400 text-sm rounded p-2 mb-4">
            {error}
          </div>
        )}

        <label className="block text-gray-300 text-sm mb-1">Full Name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full mb-4 px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
        />

        <label className="block text-gray-300 text-sm mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full mb-4 px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
        />

        <label className="block text-gray-300 text-sm mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full mb-4 px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
        />

        <label className="block text-gray-300 text-sm mb-1">I am a</label>
        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => setRole("candidate")}
            className={`flex-1 py-2 rounded text-sm font-medium border transition ${
              role === "candidate"
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-gray-700 border-gray-600 text-gray-300 hover:border-blue-500"
            }`}
          >
            Job Seeker
          </button>
          <button
            type="button"
            onClick={() => setRole("recruiter")}
            className={`flex-1 py-2 rounded text-sm font-medium border transition ${
              role === "recruiter"
                ? "bg-purple-600 border-purple-600 text-white"
                : "bg-gray-700 border-gray-600 text-gray-300 hover:border-purple-500"
            }`}
          >
            Recruiter
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded transition"
        >
          {submitting ? "Creating account..." : "Register"}
        </button>

        <p className="text-gray-400 text-sm text-center mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:underline">
            Log In
          </Link>
        </p>
      </form>
    </div>
  );
}
