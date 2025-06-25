import Script from 'next/script';

interface StructuredDataProps {
  type: 'website' | 'organization' | 'product' | 'article' | 'faq';
  data: any;
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const getStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
    };

    switch (type) {
      case 'website':
        return {
          ...baseData,
          '@type': 'WebSite',
          name: 'Zenith',
          description: 'AI-Powered Website Optimization Platform',
          url: 'https://zenith.engineer',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://zenith.engineer/search?q={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
        };

      case 'organization':
        return {
          ...baseData,
          '@type': 'Organization',
          name: 'Zenith',
          description: 'AI-Powered Website Optimization Platform',
          url: 'https://zenith.engineer',
          logo: 'https://zenith.engineer/logo.png',
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+1-555-123-4567',
            contactType: 'customer service',
            email: 'hello@zenith.engineer',
          },
          sameAs: [
            'https://twitter.com/zenithplatform',
            'https://linkedin.com/company/zenith-platform',
            'https://github.com/zenith-platform',
          ],
          founder: [
            {
              '@type': 'Person',
              name: 'Sarah Chen',
              jobTitle: 'CEO & Co-founder',
            },
            {
              '@type': 'Person',
              name: 'Marcus Rodriguez',
              jobTitle: 'CTO & Co-founder',
            },
          ],
        };

      case 'product':
        return {
          ...baseData,
          '@type': 'SoftwareApplication',
          name: 'Zenith Platform',
          description: 'AI-Powered Website Optimization Platform',
          url: 'https://zenith.engineer',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web Browser',
          offers: {
            '@type': 'Offer',
            priceCurrency: 'USD',
            price: '29',
            priceValidUntil: '2024-12-31',
            availability: 'https://schema.org/InStock',
            seller: {
              '@type': 'Organization',
              name: 'Zenith',
            },
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            ratingCount: '256',
            bestRating: '5',
            worstRating: '1',
          },
          ...data,
        };

      case 'article':
        return {
          ...baseData,
          '@type': 'Article',
          headline: data.title,
          description: data.description,
          url: data.url,
          datePublished: data.publishedAt,
          dateModified: data.modifiedAt || data.publishedAt,
          author: {
            '@type': 'Person',
            name: data.author?.name || 'Zenith Team',
          },
          publisher: {
            '@type': 'Organization',
            name: 'Zenith',
            logo: {
              '@type': 'ImageObject',
              url: 'https://zenith.engineer/logo.png',
            },
          },
          mainEntityOfPage: data.url,
          image: data.image,
        };

      case 'faq':
        return {
          ...baseData,
          '@type': 'FAQPage',
          mainEntity: data.faqs?.map((faq: any) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })) || [],
        };

      default:
        return baseData;
    }
  };

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(getStructuredData()),
      }}
    />
  );
}