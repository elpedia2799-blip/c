import { db } from './index.ts';
import {
  portfolioSections,
  projects,
  projectImages,
  messages,
  services,
  settings,
  users,
} from './schema.ts';
import { eq, desc, asc, and, sql } from 'drizzle-orm';

// SECTION HELPERS
export async function getPublicSections() {
  try {
    return await db
      .select()
      .from(portfolioSections)
      .where(eq(portfolioSections.isVisible, true))
      .orderBy(asc(portfolioSections.sortOrder));
  } catch (error) {
    console.error('getPublicSections failed:', error);
    throw new Error('Failed to retrieve sections', { cause: error });
  }
}

export async function getAllSections() {
  try {
    return await db
      .select()
      .from(portfolioSections)
      .orderBy(asc(portfolioSections.sortOrder));
  } catch (error) {
    console.error('getAllSections failed:', error);
    throw new Error('Failed to retrieve all sections', { cause: error });
  }
}

export async function getSectionBySlug(slug: string) {
  try {
    const res = await db
      .select()
      .from(portfolioSections)
      .where(eq(portfolioSections.slug, slug))
      .limit(1);
    return res[0] || null;
  } catch (error) {
    console.error('getSectionBySlug failed:', error);
    throw new Error('Failed to retrieve section by slug', { cause: error });
  }
}

