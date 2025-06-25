'use client';

import { useState } from 'react';
import { ReportConfig } from '@/types/analyzer';
import { Palette, Settings, Mail } from 'lucide-react';

interface ReportCustomizationProps {
  config: ReportConfig;
  onChange: (config: ReportConfig) => void;
}

export function ReportCustomization({ config, onChange }: ReportCustomizationProps) {
  const [showEmailConfig, setShowEmailConfig] = useState(false);

  const updateConfig = (updates: Partial<ReportConfig>) => {
    onChange({ ...config, ...updates });
  };

  const updateEmailConfig = (emailUpdates: Partial<NonNullable<ReportConfig['emailDelivery']>>) => {
    updateConfig({
      emailDelivery: {
        ...config.emailDelivery,
        ...emailUpdates,
      } as NonNullable<ReportConfig['emailDelivery']>,
    });
  };

  const addEmailRecipient = () => {
    const email = prompt('Enter email address:');
    if (email && email.includes('@')) {
      const recipients = config.emailDelivery?.recipients || [];
      updateEmailConfig({
        recipients: [...recipients, email],
      });
    }
  };

  const removeEmailRecipient = (index: number) => {
    const recipients = config.emailDelivery?.recipients || [];
    updateEmailConfig({
      recipients: recipients.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Settings className="w-5 h-5 mr-2" />
        Report Customization
      </h3>

      <div className="space-y-6">
        {/* Branding */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Palette className="w-4 h-4 mr-2" />
            Branding
          </h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.includeLogo}
                onChange={(e) => updateConfig({ includeLogo: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Include Zenith Platform logo</span>
            </label>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Brand Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={config.brandColor}
                  onChange={(e) => updateConfig({ brandColor: e.target.value })}
                  className="w-8 h-8 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={config.brandColor}
                  onChange={(e) => updateConfig({ brandColor: e.target.value })}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Company Name (optional)</label>
              <input
                type="text"
                value={config.companyName || ''}
                onChange={(e) => updateConfig({ companyName: e.target.value })}
                placeholder="Your Company"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Report Title (optional)</label>
              <input
                type="text"
                value={config.reportTitle || ''}
                onChange={(e) => updateConfig({ reportTitle: e.target.value })}
                placeholder="Website Health Analysis Report"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Report Sections */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Report Sections</h4>
          <div className="space-y-2">
            {[
              { key: 'includePerformance', label: 'Performance Analysis' },
              { key: 'includeSEO', label: 'SEO Analysis' },
              { key: 'includeSecurity', label: 'Security Findings' },
              { key: 'includeAccessibility', label: 'Accessibility Audit' },
              { key: 'includeRecommendations', label: 'Recommendations' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={config[key as keyof ReportConfig] as boolean}
                  onChange={(e) => updateConfig({ [key]: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Email Delivery */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Mail className="w-4 h-4 mr-2" />
            Email Delivery
          </h4>
          
          <label className="flex items-center mb-3">
            <input
              type="checkbox"
              checked={config.emailDelivery?.enabled || false}
              onChange={(e) => {
                updateEmailConfig({ enabled: e.target.checked });
                setShowEmailConfig(e.target.checked);
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Enable email delivery</span>
          </label>

          {config.emailDelivery?.enabled && (
            <div className="space-y-3 pl-6 border-l-2 border-gray-200">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Email Recipients</label>
                <div className="space-y-2">
                  {config.emailDelivery?.recipients?.map((email, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 flex-1">{email}</span>
                      <button
                        onClick={() => removeEmailRecipient(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addEmailRecipient}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add recipient
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Email Subject</label>
                <input
                  type="text"
                  value={config.emailDelivery?.subject || ''}
                  onChange={(e) => updateEmailConfig({ subject: e.target.value })}
                  placeholder="Website Analysis Report"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Email Message</label>
                <textarea
                  value={config.emailDelivery?.message || ''}
                  onChange={(e) => updateEmailConfig({ message: e.target.value })}
                  placeholder="Please find the website analysis report attached."
                  rows={3}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}