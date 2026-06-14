import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getInterviewQuestionsForApplication,
  evaluateInterview,
} from "../services/api";

const TYPE_COLORS = {
  Technical: "bg-blue-900 text-blue-300",
  "Problem Solving": "bg-yellow-900 text-yellow-300",
  Behavioral: "bg-green-900 text-green-300",
  "System Design": "bg-purple-900 text-purple-300",
  Situational: "bg-pink-900 text-pink-300",
};

export default function InterviewPractice() {
  const { applicationId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getInterviewQuestionsForApplication(applicationId)
      .then((data) => {
        setQuestions(data.questions);
        setAnswers(new Array(data.questions.length).fill(""));
      })
      .catch((err) => {
        if (err.message.includes("not set up")) {
          setError(
            "The recruiter hasn't set up screening questions for this job yet. Check back later.",
          );
        } else {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, [applicationId]);

  const handleSubmit = async () => {
    if (answers.some((a) => !a.trim())) {
      alert("Please answer all questions before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const questionTexts = questions.map((q) => q.question);
      const res = await evaluateInterview(
        applicationId,
        questionTexts,
        answers,
      );
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Screening Assessment</h1>
            <p className="text-gray-400 text-sm mt-1">
              Answer all questions — your score will be shared with the
              recruiter
            </p>
          </div>
          <button
            onClick={() => navigate("/applications")}
            className="text-sm text-gray-400 hover:text-gray-200"
          >
            ← My Applications
          </button>
        </div>

        {error ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-4xl mb-4">⏳</p>
            <p className="text-gray-300 font-medium mb-2">
              Questions Not Ready Yet
            </p>
            <p className="text-gray-400 text-sm mb-6">{error}</p>
            <button
              onClick={() => navigate("/applications")}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
            >
              Back to My Applications
            </button>
          </div>
        ) : loading ? (
          <p className="text-gray-400 text-sm">Loading questions...</p>
        ) : result ? (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className={`text-4xl font-bold ${
                    result.recommendation === "Hire"
                      ? "text-green-400"
                      : result.recommendation === "Consider"
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {result.overall_score}/100
                </div>
                <div>
                  <p className="text-white font-semibold">
                    Assessment Complete
                  </p>
                  <p className="text-gray-400 text-sm">
                    Your score has been submitted to the recruiter
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-blue-400">
                    {result.technical_accuracy}/10
                  </p>
                  <p className="text-gray-400 text-xs mt-1">Technical</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-green-400">
                    {result.communication}/10
                  </p>
                  <p className="text-gray-400 text-xs mt-1">Communication</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-yellow-400">
                    {result.problem_solving}/10
                  </p>
                  <p className="text-gray-400 text-xs mt-1">Problem Solving</p>
                </div>
              </div>

              <div className="bg-indigo-950 border border-indigo-800 rounded p-4 mb-4">
                <p className="text-xs text-indigo-300 font-medium mb-2">
                  Feedback
                </p>
                <p className="text-sm text-gray-300">{result.feedback}</p>
              </div>

              <button
                onClick={() => navigate("/applications")}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm"
              >
                Back to My Applications
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-yellow-900 border border-yellow-700 rounded p-3 text-sm text-yellow-200">
              ⚠️ You can only submit this assessment once. Make sure your
              answers are complete before submitting.
            </div>

            {questions.map((q, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-gray-400 text-sm font-medium">
                    Q{i + 1}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${TYPE_COLORS[q.type] || "bg-gray-700 text-gray-300"}`}
                  >
                    {q.type}
                  </span>
                </div>
                <p className="text-white text-sm mb-3">{q.question}</p>
                <textarea
                  value={answers[i]}
                  onChange={(e) => {
                    const updated = [...answers];
                    updated[i] = e.target.value;
                    setAnswers(updated);
                  }}
                  rows={4}
                  placeholder="Type your answer here..."
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-3 rounded font-medium"
            >
              {submitting ? "Evaluating your answers..." : "Submit Assessment"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
