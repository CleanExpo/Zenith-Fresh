'use client';

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Contact Us</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600 mb-4">
            Get in touch with our team for support, questions, or feedback.
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">Email</h3>
              <p className="text-gray-600">support@zenithfresh.com</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Business Hours</h3>
              <p className="text-gray-600">Monday - Friday, 9AM - 5PM EST</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}