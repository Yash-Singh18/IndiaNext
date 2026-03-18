// REAL backend service — swap this back in when deepfake-service is restored
const DEEPFAKE_API =
  import.meta.env.VITE_DEEPFAKE_API || "http://localhost:8002";

export async function detectDeepfake(file) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${DEEPFAKE_API}/api/deepfake/detect`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Detection failed (${res.status})`);
  }

  return res.json();
}
