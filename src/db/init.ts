import { pool } from './index.ts';

export async function ensureDatabaseSchema() {
  const client = await pool.connect();
  try {
    // 1. Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uid TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        role TEXT DEFAULT 'admin' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 2. Portfolio Sections
    await client.query(`
      CREATE TABLE IF NOT EXISTS portfolio_sections (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT DEFAULT '',
        cover_image TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0 NOT NULL,
        is_visible BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 3. Projects
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        section_id INTEGER NOT NULL REFERENCES portfolio_sections(id) ON DELETE CASCADE,
        short_description TEXT DEFAULT '',
        description TEXT NOT NULL,
        cover_image TEXT NOT NULL,
        client TEXT DEFAULT '',
        project_date TEXT DEFAULT '',
        tools TEXT DEFAULT '',
        tags TEXT DEFAULT '',
        project_url TEXT DEFAULT '',
        design_process TEXT DEFAULT '',
        is_featured BOOLEAN DEFAULT FALSE NOT NULL,
        is_published BOOLEAN DEFAULT TRUE NOT NULL,
        sort_order INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 4. Project Images
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_images (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        caption TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 5. Messages
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'unread' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 6. Services
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        number TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0 NOT NULL,
        is_visible BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 7. Settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Seed default sections if empty
    const secCountRes = await client.query('SELECT COUNT(*) FROM portfolio_sections');
    if (parseInt(secCountRes.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO portfolio_sections (name, slug, description, sort_order, is_visible)
        VALUES 
          ('Branding & Identity', 'branding-identity', 'Visual identities, typography, brand marks and guidelines', 1, true),
          ('Poster & Print', 'poster-print', 'Cinematic posters, key visual art, editorial and cover design', 2, true),
          ('Apparel & Merch', 'apparel-merch', 'Streetwear graphics, apparel graphics and garment prints', 3, true),
          ('Social & Digital', 'social-digital', 'High-impact digital content, banners, and campaign assets', 4, true)
        ON CONFLICT (slug) DO NOTHING;
      `);
    }

    // Seed default services if empty
    const srvCountRes = await client.query('SELECT COUNT(*) FROM services');
    if (parseInt(srvCountRes.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO services (number, title, description, icon, sort_order, is_visible)
        VALUES 
          ('01', 'Brand Identity & Logo Design', 'Crafting iconic monograms, comprehensive brand guides, typography systems, and color strategies that command authority in modern markets.', 'PenTool', 1, true),
          ('02', 'Art Direction & Key Visuals', 'Holistic visual storytelling, album artwork, editorial covers, and creative concepting that translates bold ideas into unforgettable visuals.', 'Sparkles', 2, true),
          ('03', 'Poster & Print Production', 'High-impact print advertising, exhibition posters, packaging, and tactile collateral engineered for both physical and digital exhibitions.', 'Layers', 3, true),
          ('04', 'Apparel & Merch Graphics', 'Contemporary streetwear graphics, screen print vector separations, garment tag design, and branded merchandise collections.', 'Shirt', 4, true),
          ('05', 'Digital & Social Content', 'Punchy social media campaign visual systems, promotional motion banners, and digital graphics tailored for maximum engagement.', 'Share2', 5, true),
          ('06', 'Design Systems & UI Layout', 'Modern digital interfaces, portfolio concepts, typography-driven web mockups, and cohesive digital design kits.', 'Layout', 6, true)
        ON CONFLICT DO NOTHING;
      `);
    }

    // Seed default settings if empty
    const settingsCountRes = await client.query('SELECT COUNT(*) FROM settings');
    if (parseInt(settingsCountRes.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO settings (key, value)
        VALUES
          ('site_title', 'LORD ZICCO'),
          ('hero_label', 'GRAPHIC DESIGNER'),
          ('hero_headline', 'CREATIVE DESIGN.\nBOLD IDEAS.'),
          ('hero_description', 'I''m Lord Zicco, a graphic designer focused on creating modern, bold and memorable visual identities.'),
          ('hero_image', '/src/assets/images/hero_lord_zicco_1792235845811.jpg'),
          ('about_title', 'TURNING IDEAS INTO VISUAL EXPERIENCES.'),
          ('about_description', 'I''m a graphic designer with a passion for turning ideas into powerful visual experiences. I specialize in branding, digital design, poster design, apparel and UI/UX.'),
          ('about_quote', 'Great design isn''t just what it looks like. It''s how it makes you feel.'),
          ('about_image', '/src/assets/images/about_lord_zicco_1792235847162.jpg'),
          ('stat_experience', '06+'),
          ('stat_projects', '140+'),
          ('stat_clients', '85+'),
          ('contact_email', 'lordzicco@gmail.com'),
          ('contact_phone', '+233 54 123 4567'),
          ('contact_location', 'Accra, Ghana'),
          ('social_instagram', 'https://instagram.com/lordzicco'),
          ('social_x', 'https://x.com/lordzicco'),
          ('social_behance', 'https://behance.net/lordzicco'),
          ('social_youtube', 'https://youtube.com/@lordzicco')
        ON CONFLICT (key) DO NOTHING;
      `);
    }

    // Seed default projects if empty
    const projCountRes = await client.query('SELECT COUNT(*) FROM projects');
    if (parseInt(projCountRes.rows[0].count, 10) === 0) {
      const brandingRes = await client.query("SELECT id FROM portfolio_sections WHERE slug = 'branding-identity' LIMIT 1");
      const posterRes = await client.query("SELECT id FROM portfolio_sections WHERE slug = 'poster-print' LIMIT 1");
      const apparelRes = await client.query("SELECT id FROM portfolio_sections WHERE slug = 'apparel-merch' LIMIT 1");
      const digitalRes = await client.query("SELECT id FROM portfolio_sections WHERE slug = 'social-digital' LIMIT 1");

      const brandingId = brandingRes.rows[0]?.id || 1;
      const posterId = posterRes.rows[0]?.id || 2;
      const apparelId = apparelRes.rows[0]?.id || 3;
      const digitalId = digitalRes.rows[0]?.id || 4;

      await client.query(`
        INSERT INTO projects (
          title, slug, section_id, short_description, description, cover_image,
          client, project_date, tools, tags, project_url, design_process, is_featured, is_published, sort_order
        ) VALUES 
        (
          'Neo-Tokyo Cyberpunk Identity',
          'neo-tokyo-cyberpunk-identity',
          ${brandingId},
          'Comprehensive visual identity and typography system for futuristic media brand.',
          'Developed a high-octane branding identity rooted in Japanese cyber-aesthetics, custom geometric typography, and modular neon asset packs for cross-platform deployment.',
          '/src/assets/images/portfolio_brand_mcrc_1792235846871.jpg',
          'Kurogane Studios',
          '2026',
          'Illustrator, Photoshop, Glyphs',
          'Branding, Cyberpunk, Typography',
          'https://behance.net/lordzicco',
          'Phase 1: Deep research into retro-futurism & kanji typography.\nPhase 2: Custom letterform drafting in Glyphs.\nPhase 3: High-contrast holographic foil print executions.',
          true,
          true,
          1
        ),
        (
          'Cosmic Dream Key Visual & Poster',
          'cosmic-dream-key-visual',
          ${posterId},
          'Official tour poster and promotional key visual art series.',
          'Explores deep space surrealism with vibrant gradient textures, bespoke distressed typography, and rich visual layering designed for stadium screen projections and limited-edition prints.',
          '/src/assets/images/portfolio_poster_dream_1792235848921.jpg',
          'Starlight Electronic Tour',
          '2026',
          'Photoshop, Blender, InDesign',
          'Key Visual, Poster, 3D Art',
          'https://behance.net/lordzicco',
          'Combined 3D particle simulations from Blender with hand-textured organic film grain in Photoshop to produce a tangible tactile quality.',
          true,
          true,
          2
        ),
        (
          'Hyper-Future UI & Spatial Concept',
          'hyper-future-ui-spatial',
          ${digitalId},
          'Next-generation dark-mode spatial interface and design system.',
          'Crafted an ultra-clean visual UI concept with high-tech HUD elements, micro-interactions, and neon accent tokens for next-generation holographic displays and mobile devices.',
          '/src/assets/images/portfolio_uiux_app_1792235848155.jpg',
          'Aetheria OS',
          '2025',
          'Figma, After Effects, Illustrator',
          'UI/UX, Spatial, Interface',
          'https://behance.net/lordzicco',
          'Engineered a scalable design token architecture with high readability in low-light environments.',
          true,
          true,
          3
        ),
        (
          'Vanguard Streetwear Capsule Series',
          'vanguard-streetwear-capsule',
          ${apparelId},
          'Oversized heavy-cotton apparel graphics and back-print compositions.',
          'Engineered bold typography-heavy apparel graphics designed for high-density screen printing on 400gsm heavyweight French terry streetwear garments.',
          'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1200&q=80',
          'Vanguard Atelier',
          '2025',
          'Illustrator, Separation Studio',
          'Apparel, Merch, Streetwear',
          'https://behance.net/lordzicco',
          'Formulated 6-color spot simulation separations and engineered custom neck tags and hangtag packaging.',
          true,
          true,
          4
        ),
        (
          'Aura Audio Brand System',
          'aura-audio-brand-system',
          ${brandingId},
          'Visual architecture for boutique sound engineering house.',
          'Minimalist identity system using frequency waveform motifs, strict Swiss modernist grid layouts, and custom foil debossed stationery.',
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
          'Aura Acoustics London',
          '2025',
          'Illustrator, InDesign',
          'Identity, Minimalist, Sound',
          'https://behance.net/lordzicco',
          'Derived proportions from harmonic acoustic ratios to create a mathematically grounded logo symbol.',
          false,
          true,
          5
        ),
        (
          'Genesis Tour Key Poster',
          'genesis-tour-key-poster',
          ${posterId},
          'Typographic festival poster and digital billboard rollout.',
          'Experimental large-format festival poster design highlighting kinetic typography, high-contrast duo-tone imagery, and tactile scanner distortion techniques.',
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
          'Genesis Worldwide',
          '2025',
          'Photoshop, InDesign',
          'Poster, Typography, Music',
          'https://behance.net/lordzicco',
          'Scanned physical print prototypes under rapid scanner movement to achieve natural analog optical aberrations.',
          false,
          true,
          6
        )
        ON CONFLICT (slug) DO NOTHING;
      `);
    }
  } catch (err) {
    console.warn('Database schema ensure check completed with notice:', err);
  } finally {
    client.release();
  }
}
