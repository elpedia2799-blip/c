import {
  PortfolioSection,
  Project,
  ServiceItem,
  ContactMessage,
  SiteSettings,
  AdminStats,
} from '../types.ts';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('admin_token');
}

export function clearAdminAuth(): void {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  window.dispatchEvent(new CustomEvent('auth:expired'));
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401 || res.status === 403) {
    clearAdminAuth();
  }

  return res;
}

// PUBLIC
export async function fetchSections(): Promise<PortfolioSection[]> {
  const res = await fetch(`${API_BASE}/sections`);
  if (!res.ok) throw new Error('Failed to fetch sections');
  const data = await res.json();
  return data.sections || [];
}

export async function fetchProjects(sectionSlug?: string, featuredOnly?: boolean): Promise<Project[]> {
  const params = new URLSearchParams();
  if (sectionSlug && sectionSlug !== 'all') params.append('section', sectionSlug);
  if (featuredOnly) params.append('featured', 'true');
  const res = await fetch(`${API_BASE}/projects?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  const data = await res.json();
  return data.projects || [];
}

export async function fetchProjectBySlug(slug: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${slug}`);
  if (!res.ok) throw new Error('Project not found');
  const data = await res.json();
  return data.project;
}

export async function fetchServices(): Promise<ServiceItem[]> {
  const res = await fetch(`${API_BASE}/services`);
  if (!res.ok) throw new Error('Failed to fetch services');
  const data = await res.json();
  return data.services || [];
}

export async function fetchSettings(): Promise<SiteSettings> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  const data = await res.json();
  return data.settings || {};
}

export async function submitContactMessage(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit message');
  return data;
}

// ADMIN
export async function verifyAdminSessionApi(): Promise<boolean> {
  const token = getAuthToken();
  if (!token) return false;
  try {
    const res = await authFetch(`${API_BASE}/admin/me`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function loginAdmin(email: string, password: string): Promise<{ token: string; user: any }> {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await authFetch(`${API_BASE}/admin/stats`);
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch admin stats');
  return await res.json();
}

export async function fetchAdminProjects(): Promise<Project[]> {
  const res = await authFetch(`${API_BASE}/admin/projects`);
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch admin projects');
  const data = await res.json();
  return data.projects || [];
}

export async function createAdminProject(payload: any): Promise<Project> {
  const res = await authFetch(`${API_BASE}/admin/projects`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create project');
  return data.project;
}

export async function updateAdminProject(id: number, payload: any): Promise<Project> {
  const res = await authFetch(`${API_BASE}/admin/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update project');
  return data.project;
}

export async function deleteAdminProject(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/admin/projects/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete project');
}

export async function fetchAdminSections(): Promise<PortfolioSection[]> {
  const res = await authFetch(`${API_BASE}/admin/sections`);
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch admin sections');
  const data = await res.json();
  return data.sections || [];
}

export async function createAdminSection(payload: any): Promise<PortfolioSection> {
  const res = await authFetch(`${API_BASE}/admin/sections`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create section');
  return data.section;
}

export async function updateAdminSection(id: number, payload: any): Promise<PortfolioSection> {
  const res = await authFetch(`${API_BASE}/admin/sections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update section');
  return data.section;
}

export async function deleteAdminSection(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/admin/sections/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete section');
}

export async function reorderAdminSections(orderedIds: number[]): Promise<PortfolioSection[]> {
  const res = await authFetch(`${API_BASE}/admin/sections/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ orderedIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reorder sections');
  return data.sections;
}

export async function fetchAdminMessages(): Promise<ContactMessage[]> {
  const token = getAuthToken();
  if (!token) return [];
  const res = await authFetch(`${API_BASE}/admin/messages`);
  if (res.status === 401 || res.status === 403) {
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error('Failed to fetch admin messages');
  const data = await res.json();
  return data.messages || [];
}

export async function updateAdminMessageStatus(id: number, status: 'unread' | 'read' | 'archived'): Promise<ContactMessage> {
  const res = await authFetch(`${API_BASE}/admin/messages/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update message');
  return data.message;
}

export async function deleteAdminMessage(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/admin/messages/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete message');
}

export async function fetchAdminServices(): Promise<ServiceItem[]> {
  const res = await authFetch(`${API_BASE}/admin/services`);
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch admin services');
  const data = await res.json();
  return data.services || [];
}

export async function createAdminService(payload: any): Promise<ServiceItem> {
  const res = await authFetch(`${API_BASE}/admin/services`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create service');
  return data.service;
}

export async function updateAdminService(id: number, payload: any): Promise<ServiceItem> {
  const res = await authFetch(`${API_BASE}/admin/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update service');
  return data.service;
}

export async function deleteAdminService(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/admin/services/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete service');
}

export async function updateAdminSettings(payload: Record<string, string>): Promise<SiteSettings> {
  const res = await authFetch(`${API_BASE}/admin/settings`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update settings');
  return data.settings;
}

export async function uploadImageFile(fileData: string, fileName: string): Promise<string> {
  const res = await authFetch(`${API_BASE}/admin/upload`, {
    method: 'POST',
    body: JSON.stringify({ fileData, fileName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to upload image');
  return data.url;
}
