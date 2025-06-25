import { StarIcon } from '@heroicons/react/20/solid';

const testimonials = [
  {
    content:
      'Zenith transformed our website performance completely. We saw a 43% increase in revenue within the first quarter of implementation. The AI-powered insights were game-changing.',
    author: {
      name: 'Sarah Johnson',
      role: 'VP of Digital Marketing',
      company: 'GlobalShop',
      imageUrl: '/testimonials/sarah-johnson.jpg', // Placeholder
    },
    rating: 5,
    metrics: {
      revenue: '+43%',
      conversion: '+28%',
      pageSpeed: '+62%',
    }
  },
  {
    content:
      'The competitive intelligence features gave us insights that completely changed our strategy. We now outperform competitors who have been in the market for years.',
    author: {
      name: 'Mike Chen',
      role: 'Co-founder & CEO',
      company: 'TechFlow',
      imageUrl: '/testimonials/mike-chen.jpg', // Placeholder
    },
    rating: 5,
    metrics: {
      conversion: '+89%',
      churn: '-45%',
      ltv: '+67%',
    }
  },
  {
    content:
      'Our organic search performance has exceeded all expectations. The quality of leads we\'re getting now is significantly higher than before implementing Zenith.',
    author: {
      name: 'Robert Kim',
      role: 'Director of Marketing',
      company: 'WealthAdvisors',
      imageUrl: '/testimonials/robert-kim.jpg', // Placeholder
    },
    rating: 5,
    metrics: {
      leads: '+73%',
      organic: '+91%',
      ranking: '+84%',
    }
  },
  {
    content:
      'Patient satisfaction scores have never been higher. The website improvements made it so much easier for our patients to find information and book appointments.',
    author: {
      name: 'Dr. Lisa Rodriguez',
      role: 'Chief Medical Officer',
      company: 'HealthFirst Medical',
      imageUrl: '/testimonials/lisa-rodriguez.jpg', // Placeholder
    },
    rating: 5,
    metrics: {
      appointments: '+56%',
      satisfaction: '+41%',
      accessibility: '+78%',
    }
  },
  {
    content:
      'We went from having virtually no online presence to generating 40% of our leads digitally. The transformation has been remarkable for our B2B sales.',
    author: {
      name: 'James Thompson',
      role: 'VP of Sales & Marketing',
      company: 'IndustrialTech',
      imageUrl: '/testimonials/james-thompson.jpg', // Placeholder
    },
    rating: 5,
    metrics: {
      inquiries: '+125%',
      mobile: '+89%',
      sales: '+45%',
    }
  },
  {
    content:
      'The impact on our mission has been incredible. We\'re now able to help twice as many families thanks to the increased donations through our website.',
    author: {
      name: 'Maria Gonzalez',
      role: 'Executive Director',
      company: 'GlobalAid Foundation',
      imageUrl: '/testimonials/maria-gonzalez.jpg', // Placeholder
    },
    rating: 5,
    metrics: {
      donations: '+156%',
      donors: '+89%',
      retention: '+67%',
    }
  },
];

interface TestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  showMetrics?: boolean;
  maxTestimonials?: number;
  layout?: 'grid' | 'carousel';
}

export default function TestimonialsSection({
  title = "Trusted by thousands of businesses",
  subtitle = "Don't just take our word for it. See what our customers are saying about their experience with Zenith.",
  showMetrics = true,
  maxTestimonials = 6,
  layout = 'grid'
}: TestimonialsSectionProps) {
  const displayedTestimonials = testimonials.slice(0, maxTestimonials);

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-lg font-semibold leading-8 tracking-tight text-blue-600">Testimonials</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {title}
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            {subtitle}
          </p>
        </div>
        
        <div className={`mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none ${
          layout === 'grid' 
            ? 'lg:grid-cols-3' 
            : 'lg:grid-cols-2'
        }`}>
          {displayedTestimonials.map((testimonial, testimonialIdx) => (
            <div key={testimonialIdx} className="bg-gray-50 rounded-2xl p-8">
              {/* Star Rating */}
              <div className="flex gap-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
                ))}
              </div>
              
              {/* Testimonial Content */}
              <blockquote className="text-gray-900">
                <p>"{testimonial.content}"</p>
              </blockquote>
              
              {/* Metrics */}
              {showMetrics && (
                <div className="mt-6 grid grid-cols-3 gap-4">
                  {Object.entries(testimonial.metrics).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="text-lg font-bold text-blue-600">{value}</div>
                      <div className="text-xs text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Author */}
              <figcaption className="mt-6 flex items-center gap-x-4">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-500">
                    {testimonial.author.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.author.name}</div>
                  <div className="text-sm leading-6 text-gray-600">
                    {testimonial.author.role}, {testimonial.author.company}
                  </div>
                </div>
              </figcaption>
            </div>
          ))}
        </div>

        {/* Logos Section */}
        <div className="mt-16 text-center">
          <p className="text-base font-semibold leading-7 text-gray-600">
            Trusted by industry leaders
          </p>
          <div className="mx-auto mt-8 grid max-w-lg grid-cols-4 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:grid-cols-6 sm:gap-x-10 lg:mx-0 lg:max-w-none lg:grid-cols-5">
            {/* Company Logos - Placeholder */}
            {['GlobalShop', 'TechFlow', 'WealthAdvisors', 'HealthFirst', 'IndustrialTech'].map((company) => (
              <div key={company} className="col-span-2 max-h-12 w-full object-contain lg:col-span-1 flex items-center justify-center">
                <div className="text-gray-400 font-semibold text-sm">{company}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}