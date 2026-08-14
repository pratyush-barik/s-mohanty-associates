import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://smohantyassociates.com'; // Replace with actual production URL if different

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/portal/owner/', '/portal/manager/', '/portal/field-agent/', '/portal/report-agent/', '/portal/reports/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
