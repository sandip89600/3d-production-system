import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logPageView } from '../../utils/analytics';

export default function SEO({ title, description, robots = 'index, follow', breadcrumbs = [], schema = null, image = null }) {
  const location = useLocation();

  useEffect(() => {
    // 1. Dynamic title
    const brandSuffix = ' | All 3D Studio';
    const cleanTitle = title.endsWith(brandSuffix) ? title : `${title}${brandSuffix}`;
    document.title = cleanTitle;

    // Log page view dynamically
    logPageView(location.pathname + location.search, cleanTitle);

    // 2. Dynamic description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // 3. Dynamic canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    // Remove trailing slash if present in pathname to enforce consistency
    const path = location.pathname === '/' ? '' : location.pathname;
    const currentUrl = `https://www.all3dstudio.deepitlabs.in${path}`;
    canonical.setAttribute('href', currentUrl);

    // 4. Dynamic robots
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', robots);

    // 5. Social Graph tags update
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', cleanTitle);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', currentUrl);

    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', cleanTitle);

    let twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', description);

    // Preview Image setup (Open Graph & Twitter Cards)
    const ogImageFallback = 'https://www.all3dstudio.deepitlabs.in/apple-touch-icon.png';
    const targetImage = image || ogImageFallback;

    let ogImg = document.querySelector('meta[property="og:image"]');
    if (!ogImg) {
      ogImg = document.createElement('meta');
      ogImg.setAttribute('property', 'og:image');
      document.head.appendChild(ogImg);
    }
    ogImg.setAttribute('content', targetImage);

    let twitterImg = document.querySelector('meta[name="twitter:image"]');
    if (!twitterImg) {
      twitterImg = document.createElement('meta');
      twitterImg.setAttribute('name', 'twitter:image');
      document.head.appendChild(twitterImg);
    }
    twitterImg.setAttribute('content', targetImage);

    let twitterCard = document.querySelector('meta[name="twitter:card"]');
    if (!twitterCard) {
      twitterCard = document.createElement('meta');
      twitterCard.setAttribute('name', 'twitter:card');
      document.head.appendChild(twitterCard);
    }
    twitterCard.setAttribute('content', 'summary_large_image');

    // 6. Dynamic Breadcrumb Schema (JSON-LD)
    let breadcrumbScript = document.getElementById('seo-breadcrumb-jsonld');
    if (breadcrumbs && breadcrumbs.length > 0) {
      if (!breadcrumbScript) {
        breadcrumbScript = document.createElement('script');
        breadcrumbScript.setAttribute('id', 'seo-breadcrumb-jsonld');
        breadcrumbScript.setAttribute('type', 'application/ld+json');
        document.head.appendChild(breadcrumbScript);
      }
      
      const breadcrumbList = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((b, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": b.name,
          "item": b.path.startsWith('http') ? b.path : `https://www.all3dstudio.deepitlabs.in${b.path === '/' ? '' : b.path}`
        }))
      };
      
      breadcrumbScript.textContent = JSON.stringify(breadcrumbList);
    } else if (breadcrumbScript) {
      breadcrumbScript.remove();
    }

    // 7. Dynamic Custom Schema Injection (JSON-LD)
    let customSchemaScript = document.getElementById('seo-custom-jsonld');
    if (schema) {
      if (!customSchemaScript) {
        customSchemaScript = document.createElement('script');
        customSchemaScript.setAttribute('id', 'seo-custom-jsonld');
        customSchemaScript.setAttribute('type', 'application/ld+json');
        document.head.appendChild(customSchemaScript);
      }
      customSchemaScript.textContent = JSON.stringify(schema);
    } else if (customSchemaScript) {
      customSchemaScript.remove();
    }

    return () => {
      // Cleanup dynamically injected scripts on unmount
      const scriptToCleanup = document.getElementById('seo-breadcrumb-jsonld');
      if (scriptToCleanup) {
        scriptToCleanup.remove();
      }
      const customScriptToCleanup = document.getElementById('seo-custom-jsonld');
      if (customScriptToCleanup) {
        customScriptToCleanup.remove();
      }
    };
  }, [title, description, robots, location.pathname, JSON.stringify(breadcrumbs), JSON.stringify(schema), image]);

  return null;
}
