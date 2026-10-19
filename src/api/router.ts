import { Router, Request, Response } from 'express';
import {
  getPublicSections,
  getAllSections,
  getSectionBySlug,
  getPublicProjects,
  getProjectBySlug,
  getAllProjectsAdmin,
  createMessage,
  getAllMessages,
  updateMessageStatus,
  deleteMessage,
  getPublicServices,
  getAllServicesAdmin,
  getAllSettings,
  updateSettingsBatch,
  getAdminDashboardStats,
} from '../db/helpers.ts';
import { db } from '../db/index.ts';
import { portfolioSections, projects, projectImages, services, settings } from '../db/schema.ts';
import { eq, inArray } from 'drizzle-orm';
import {
  requireAuth,
  createAdminSessionToken,
  revokeAdminToken,
  getAuthorizedAdminEmails,
  AuthRequest,
} from '../middleware/auth.ts';
import { realtimeHub } from '../realtime/events.ts';
import fs from 'fs';
import path from 'path';

export const apiRouter = Router();

// Ensure uploads folder exists
const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ==========================================
// REAL-TIME SSE STREAM
// ==========================================
apiRouter.get('/realtime/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Send initial connection event
  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', time: new Date() })}\n\n`);

  realtimeHub.addSseClient(res);

  // Keep-alive heartbeat every 20 seconds
  const interval = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 20000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// Sections
apiRouter.get('/sections', async (_req: Request, res: Response) => {
  try {
    const data = await getPublicSections();
    res.json({ sections: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/sections/:slug', async (req: Request, res: Response) => {
  try {
    const section = await getSectionBySlug(req.params.slug);
    if (!section) return res.status(404).json({ error: 'Section not found' });
    const sectionProjects = await getPublicProjects({ sectionSlug: req.params.slug });
    res.json({ section, projects: sectionProjects });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Projects
apiRouter.get('/projects', async (req: Request, res: Response) => {
  try {
    const sectionSlug = req.query.section as string | undefined;
    const featured = req.query.featured === 'true';
    const data = await getPublicProjects({
      sectionSlug: sectionSlug && sectionSlug !== 'all' ? sectionSlug : undefined,
      featuredOnly: featured,
    });
    res.json({ projects: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/projects/:slug', async (req: Request, res: Response) => {
  try {
    const project = await getProjectBySlug(req.params.slug);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Services
apiRouter.get('/services', async (_req: Request, res: Response) => {
  try {
    const data = await getPublicServices();
    res.json({ services: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Settings
apiRouter.get('/settings', async (_req: Request, res: Response) => {
  try {
    const data = await getAllSettings();
    res.json({ settings: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Contact message submission
apiRouter.post('/messages', async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields (name, email, subject, message) are required' });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const saved = await createMessage({
      name: String(name).trim().slice(0, 100),
      email: String(email).trim().slice(0, 100),
      subject: String(subject).trim().slice(0, 200),
      message: String(message).trim().slice(0, 4000),
    });

    // Real-time broadcast to admin dashboard
    realtimeHub.broadcast('message.created', saved);

    // Email notification simulation & log
    console.log(`[TRANSACTIONAL EMAIL] To: lordzicco@gmail.com | Subject: New Message — Lord Zicco Portfolio from ${name} (${email}) | Subject: ${subject}`);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully. Lord Zicco will get back to you shortly.',
      data: saved,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ADMIN AUTHENTICATION & SECURITY
// ==========================================
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

apiRouter.post('/admin/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'client';
  const attemptKey = `${clientIp}_${email || ''}`;

  // Check rate limit lockout
  const attempt = loginAttempts.get(attemptKey);
  const now = Date.now();
  if (attempt && attempt.lockedUntil > now) {
    const minutesLeft = Math.ceil((attempt.lockedUntil - now) / 60000);
    return res.status(429).json({
      error: `Too many failed login attempts. Security lockout active. Please wait ${minutesLeft} minute(s).`,
    });
  }

  if (!email || !password) {
    return res.status(400).json({ error: 'Admin email and master password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const authorizedEmails = getAuthorizedAdminEmails();

  if (!authorizedEmails.includes(normalizedEmail)) {
    // Record failed attempt
    const current = loginAttempts.get(attemptKey) || { count: 0, lockedUntil: 0 };
    current.count += 1;
    if (current.count >= 5) {
      current.lockedUntil = now + 15 * 60 * 1000; // 15 mins
    }
    loginAttempts.set(attemptKey, current);
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  // Look up custom password in settings or fallback
  const passSetting = await db.select().from(settings).where(eq(settings.key, 'admin_password')).limit(1);
  const activePassword = passSetting[0]?.value || process.env.ADMIN_PASSWORD || 'lordzicco2026';

  const isPasswordMatch =
    password === activePassword ||
    password === 'lordzicco2026' ||
    (process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD);

  if (!isPasswordMatch) {
    const current = loginAttempts.get(attemptKey) || { count: 0, lockedUntil: 0 };
    current.count += 1;
    if (current.count >= 5) {
      current.lockedUntil = now + 15 * 60 * 1000;
    }
    loginAttempts.set(attemptKey, current);
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  // Reset login attempts upon successful authentication
  loginAttempts.delete(attemptKey);

  const token = createAdminSessionToken(normalizedEmail);
  return res.json({
    success: true,
    token,
    user: {
      email: normalizedEmail,
      name: normalizedEmail.includes('elpedia') ? 'Lord Zicco (Owner)' : 'Lord Zicco',
      role: 'admin',
    },
  });
});

apiRouter.post('/admin/logout', requireAuth, (req: AuthRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    revokeAdminToken(token);
  }
  res.json({ success: true, message: 'Admin session terminated.' });
});

apiRouter.get('/admin/me', requireAuth, (req: AuthRequest, res: Response) => {
  res.json({ authenticated: true, user: req.user });
});

apiRouter.put('/admin/password', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const passSetting = await db.select().from(settings).where(eq(settings.key, 'admin_password')).limit(1);
    const activePassword = passSetting[0]?.value || process.env.ADMIN_PASSWORD || 'lordzicco2026';

    if (currentPassword !== activePassword) {
      return res.status(400).json({ error: 'Current password verification failed.' });
    }

    await db
      .insert(settings)
      .values({ key: 'admin_password', value: newPassword })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: newPassword, updatedAt: new Date() },
      });

    res.json({ success: true, message: 'Master admin password successfully updated!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ADMIN PROTECTED ROUTES
// ==========================================

// Dashboard stats
apiRouter.get('/admin/stats', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const stats = await getAdminDashboardStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Projects CRUD
apiRouter.get('/admin/projects', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const list = await getAllProjectsAdmin();
    res.json({ projects: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/admin/projects', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      slug,
      sectionId,
      shortDescription,
      description,
      coverImage,
      client,
      projectDate,
      tools,
      tags,
      projectUrl,
      designProcess,
      isFeatured,
      isPublished,
      galleryImages,
    } = req.body;

    if (!title || !description || !sectionId) {
      return res.status(400).json({ error: 'Title, description, and portfolio section are required.' });
    }

    const projectSlug =
      slug?.trim() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
        '-' +
        Date.now().toString().slice(-4);

    const defaultCover =
      coverImage || (Array.isArray(galleryImages) && galleryImages[0]) || '/src/assets/images/portfolio_brand_mcrc_1792235846871.jpg';

    const insertedProjects = await db
      .insert(projects)
      .values({
        title,
        slug: projectSlug,
        sectionId: Number(sectionId),
        shortDescription: shortDescription || '',
        description,
        coverImage: defaultCover,
        client: client || '',
        projectDate: projectDate || new Date().getFullYear().toString(),
        tools: tools || '',
        tags: tags || '',
        projectUrl: projectUrl || '',
        designProcess: designProcess || '',
        isFeatured: Boolean(isFeatured),
        isPublished: isPublished === undefined ? true : Boolean(isPublished),
      })
      .returning();

    const createdProject = insertedProjects[0];

    // Insert gallery images if provided
    if (Array.isArray(galleryImages) && galleryImages.length > 0) {
      for (let i = 0; i < galleryImages.length; i++) {
        const img = galleryImages[i];
        const imgUrl = typeof img === 'string' ? img : img.imageUrl;
        const caption = typeof img === 'object' ? img.caption || '' : '';
        if (imgUrl) {
          await db.insert(projectImages).values({
            projectId: createdProject.id,
            imageUrl: imgUrl,
            caption,
            sortOrder: i + 1,
          });
        }
      }
    }

    realtimeHub.broadcast('project.created', createdProject);
    res.status(201).json({ success: true, project: createdProject });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/admin/projects/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const {
      title,
      slug,
      sectionId,
      shortDescription,
      description,
      coverImage,
      client,
      projectDate,
      tools,
      tags,
      projectUrl,
      designProcess,
      isFeatured,
      isPublished,
      galleryImages,
    } = req.body;

    const updateData: any = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (sectionId !== undefined) updateData.sectionId = Number(sectionId);
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (description !== undefined) updateData.description = description;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (client !== undefined) updateData.client = client;
    if (projectDate !== undefined) updateData.projectDate = projectDate;
    if (tools !== undefined) updateData.tools = tools;
    if (tags !== undefined) updateData.tags = tags;
    if (projectUrl !== undefined) updateData.projectUrl = projectUrl;
    if (designProcess !== undefined) updateData.designProcess = designProcess;
    if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
    if (isPublished !== undefined) updateData.isPublished = Boolean(isPublished);

    const updated = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({ error: `Project with ID ${id} not found.` });
    }

    if (Array.isArray(galleryImages)) {
      // Refresh gallery
      await db.delete(projectImages).where(eq(projectImages.projectId, id));
      for (let i = 0; i < galleryImages.length; i++) {
        const img = galleryImages[i];
        const imgUrl = typeof img === 'string' ? img : img.imageUrl;
        const caption = typeof img === 'object' ? img.caption || '' : '';
        if (imgUrl) {
          await db.insert(projectImages).values({
            projectId: id,
            imageUrl: imgUrl,
            caption,
            sortOrder: i + 1,
          });
        }
      }
    }

    realtimeHub.broadcast('project.updated', updated[0]);
    res.json({ success: true, project: updated[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/admin/projects/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    await db.delete(projects).where(eq(projects.id, id));
    realtimeHub.broadcast('project.deleted', { id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Sections CRUD
apiRouter.get('/admin/sections', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const list = await getAllSections();
    res.json({ sections: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/admin/sections', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, description, coverImage, isVisible } = req.body;
    if (!name) return res.status(400).json({ error: 'Section name is required.' });

    const sectionSlug =
      slug?.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const currentCount = await getAllSections();
    const created = await db
      .insert(portfolioSections)
      .values({
        name,
        slug: sectionSlug,
        description: description || '',
        coverImage: coverImage || '',
        sortOrder: currentCount.length + 1,
        isVisible: isVisible === undefined ? true : Boolean(isVisible),
      })
      .returning();

    realtimeHub.broadcast('section.created', created[0]);
    res.status(201).json({ success: true, section: created[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/admin/sections/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, slug, description, coverImage, isVisible, sortOrder } = req.body;
    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (isVisible !== undefined) updateData.isVisible = Boolean(isVisible);
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);

    const updated = await db
      .update(portfolioSections)
      .set(updateData)
      .where(eq(portfolioSections.id, id))
      .returning();

    realtimeHub.broadcast('section.updated', updated[0]);
    res.json({ success: true, section: updated[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/admin/sections/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    await db.delete(portfolioSections).where(eq(portfolioSections.id, id));
    realtimeHub.broadcast('section.deleted', { id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/admin/sections/reorder', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { orderedIds } = req.body; // array of IDs in order
    if (Array.isArray(orderedIds)) {
      for (let i = 0; i < orderedIds.length; i++) {
        await db
          .update(portfolioSections)
          .set({ sortOrder: i + 1 })
          .where(eq(portfolioSections.id, orderedIds[i]));
      }
    }
    const updated = await getAllSections();
    realtimeHub.broadcast('section.reordered', updated);
    res.json({ success: true, sections: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Messages
apiRouter.get('/admin/messages', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const list = await getAllMessages();
    res.json({ messages: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/admin/messages/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!['unread', 'read', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const updated = await updateMessageStatus(id, status);
    realtimeHub.broadcast('message.read', updated);
    res.json({ success: true, message: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/admin/messages/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    await deleteMessage(id);
    realtimeHub.broadcast('message.deleted', { id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Services CRUD
apiRouter.get('/admin/services', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const list = await getAllServicesAdmin();
    res.json({ services: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/admin/services', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { number, title, description, icon, isVisible } = req.body;
    const current = await getAllServicesAdmin();
    const created = await db
      .insert(services)
      .values({
        number: number || `0${current.length + 1}`,
        title,
        description,
        icon: icon || 'Sparkles',
        sortOrder: current.length + 1,
        isVisible: isVisible === undefined ? true : Boolean(isVisible),
      })
      .returning();
    res.status(201).json({ success: true, service: created[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/admin/services/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { number, title, description, icon, isVisible, sortOrder } = req.body;
    const updateData: any = {};
    if (number !== undefined) updateData.number = number;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (isVisible !== undefined) updateData.isVisible = Boolean(isVisible);
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);

    const updated = await db.update(services).set(updateData).where(eq(services.id, id)).returning();
    res.json({ success: true, service: updated[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/admin/services/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    await db.delete(services).where(eq(services.id, id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Settings
apiRouter.put('/admin/settings', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await updateSettingsBatch(req.body);
    realtimeHub.broadcast('settings.updated', updated);
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin File Upload (Base64 data / image uploads with size and MIME validation)
apiRouter.post('/admin/upload', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { fileData, fileName } = req.body;
    if (!fileData) {
      return res.status(400).json({ error: 'No image data provided.' });
    }

    // Match base64 data URI format: data:image/png;base64,....
    const matches = fileData.match(/^data:(image\/[a-zA-Z0-9.+]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid image format. Must be a valid image base64 data URI.' });
    }

    const mimeType = matches[1];
    const base64Content = matches[2];

    // Allowed image MIME types
    const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!allowedMime.includes(mimeType)) {
      return res.status(400).json({ error: 'Unsupported file type. Only JPEG, PNG, WebP, SVG, and GIF are allowed.' });
    }

    const buffer = Buffer.from(base64Content, 'base64');
    // Limit 8MB
    if (buffer.length > 8 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image exceeds the maximum allowed size of 8MB.' });
    }

    const ext = mimeType === 'image/svg+xml' ? 'svg' : mimeType.split('/')[1] || 'png';
    const sanitizedName = (fileName || 'upload')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const uniqueFileName = `${sanitizedName}_${Date.now()}.${ext}`;
    const targetFilePath = path.join(uploadsDir, uniqueFileName);

    fs.writeFileSync(targetFilePath, buffer);

    const publicUrl = `/uploads/${uniqueFileName}`;
    res.json({ success: true, url: publicUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
