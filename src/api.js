const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const NETWORK_ERROR_MESSAGE =
  "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요. 문제가 계속되면 운영진에게 문의해 주세요.";

export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {})
      },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || "요청 처리 중 오류가 발생했습니다.");
  }
  return data;
}

export const get = (path) => api(path);
export const post = (path, body) => api(path, { method: "POST", body });
export const patch = (path, body) => api(path, { method: "PATCH", body });
export const del = (path) => api(path, { method: "DELETE" });
