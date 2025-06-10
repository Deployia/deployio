import { Helmet } from "react-helmet-async";
import PropTypes from "prop-types";
import { useEffect } from "react";
import {
  getSEOConfig,
  generateStructuredData,
  generateMetaTags,
} from "@utils/seo.js";

/**
 * SEO Component - Handles meta tags, structured data, and SEO optimization
 * @param {Object} props - Component props
 * @param {string} props.page - Page identifier for SEO config
 * @param {Object} props.customSEO - Custom SEO overrides
 * @param {Object} props.structuredData - Custom structured data
 */
const SEO = ({ page, customSEO = {}, structuredData = null }) => {
  // Get SEO configuration for the page
  const seoConfig = getSEOConfig(page, customSEO);

  // Generate meta tags
  const metaTags = generateMetaTags(seoConfig);

  // Use provided structured data or fall back to config
  const finalStructuredData = structuredData || seoConfig.structuredData;
  const structuredDataScript = generateStructuredData(finalStructuredData);

  // Ensure the title is set immediately when component mounts
  useEffect(() => {
    // Set document title as a fallback for better SEO on direct URL access
    if (typeof document !== "undefined" && seoConfig.title) {
      document.title = seoConfig.title;
    }
  }, [seoConfig.title]);
  return (
    <Helmet prioritizeSeoTags>
      {/* Page title */}
      <title>{seoConfig.title}</title>

      {/* Meta tags */}
      {metaTags.map((tag, index) => {
        if (tag.property) {
          return (
            <meta key={index} property={tag.property} content={tag.content} />
          );
        }
        return <meta key={index} name={tag.name} content={tag.content} />;
      })}

      {/* Canonical URL */}
      <link rel="canonical" href={seoConfig.url} />

      {/* Favicon and app icons */}
      <link rel="icon" type="image/png" href="/favicon.png" />
      <link rel="apple-touch-icon" href="/logo.png" />

      {/* Preconnect for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />

      {/* Language and direction */}
      <html lang="en" dir="ltr" />

      {/* Structured data */}
      {structuredDataScript && (
        <script
          type={structuredDataScript.type}
          dangerouslySetInnerHTML={{ __html: structuredDataScript.innerHTML }}
        />
      )}

      {/* Additional custom meta tags from props */}
      {customSEO.additionalMetaTags &&
        customSEO.additionalMetaTags.map((tag, index) => (
          <meta key={`custom-${index}`} {...tag} />
        ))}

      {/* Custom link tags */}
      {customSEO.additionalLinkTags &&
        customSEO.additionalLinkTags.map((link, index) => (
          <link key={`custom-link-${index}`} {...link} />
        ))}
    </Helmet>
  );
};

SEO.propTypes = {
  page: PropTypes.string.isRequired,
  customSEO: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    keywords: PropTypes.string,
    image: PropTypes.string,
    url: PropTypes.string,
    type: PropTypes.string,
    robots: PropTypes.string,
    additionalMetaTags: PropTypes.arrayOf(PropTypes.object),
    additionalLinkTags: PropTypes.arrayOf(PropTypes.object),
  }),
  structuredData: PropTypes.object,
};

export default SEO;