// PROJECT HELPERS
export async function getPublicProjects(options?: { sectionSlug?: string; featuredOnly?: boolean }) {
  try {
    let query = db
      .select({
        id: projects.id,
        title: projects.title,
        slug: projects.slug,
        sectionId: projects.sectionId,
        sectionName: portfolioSections.name,
        sectionSlug: portfolioSections.slug,
        shortDescription: projects.shortDescription,
        description: projects.description,
        coverImage: projects.coverImage,
        client: projects.client,
        projectDate: projects.projectDate,
        tools: projects.tools,
        tags: projects.tags,
        projectUrl: projects.projectUrl,
        designProcess: projects.designProcess,
        isFeatured: projects.isFeatured,
        isPublished: projects.isPublished,
        sortOrder: projects.sortOrder,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .innerJoin(portfolioSections, eq(projects.sectionId, portfolioSections.id))
      .where(
        options?.sectionSlug
          ? and(eq(projects.isPublished, true), eq(portfolioSections.slug, options.sectionSlug))
          : eq(projects.isPublished, true)
      )
      .orderBy(asc(projects.sortOrder), desc(projects.createdAt));

    const result = await query;
    return result;
  } catch (error) {
    console.error('getPublicProjects failed:', error);
    throw new Error('Failed to retrieve projects', { cause: error });
  }
}

export async function getProjectBySlug(slug: string) {
  try {
    const projectList = await db
      .select({
        id: projects.id,
        title: projects.title,
        slug: projects.slug,
        sectionId: projects.sectionId,
        sectionName: portfolioSections.name,
        sectionSlug: portfolioSections.slug,
        shortDescription: projects.shortDescription,
        description: projects.description,
        coverImage: projects.coverImage,
        client: projects.client,
        projectDate: projects.projectDate,
        tools: projects.tools,
        tags: projects.tags,
        projectUrl: projects.projectUrl,
        designProcess: projects.designProcess,
        isFeatured: projects.isFeatured,
        isPublished: projects.isPublished,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .innerJoin(portfolioSections, eq(projects.sectionId, portfolioSections.id))
      .where(eq(projects.slug, slug))
      .limit(1);

    if (!projectList.length) return null;
    const project = projectList[0];

    const images = await db
      .select()
      .from(projectImages)
      .where(eq(projectImages.projectId, project.id))
      .orderBy(asc(projectImages.sortOrder));

    // Also get previous and next projects for navigation
    const allProjects = await db
      .select({ id: projects.id, slug: projects.slug, title: projects.title })
      .from(projects)
      .where(eq(projects.isPublished, true))
      .orderBy(asc(projects.sortOrder), desc(projects.createdAt));

    const currentIndex = allProjects.findIndex((p) => p.slug === slug);
    const prevProject = currentIndex > 0 ? allProjects[currentIndex - 1] : null;
    const nextProject = currentIndex < allProjects.length - 1 ? allProjects[currentIndex + 1] : null;

    return {
      ...project,
      images,
      prevProject,
      nextProject,
    };
  } catch (error) {
    console.error('getProjectBySlug failed:', error);
    throw new Error('Failed to retrieve project', { cause: error });
  }
}

export async function getAllProjectsAdmin() {
  try {
    const list = await db
      .select({
        id: projects.id,
        title: projects.title,
        slug: projects.slug,
        sectionId: projects.sectionId,
        sectionName: portfolioSections.name,
        coverImage: projects.coverImage,
        isFeatured: projects.isFeatured,
        isPublished: projects.isPublished,
        sortOrder: projects.sortOrder,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .innerJoin(portfolioSections, eq(projects.sectionId, portfolioSections.id))
      .orderBy(asc(projects.sortOrder), desc(projects.createdAt));

    return list;
  } catch (error) {
    console.error('getAllProjectsAdmin failed:', error);
    throw new Error('Failed to retrieve admin projects', { cause: error });
  }
}

// MESSAGE HELPERS
export async function createMessage(data: { name: string; email: string; subject: string; message: string }) {
  try {
    const res = await db.insert(messages).values(data).returning();
    return res[0];
  } catch (error) {
    console.error('createMessage failed:', error);
    throw new Error('Failed to save message', { cause: error });
  }
}

export async function getAllMessages() {
  try {
    return await db.select().from(messages).orderBy(desc(messages.createdAt));
  } catch (error) {
    console.error('getAllMessages failed:', error);
    throw new Error('Failed to retrieve messages', { cause: error });
  }
}

export async function updateMessageStatus(id: number, status: 'unread' | 'read' | 'archived') {
  try {
    const res = await db
      .update(messages)
      .set({ status, updatedAt: new Date() })
      .where(eq(messages.id, id))
      .returning();
    return res[0];
  } catch (error) {
    console.error('updateMessageStatus failed:', error);
    throw new Error('Failed to update message', { cause: error });
  }
}

export async function deleteMessage(id: number) {
  try {
    await db.delete(messages).where(eq(messages.id, id));
    return true;
  } catch (error) {
    console.error('deleteMessage failed:', error);
    throw new Error('Failed to delete message', { cause: error });
  }
}

// SERVICES HELPERS
export async function getPublicServices() {
  try {
    return await db
      .select()
      .from(services)
      .where(eq(services.isVisible, true))
      .orderBy(asc(services.sortOrder));
  } catch (error) {
    console.error('getPublicServices failed:', error);
    throw new Error('Failed to retrieve services', { cause: error });
  }
}

export async function getAllServicesAdmin() {
  try {
    return await db.select().from(services).orderBy(asc(services.sortOrder));
  } catch (error) {
    console.error('getAllServicesAdmin failed:', error);
    throw new Error('Failed to retrieve all services', { cause: error });
  }
}

// SETTINGS HELPERS
export async function getAllSettings() {
  try {
    const rows = await db.select().from(settings);
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }
    return map;
  } catch (error) {
    console.error('getAllSettings failed:', error);
    throw new Error('Failed to retrieve settings', { cause: error });
  }
}

export async function updateSettingsBatch(data: Record<string, string>) {
  try {
    for (const [key, value] of Object.entries(data)) {
      await db
        .insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value, updatedAt: new Date() },
        });
    }
    return await getAllSettings();
  } catch (error) {
    console.error('updateSettingsBatch failed:', error);
    throw new Error('Failed to update settings', { cause: error });
  }
}

// STATS
export async function getAdminDashboardStats() {
  try {
    const totalProjects = await db.select({ count: sql<number>`count(*)::int` }).from(projects);
    const publishedProjects = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(eq(projects.isPublished, true));
    const featuredProjects = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(eq(projects.isFeatured, true));
    const unreadMessages = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(eq(messages.status, 'unread'));
    const totalSections = await db.select({ count: sql<number>`count(*)::int` }).from(portfolioSections);

    return {
      totalProjects: totalProjects[0]?.count || 0,
      publishedProjects: publishedProjects[0]?.count || 0,
      featuredProjects: featuredProjects[0]?.count || 0,
      unreadMessages: unreadMessages[0]?.count || 0,
      totalSections: totalSections[0]?.count || 0,
    };
  } catch (error) {
    console.error('getAdminDashboardStats failed:', error);
    throw new Error('Failed to retrieve admin stats', { cause: error });
  }
}
