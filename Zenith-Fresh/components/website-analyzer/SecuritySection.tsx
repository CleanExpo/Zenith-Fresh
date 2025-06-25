'use client';

import { SecurityFindings } from '@/types/analyzer';
import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface SecuritySectionProps {
  findings: SecurityFindings;
}

export function SecuritySection({ findings }: SecuritySectionProps) {
  const StatusIcon = ({ status }: { status: boolean }) => (
    status ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    )
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center mb-6">
        <Shield className="w-6 h-6 text-red-600 mr-3" />
        <h3 className="text-xl font-semibold">Security Analysis</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Headers */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Security Headers</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <StatusIcon status={findings.https} />
                <span className="ml-2 text-sm font-medium">HTTPS</span>
              </div>
              <span className="text-xs text-gray-500">SSL/TLS Encryption</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <StatusIcon status={findings.hsts} />
                <span className="ml-2 text-sm font-medium">HSTS</span>
              </div>
              <span className="text-xs text-gray-500">Strict Transport Security</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <StatusIcon status={findings.contentSecurityPolicy} />
                <span className="ml-2 text-sm font-medium">CSP</span>
              </div>
              <span className="text-xs text-gray-500">Content Security Policy</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <StatusIcon status={findings.xFrameOptions} />
                <span className="ml-2 text-sm font-medium">X-Frame-Options</span>
              </div>
              <span className="text-xs text-gray-500">Clickjacking Protection</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <StatusIcon status={findings.xContentTypeOptions} />
                <span className="ml-2 text-sm font-medium">X-Content-Type-Options</span>
              </div>
              <span className="text-xs text-gray-500">MIME Type Sniffing</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <StatusIcon status={findings.referrerPolicy} />
                <span className="ml-2 text-sm font-medium">Referrer Policy</span>
              </div>
              <span className="text-xs text-gray-500">Referrer Information Control</span>
            </div>
          </div>
        </div>

        {/* Vulnerabilities */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">
            Security Issues 
            {findings.vulnerabilities.length > 0 && (
              <span className="ml-2 text-sm font-normal text-red-600">
                ({findings.vulnerabilities.length} found)
              </span>
            )}
          </h4>
          
          {findings.vulnerabilities.length === 0 ? (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm text-green-800 font-medium">
                  No major security vulnerabilities detected
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {findings.vulnerabilities.map((vuln, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${getSeverityColor(vuln.severity)}`}
                >
                  <div className="flex items-start">
                    <div className="mr-2 mt-0.5">
                      {getSeverityIcon(vuln.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-sm font-medium">{vuln.type}</h5>
                        <span className="text-xs font-semibold uppercase px-2 py-1 rounded">
                          {vuln.severity}
                        </span>
                      </div>
                      <p className="text-xs mb-2">{vuln.description}</p>
                      <p className="text-xs font-medium">
                        Recommendation: {vuln.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-red-50 rounded-lg">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-900 mb-1">Security Best Practices</h4>
            <ul className="text-sm text-red-800 space-y-1">
              <li>• Implement all security headers to protect against common attacks</li>
              <li>• Regularly update software and dependencies</li>
              <li>• Use strong SSL/TLS configuration</li>
              <li>• Monitor for new vulnerabilities and apply patches promptly</li>
              <li>• Consider implementing a Web Application Firewall (WAF)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}