const API_BASE = '/api';
let token = localStorage.getItem('docflow-token') || '';

async function request(path, opts = {}) {
  const headers = {
    ...opts.headers,
    Authorization: `Bearer ${token}`,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
  });

  if (res.status === 401) {
    token = '';
    localStorage.removeItem('docflow-token');
    window.dispatchEvent(new CustomEvent('docflow:auth-required'));
    return null;
  }

  if (res.status === 204) return { success: true };

  return res.json();
}

export const api = {
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then((r) => {
      token = r.token;
      localStorage.setItem('docflow-token', token);
      return r;
    }),

  logout: () => {
    token = '';
    localStorage.removeItem('docflow-token');
  },

  folders: () => request('/folders'),

  createFolder: (name, parentFolderId) =>
    request('/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentFolderId: parentFolderId || null }),
    }),

  updateFolder: (id, data) =>
    request(`/folders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  deleteFolder: (id) => request(`/folders/${id}`, { method: 'DELETE' }),

  documents: (folderId) =>
    request(`/documents${folderId ? `?folderId=${folderId}` : ''}`),

  getDocument: (id) => request(`/documents/${id}`),

  createDocument: (name, folderId, content) =>
    request('/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, folderId: folderId || null, content: content || '' }),
    }),

  updateDocument: (id, data) =>
    request(`/documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  deleteDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }),

  importDocuments: (documents) =>
    request('/documents/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documents }),
    }),

  exportAll: () => request('/export'),
};
