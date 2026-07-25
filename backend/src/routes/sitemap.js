const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Dynamic sitemap generator
router.get('/sitemap.xml', async (req, res) => {
  try {
    const DOMAIN = 'https://www.all3dstudio.deepitlabs.in';
    
    // 1. Static base paths
    const pages = [
      { loc: `${DOMAIN}/`, changefreq: 'weekly', priority: '1.0' },
      { loc: `${DOMAIN}/about`, changefreq: 'monthly', priority: '0.8' },
      { loc: `${DOMAIN}/portfolio`, changefreq: 'weekly', priority: '0.9' },
      { loc: `${DOMAIN}/gallery`, changefreq: 'weekly', priority: '0.9' },
      { loc: `${DOMAIN}/blog`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${DOMAIN}/contact`, changefreq: 'monthly', priority: '0.8' }
    ];

    // 2. Future dynamic portfolio pages (automatically pull from Portfolio/Project collections if they exist later)
    try {
      if (mongoose.models.PortfolioProject) {
        const portfolioItems = await mongoose.models.PortfolioProject.find({ isPublic: true });
        portfolioItems.forEach(item => {
          pages.push({
            loc: `${DOMAIN}/portfolio/${item.slug || item._id}`,
            changefreq: 'weekly',
            priority: '0.8',
            lastmod: item.updatedAt ? item.updatedAt.toISOString().split('T')[0] : undefined
          });
        });
      }
    } catch (e) {
      console.warn('PortfolioProject model not found. Skipping dynamic portfolio sitemap injection.');
    }

    // 3. Future dynamic blog pages (automatically pull from Blog/Post collections if they exist later)
    try {
      if (mongoose.models.BlogPost) {
        const posts = await mongoose.models.BlogPost.find({ isPublished: true });
        posts.forEach(post => {
          pages.push({
            loc: `${DOMAIN}/blog/${post.slug || post._id}`,
            changefreq: 'weekly',
            priority: '0.7',
            lastmod: post.updatedAt ? post.updatedAt.toISOString().split('T')[0] : undefined
          });
        });
      }
    } catch (e) {
      console.warn('BlogPost model not found. Skipping dynamic blog sitemap injection.');
    }

    // Build XML string
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    pages.forEach(p => {
      xml += '  <url>\n';
      xml += `    <loc>${p.loc}</loc>\n`;
      xml += `    <changefreq>${p.changefreq}</changefreq>\n`;
      xml += `    <priority>${p.priority}</priority>\n`;
      if (p.lastmod) {
        xml += `    <lastmod>${p.lastmod}</lastmod>\n`;
      }
      xml += '  </url>\n';
    });
    
    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    res.status(500).send('Error generating sitemap: ' + error.message);
  }
});

module.exports = router;
