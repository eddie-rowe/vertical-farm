/**
 * SEO and Metadata utilities for improved search engine optimization
 */

import { Metadata, Viewport } from "next";

interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article" | "profile";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
  noFollow?: boolean;
  locale?: string;
  siteName?: string;
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  twitterSite?: string;
  twitterCreator?: string;
}

interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    twitter?: string;
    github?: string;
  };
}

// Default site configuration
export const siteConfig: SiteConfig = {
  name: "Vertical Farm",
  description:
    "Advanced vertical farming management system with IoT integration and Home Assistant compatibility",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://vertical-farm.app",
  ogImage: "/og.jpg",
  links: {
    twitter: "https://twitter.com/verticalfarm",
    github: "https://github.com/your-username/vertical-farm",
  },
};

// Default viewport configuration
export const defaultViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

/**
 * Generate comprehensive metadata for a page
 */
export function generateMetadata(config: SEOConfig = {}): Metadata {
  const {
    title,
    description = siteConfig.description,
    keywords = [],
    canonical,
    image = siteConfig.ogImage,
    imageAlt,
    type = "website",
    publishedTime,
    modifiedTime,
    author,
    section,
    tags = [],
    noIndex = false,
    noFollow = false,
    locale = "en_US",
    siteName = siteConfig.name,
    twitterCard = "summary_large_image",
    twitterSite,
    twitterCreator,
  } = config;

  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const imageUrl = image.startsWith("http")
    ? image
    : `${siteConfig.url}${image}`;

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords.join(", ") : undefined,
    authors: author ? [{ name: author }] : undefined,
    creator: author,
    publisher: siteName,
    metadataBase: new URL(siteConfig.url),

    // Canonical URL
    alternates: canonical
      ? {
          canonical,
        }
      : undefined,

    // Robots
    robots: {
      index: !noIndex,
      follow: !noFollow,
      googleBot: {
        index: !noIndex,
        follow: !noFollow,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    // Open Graph
    openGraph: {
      type,
      locale,
      url: canonical || siteConfig.url,
      siteName,
      title: fullTitle,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt || description,
        },
      ],
      ...(type === "article" && {
        publishedTime,
        modifiedTime,
        authors: author ? [author] : undefined,
        section,
        tags,
      }),
    },

    // Twitter
    twitter: {
      card: twitterCard,
      title: fullTitle,
      description,
      images: [imageUrl],
      creator: twitterCreator,
      site: twitterSite,
    },

    // Additional metadata
    other: {
      "msapplication-TileColor": "#000000",
      "theme-color": "#000000",
    },
  };

  return metadata;
}

/**
 * Generate structured data for search engines
 */
export function generateStructuredData(config: {
  type: "WebSite" | "Article" | "Product" | "Organization" | "BreadcrumbList";
  data: Record<string, any>;
}) {
  const { type, data } = config;

  const baseStructuredData = {
    "@context": "https://schema.org",
    "@type": type,
    ...data,
  };

  return {
    __html: JSON.stringify(baseStructuredData),
  };
}

/**
 * Common structured data generators
 */
export const structuredDataGenerators = {
  website: () =>
    generateStructuredData({
      type: "WebSite",
      data: {
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    }),

  organization: () =>
    generateStructuredData({
      type: "Organization",
      data: {
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        logo: `${siteConfig.url}/logo.png`,
        sameAs: Object.values(siteConfig.links).filter(Boolean),
      },
    }),

  article: (article: {
    title: string;
    description: string;
    author: string;
    datePublished: string;
    dateModified?: string;
    image?: string;
    url?: string;
  }) =>
    generateStructuredData({
      type: "Article",
      data: {
        headline: article.title,
        description: article.description,
        author: {
          "@type": "Person",
          name: article.author,
        },
        publisher: {
          "@type": "Organization",
          name: siteConfig.name,
          logo: {
            "@type": "ImageObject",
            url: `${siteConfig.url}/logo.png`,
          },
        },
        datePublished: article.datePublished,
        dateModified: article.dateModified || article.datePublished,
        image: article.image ? `${siteConfig.url}${article.image}` : undefined,
        url: article.url || siteConfig.url,
      },
    }),

  breadcrumbs: (items: Array<{ name: string; url: string }>) =>
    generateStructuredData({
      type: "BreadcrumbList",
      data: {
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: `${siteConfig.url}${item.url}`,
        })),
      },
    }),
};

/**
 * SEO-friendly URL slug generator
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generate meta tags for social media preview
 */
export function generateSocialPreviewTags(config: SEOConfig) {
  const tags = [];

  // Open Graph
  if (config.title) tags.push({ property: "og:title", content: config.title });
  if (config.description)
    tags.push({ property: "og:description", content: config.description });
  if (config.image) tags.push({ property: "og:image", content: config.image });
  if (config.type) tags.push({ property: "og:type", content: config.type });

  // Twitter
  if (config.twitterCard)
    tags.push({ name: "twitter:card", content: config.twitterCard });
  if (config.twitterSite)
    tags.push({ name: "twitter:site", content: config.twitterSite });
  if (config.twitterCreator)
    tags.push({ name: "twitter:creator", content: config.twitterCreator });

  return tags;
}

/**
 * Generate sitemap data
 */
export interface SitemapEntry {
  url: string;
  lastModified?: Date;
  changeFrequency?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
}

export function generateSitemapEntry(
  path: string,
  options: Omit<SitemapEntry, "url"> = {},
): SitemapEntry {
  return {
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
    ...options,
  };
}

/**
 * SEO performance helpers
 */
export const seoHelpers = {
  // Check if external links should have rel="noopener noreferrer"
  getExternalLinkProps: (url: string) => {
    const isExternal = !url.startsWith("/") && !url.startsWith(siteConfig.url);
    return isExternal
      ? {
          target: "_blank",
          rel: "noopener noreferrer",
        }
      : {};
  },

  // Generate preload hints for critical resources
  generatePreloadHints: (
    resources: Array<{ href: string; as: string; type?: string }>,
  ) => {
    return resources
      .map(
        (resource) =>
          `<link rel="preload" href="${resource.href}" as="${resource.as}"${
            resource.type ? ` type="${resource.type}"` : ""
          }>`,
      )
      .join("\n");
  },

  // Check if content meets SEO best practices
  validateContent: (content: {
    title?: string;
    description?: string;
    headings?: string[];
  }) => {
    const issues = [];

    if (!content.title) {
      issues.push("Missing page title");
    } else if (content.title.length > 60) {
      issues.push("Title too long (over 60 characters)");
    }

    if (!content.description) {
      issues.push("Missing meta description");
    } else if (content.description.length > 160) {
      issues.push("Meta description too long (over 160 characters)");
    }

    if (!content.headings?.some((h) => h.startsWith("h1"))) {
      issues.push("Missing H1 heading");
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  },
};
