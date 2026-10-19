export interface PortfolioSection {
  id: number;
  name: string;
  slug: string;
  description?: string;
  coverImage?: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt?: string;
}

export interface ProjectImage {
  id?: number;
  projectId?: number;
  imageUrl: string;
  caption?: string;
  sortOrder?: number;
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  sectionId: number;
  sectionName?: string;
  sectionSlug?: string;
  shortDescription?: string;
  description: string;
  coverImage: string;
  client?: string;
  projectDate?: string;
  tools?: string;
  tags?: string;
  projectUrl?: string;
  designProcess?: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder?: number;
  createdAt?: string;
  images?: ProjectImage[];
  prevProject?: { id: number; slug: string; title: string } | null;
  nextProject?: { id: number; slug: string; title: string } | null;
}

export interface ServiceItem {
  id: number;
  number: string;
  title: string;
  description: string;
  icon: string;
  sortOrder: number;
  isVisible: boolean;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  createdAt: string;
  updatedAt?: string;
}

export interface SiteSettings {
  site_title?: string;
  site_description?: string;
  hero_label?: string;
  hero_headline?: string;
  hero_description?: string;
  hero_image?: string;
  about_title?: string;
  about_description?: string;
  about_image?: string;
  about_quote?: string;
  stat_experience?: string;
  stat_projects?: string;
  stat_clients?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_location?: string;
  social_instagram?: string;
  social_x?: string;
  social_behance?: string;
  social_youtube?: string;
  [key: string]: string | undefined;
}

export interface AdminStats {
  totalProjects: number;
  publishedProjects: number;
  featuredProjects: number;
  unreadMessages: number;
  totalSections: number;
}

export interface AdminUser {
  email: string;
  name?: string;
  role: string;
}
