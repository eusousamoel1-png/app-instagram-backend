/**
 * API Service — chamadas ao backend Express
 */
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 min (geração de imagens pode demorar)
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ── Auth ──────────────────────────────────────────

export function getLoginUrl() {
  return `${API_BASE}/auth/instagram`;
}

export async function getAuthStatus() {
  const res = await api.get('/auth/status');
  return res.data;
}

export async function logout() {
  const res = await api.post('/auth/logout');
  return res.data;
}

// ── Content Generation ────────────────────────────

export async function generateContent(params) {
  const res = await api.post('/content/generate', params);
  return res.data;
}

export async function generateCaption(params) {
  const res = await api.post('/content/generate-caption', params);
  return res.data;
}

export async function generateImage(params) {
  const res = await api.post('/content/generate-image', params);
  return res.data;
}

// ── Posts ──────────────────────────────────────────

export async function getPosts(status = null) {
  const params = status ? { status } : {};
  const res = await api.get('/posts', { params });
  return res.data;
}

export async function getPostStats() {
  const res = await api.get('/posts/stats');
  return res.data;
}

export async function schedulePost(postData) {
  const res = await api.post('/posts/schedule', postData);
  return res.data;
}

export async function updatePost(id, updateData) {
  const res = await api.put(`/posts/${id}`, updateData);
  return res.data;
}

export async function deletePost(id) {
  const res = await api.delete(`/posts/${id}`);
  return res.data;
}

export async function publishPostNow(id) {
  const res = await api.post(`/posts/${id}/publish`);
  return res.data;
}

export default api;
