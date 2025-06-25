'use client';

import { useState } from 'react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { 
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us - Get in Touch with Our Optimization Experts',
  description: 'Contact Zenith for personalized demos, sales inquiries, or technical support. Our team is ready to help you optimize your website performance.',
  keywords: ['contact zenith', 'demo request', 'sales inquiry', 'technical support', 'website optimization help', 'get in touch'],
  openGraph: {
    title: 'Contact Zenith - Get in Touch with Our Optimization Experts',
    description: 'Contact us for personalized demos, sales inquiries, or technical support. Ready to help optimize your website.',
    url: 'https://zenith.engineer/contact',
  },
  twitter: {
    title: 'Contact Zenith - Get in Touch with Our Optimization Experts',
    description: 'Contact us for personalized demos, sales inquiries, or technical support. Ready to help optimize your website.',
  },
  alternates: {
    canonical: '/contact',
  },
};

const contactInfo = [
  {
    name: 'Email',
    value: 'hello@zenith.engineer',
    href: 'mailto:hello@zenith.engineer',
    icon: EnvelopeIcon,
  },
  {
    name: 'Phone',
    value: '+1 (555) 123-4567',
    href: 'tel:+15551234567',
    icon: PhoneIcon,
  },
  {
    name: 'Address',
    value: '123 Innovation Drive, San Francisco, CA 94105',
    href: '#',
    icon: MapPinIcon,
  },
  {
    name: 'Business Hours',
    value: 'Mon-Fri 9am-6pm PST',
    href: '#',
    icon: ClockIcon,
  },
];

const offices = [
  {
    city: 'San Francisco',
    address: '123 Innovation Drive, San Francisco, CA 94105',
    phone: '+1 (555) 123-4567',
    email: 'sf@zenith.engineer',
  },
  {
    city: 'New York',
    address: '456 Tech Avenue, New York, NY 10001',
    phone: '+1 (555) 987-6543',
    email: 'ny@zenith.engineer',
  },
  {
    city: 'London',
    address: '789 Digital Street, London EC1A 1AA, UK',
    phone: '+44 20 1234 5678',
    email: 'london@zenith.engineer',
  },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
    phone: '',
    websiteUrl: '',
    employees: '',
    inquiryType: 'demo',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    try {
      // In a real app, you'd send this to your API
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSubmitted(true);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <MarketingLayout>
        <div className="bg-white px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Thank you for reaching out!
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              We've received your message and will get back to you within 24 hours. 
              If you requested a demo, our team will contact you to schedule a personalized session.
            </p>
            <div className="mt-10">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    company: '',
                    jobTitle: '',
                    phone: '',
                    websiteUrl: '',
                    employees: '',
                    inquiryType: 'demo',
                    message: '',
                  });
                }}
                className="rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                Send Another Message
              </button>
            </div>
          </div>
        </div>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <div className="bg-white px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Contact Us</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Let's talk about your website optimization goals
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Ready to transform your website performance? Get in touch with our team for a personalized demo 
            or to discuss your specific needs.
          </p>
        </div>
      </div>

      {/* Contact Form and Info */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">Get in touch</h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>
              
              <form onSubmit={handleSubmit} className="mt-16 space-y-8">
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-semibold leading-6 text-gray-900">
                      First name *
                    </label>
                    <div className="mt-2.5">
                      <input
                        type="text"
                        name="firstName"
                        id="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-2 px-3.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-semibold leading-6 text-gray-900">
                      Last name *
                    </label>
                    <div className="mt-2.5">
                      <input
                        type="text"
                        name="lastName"
                        id="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-2 px-3.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="email" className="block text-sm font-semibold leading-6 text-gray-900">
                      Email *
                    </label>
                    <div className="mt-2.5">
                      <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-2 px-3.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-sm font-semibold leading-6 text-gray-900">
                      Company *
                    </label>
                    <div className="mt-2.5">
                      <input
                        type="text"
                        name="company"
                        id="company"
                        required
                        value={formData.company}
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-2 px-3.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="jobTitle" className="block text-sm font-semibold leading-6 text-gray-900">
                      Job Title
                    </label>
                    <div className="mt-2.5">
                      <input
                        type="text"
                        name="jobTitle"
                        id="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-2 px-3.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold leading-6 text-gray-900">
                      Phone
                    </label>
                    <div className="mt-2.5">
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-2 px-3.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="websiteUrl" className="block text-sm font-semibold leading-6 text-gray-900">
                      Website URL
                    </label>
                    <div className="mt-2.5">
                      <input
                        type="url"
                        name="websiteUrl"
                        id="websiteUrl"
                        placeholder="https://example.com"
                        value={formData.websiteUrl}
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-2 px-3.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="employees" className="block text-sm font-semibold leading-6 text-gray-900">
                      Company Size
                    </label>
                    <div className="mt-2.5">
                      <select
                        name="employees"
                        id="employees"
                        value={formData.employees}
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-2 px-3.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      >
                        <option value="">Select company size</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-1000">201-1,000 employees</option>
                        <option value="1000+">1,000+ employees</option>
                      </select>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="inquiryType" className="block text-sm font-semibold leading-6 text-gray-900">
                      Inquiry Type *
                    </label>
                    <div className="mt-2.5">
                      <select
                        name="inquiryType"
                        id="inquiryType"
                        required
                        value={formData.inquiryType}
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-2 px-3.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      >
                        <option value="demo">Request a Demo</option>
                        <option value="sales">Sales Inquiry</option>
                        <option value="support">Technical Support</option>
                        <option value="partnership">Partnership</option>
                        <option value="general">General Question</option>
                      </select>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="message" className="block text-sm font-semibold leading-6 text-gray-900">
                      Message
                    </label>
                    <div className="mt-2.5">
                      <textarea
                        name="message"
                        id="message"
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us about your goals and how we can help..."
                        className="block w-full rounded-md border-0 py-2 px-3.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-10">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="block w-full rounded-md bg-blue-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>

            {/* Contact Information */}
            <div className="lg:mt-6 xl:mt-0">
              <div className="mx-auto max-w-xl lg:mx-0">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">Contact Information</h2>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  Reach out to us through any of these channels. We're here to help you succeed.
                </p>
                <dl className="mt-10 space-y-4 text-base leading-7 text-gray-600">
                  {contactInfo.map((item) => (
                    <div key={item.name} className="flex gap-x-4">
                      <dt className="flex-none">
                        <span className="sr-only">{item.name}</span>
                        <item.icon className="h-7 w-6 text-gray-400" aria-hidden="true" />
                      </dt>
                      <dd>
                        <a href={item.href} className="hover:text-gray-900">
                          {item.value}
                        </a>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Office Locations */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Our offices
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Visit us at any of our global locations or connect with us remotely.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {offices.map((office) => (
              <div key={office.city} className="bg-white rounded-2xl p-8 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">{office.city}</h3>
                <address className="mt-4 not-italic text-gray-600">
                  <div>{office.address}</div>
                  <div className="mt-2">
                    <a href={`tel:${office.phone}`} className="hover:text-gray-900">
                      {office.phone}
                    </a>
                  </div>
                  <div>
                    <a href={`mailto:${office.email}`} className="hover:text-gray-900">
                      {office.email}
                    </a>
                  </div>
                </address>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}