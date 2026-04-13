import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  recipeData?: any; // For JSON-LD
}

export function SEO({ 
  title, 
  description = "ReciBee - The Git-inspired recipe repository. Fork, edit, and version your favorite recipes with technical precision.", 
  canonical, 
  ogType = "website",
  ogImage = "https://picsum.photos/seed/recibee/1200/630",
  recipeData
}: SEOProps) {
  const siteTitle = title ? `${title} | ReciBee` : "ReciBee | Fork the Flavor";
  const url = canonical || window.location.href;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="alternate icon" type="image/png" href="/favicon.png" />
      <link rel="apple-touch-icon" href="/favicon.png" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data (JSON-LD) */}
      {recipeData && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Recipe",
            "name": recipeData.title,
            "image": ogImage,
            "author": {
              "@type": "Person",
              "name": recipeData.authorName || "ReciBee User"
            },
            "datePublished": recipeData.created_at,
            "description": description,
            "recipeIngredient": recipeData.ingredients?.map((i: any) => `${i.amount} ${i.unit} ${i.item}`),
            "recipeInstructions": recipeData.steps?.map((s: string, index: number) => ({
              "@type": "HowToStep",
              "text": s,
              "position": index + 1
            }))
          })}
        </script>
      )}
    </Helmet>
  );
}
