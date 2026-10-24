const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export async function apiRequest(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('Backend is not configured. Set VITE_API_BASE_URL in your .env file.')
  }

  const { body, headers: extraHeaders, ...rest } = options
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const headers = { ...(extraHeaders || {}) }
  if (!isFormData && body != null && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    body,
    headers,
  })
  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.message || `Request failed (${response.status})`)
  }
  return data
}

function request(method, path, payload, extra = {}) {
  const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData
  return apiRequest(path, {
    method,
    body: payload == null ? undefined : isFormData ? payload : JSON.stringify(payload),
    ...extra,
  }).then((data) => ({ data }))
}

const api = {
  get: (path, extra) => request('GET', path, undefined, extra),
  post: (path, body, extra) => request('POST', path, body, extra),
  patch: (path, body, extra) => request('PATCH', path, body, extra),
}

export default api
