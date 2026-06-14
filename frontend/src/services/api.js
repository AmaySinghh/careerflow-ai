const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.body &&
    !(options.body instanceof URLSearchParams) &&
    !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Something went wrong");
  }

  if (response.status === 204) return null;
  return response.json();
}

export function registerUser(data) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function loginUser(data) {
  const formData = new URLSearchParams();
  formData.append("username", data.email);
  formData.append("password", data.password);

  return request("/auth/login", {
    method: "POST",
    body: formData,
  });
}

export function getCurrentUser() {
  return request("/auth/me");
}

export function uploadResume(file) {
  const formData = new FormData();
  formData.append("file", file);

  return request("/resumes/upload", {
    method: "POST",
    body: formData,
  });
}

export function analyzeResume(resumeId) {
  return request(`/resumes/${resumeId}/analyze`, {
    method: "POST",
  });
}

export function getJobs({
  search = "",
  location = "",
  page = 1,
  pageSize = 10,
} = {}) {
  const params = new URLSearchParams({
    search,
    location,
    page,
    page_size: pageSize,
  });
  return request(`/jobs?${params.toString()}`);
}

export function getMyJobs() {
  return request("/jobs/mine");
}

export function createJob(data) {
  return request("/jobs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateJob(jobId, data) {
  return request(`/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteJob(jobId) {
  return request(`/jobs/${jobId}`, {
    method: "DELETE",
  });
}

export function applyToJob(jobId) {
  return request(`/applications/${jobId}/apply`, {
    method: "POST",
  });
}

export function getJobApplicants(jobId) {
  return request(`/applications/job/${jobId}`);
}

export function updateApplicationStatus(applicationId, status) {
  return request(`/applications/${applicationId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function getMyApplications() {
  return request("/applications/mine");
}

export function getRecruiterStats() {
  return request("/jobs/recruiter/stats");
}

export function getMyResumes() {
  return request("/resumes/mine");
}

export function deleteResume(resumeId) {
  return request(`/resumes/${resumeId}`, {
    method: "DELETE",
  });
}

export function getCandidateSummary(applicationId) {
  return request(`/applications/${applicationId}/candidate-summary`);
}

export function getInterviewQuestions(jobId) {
  return request(`/jobs/${jobId}/interview-questions`);
}

export function getInterviewQuestionsForApplication(applicationId) {
  return request(`/applications/${applicationId}/interview-questions`);
}

export function evaluateInterview(applicationId, questions, answers) {
  return request(`/applications/${applicationId}/evaluate`, {
    method: "POST",
    body: JSON.stringify({ questions, answers }),
  });
}
