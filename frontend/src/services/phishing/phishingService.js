const PHISHING_API_URL =
  import.meta.env.VITE_PHISHING_SERVICE_URL || "http://localhost:8001";

function extractErrorMessage(err, fallback) {
  if (typeof err.detail === "string") return err.detail;
  if (Array.isArray(err.detail) && err.detail.length > 0) {
    return err.detail.map((e) => e.msg || JSON.stringify(e)).join("; ");
  }
  if (err.message) return err.message;
  return fallback;
}

export async function scanEmail({ sender, subject, body, userId }) {
  const res = await fetch(`${PHISHING_API_URL}/api/scan/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sender, subject, body, user_id: userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "Scan failed"));
  }
  return res.json();
}

export async function scanEmlFile(file, userId) {
  const formData = new FormData();
  formData.append("file", file);
  if (userId) formData.append("user_id", userId);

  const res = await fetch(`${PHISHING_API_URL}/api/scan/eml`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "EML scan failed"));
  }
  return res.json();
}

export async function scanUrl({ url, userId }) {
  const res = await fetch(`${PHISHING_API_URL}/api/scan/url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, user_id: userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "URL scan failed"));
  }
  return res.json();
}

export async function scanMessage({ message, userId }) {
  const res = await fetch(`${PHISHING_API_URL}/api/scan/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, user_id: userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "Message scan failed"));
  }
  return res.json();
}

export async function getScanResult(scanId) {
  const res = await fetch(`${PHISHING_API_URL}/api/results/${scanId}`);
  if (!res.ok) throw new Error("Failed to fetch scan result");
  return res.json();
}

export async function getUserScans(userId) {
  const res = await fetch(`${PHISHING_API_URL}/api/results/user/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch scan history");
  return res.json();
}
