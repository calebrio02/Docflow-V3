const API_BASE = '/api';
let token = localStorage.getItem('docflow-token') || '';
let userId = localStorage.getItem('docflow-userId') || '';

// Restore userId from localStorage if we have a token but no userId in memory
if (token && !userId) {
  userId = localStorage.getItem('docflow-userId') || '';
}

async function request(path, opts = {}) {
  const headers = {
    ...opts.headers,
    Authorization: `Bearer ${token}`,
  };

  if (userId) {
    headers['X-User-Id'] = userId;
  }

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
  // ─── Auth ───
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then((r) => {
      token = r.token;
      userId = r.userId;
      localStorage.setItem('docflow-token', token);
      localStorage.setItem('docflow-userId', userId);
      return r;
    }),

  register: (username, password, invitationToken) =>
    request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, invitationToken }),
    }).then((r) => {
      token = r.token;
      userId = r.userId;
      localStorage.setItem('docflow-token', token);
      localStorage.setItem('docflow-userId', userId);
      return r;
    }),

  acceptInvite: (inviteToken, username, email, password) =>
    request('/invitations/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: inviteToken, username, email, password }),
    }).then((r) => {
      token = r.token;
      userId = r.userId;
      localStorage.setItem('docflow-token', token);
      localStorage.setItem('docflow-userId', userId);
      return r;
    }),

  me: () => {
    const resToken = token;
    return request('/auth/me').then((r) => r);
  },

  logout: () => {
    token = '';
    userId = '';
    localStorage.removeItem('docflow-token');
    localStorage.removeItem('docflow-userId');
  },

  // ─── Invitations ───
  createInvite: (projectId, email, role) =>
    request('/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, projectId, role }),
    }),

  // ─── Projects ───
  projects: () => request('/projects'),

  createProject: (name, description) =>
    request('/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    }),

  getProject: (id) => request(`/projects/${id}`),

  updateProject: (id, data) =>
    request(`/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  // ─── Project Members ───
  projectMembers: (projectId) => request(`/projects/${projectId}/members`),

  addMember: (projectId, userId, role) =>
    request(`/projects/${projectId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    }),

  removeMember: (projectId, userId) =>
    request(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' }),

  updateMemberRole: (projectId, userId, role) =>
    request(`/projects/${projectId}/members/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    }),

  // ─── Folders ───
  projectFolders: (projectId) => request(`/projects/${projectId}/folders`),

  subfolders: (folderId) => request(`/folders/${folderId}/subfolders`),

  createFolder: (name, projectId, parentFolderId) =>
    request('/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, projectId, parentFolderId: parentFolderId || null }),
    }),

  deleteFolder: (id) => request(`/folders/${id}`, { method: 'DELETE' }),

  // ─── Documents ───
  projectDocuments: (projectId, folderId) => request(`/projects/${projectId}/documents${folderId ? `?folderId=${folderId}` : ''}`),

  getDocument: (id) => request(`/documents/${id}`),

  createDocument: (title, projectId, folderId, content) =>
    request('/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        projectId,
        folderId: folderId || null,
        content: content || [],
      }),
    }),

  updateDocument: (id, data) =>
    request(`/documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  deleteDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }),

  copyDocument: (id, projectId) =>
    request(`/documents/${id}/copy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    }),

  moveDocument: (id, folderId) =>
    request(`/documents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId }),
    }),

  shareDocument: (id, isPublic) =>
    request(`/documents/${id}/share`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic }),
    }),

  // ─── Releases ───
  createRelease: (documentId, title, description) =>
    request(`/documents/${documentId}/releases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    }),

  getDocumentReleases: (documentId) => request(`/documents/${documentId}/releases`),

  getRelease: (documentId, releaseId) => request(`/documents/${documentId}/releases/${releaseId}`),

  // ─── Upload ───
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/upload', {
      method: 'POST',
      headers: {},
      body: formData,
    });
  },

  deleteUpload: (filename) => request(`/uploads/${filename}`, { method: 'DELETE' }),

  // ─── Export ───
  exportAll: () => request('/export'),
};
