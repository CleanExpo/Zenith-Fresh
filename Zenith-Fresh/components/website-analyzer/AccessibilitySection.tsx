'use client';

import { AccessibilityAudit } from '@/types/analyzer';
import { Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface AccessibilitySectionProps {
  audit: AccessibilityAudit;
}

export function AccessibilitySection({ audit }: AccessibilitySectionProps) {
  const StatusIcon = ({ status }: { status: boolean }) => (
    status ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    )
  );

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-200';
      case 'serious': return 'text-red-600 bg-red-50 border-red-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'minor': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'critical':
      case 'serious':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center mb-6">
        <Eye className="w-6 h-6 text-purple-600 mr-3" />
        <h3 className="text-xl font-semibold">Accessibility Analysis</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accessibility Features */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Accessibility Features</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <StatusIcon status={audit.keyboardNavigation} />
                <span className="ml-2 text-sm font-medium">Keyboard Navigation</span>
              </div>
              <span className="text-xs text-gray-500">Focus Management</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <StatusIcon status={audit.screenReaderCompatibility} />
                <span className="ml-2 text-sm font-medium">Screen Reader Support</span>
              </div>
              <span className="text-xs text-gray-500">Assistive Technology</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <StatusIcon status={audit.semanticStructure} />
                <span className="ml-2 text-sm font-medium">Semantic Structure</span>
              </div>
              <span className="text-xs text-gray-500">HTML Semantics</span>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Color Contrast</span>
                <span className="text-sm text-gray-600">
                  {audit.colorContrast.passed + audit.colorContrast.failed} checks
                </span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span className="flex items-center">
                    <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                    Passed:
                  </span>
                  <span className="text-green-600">{audit.colorContrast.passed}</span>
                </div>
                {audit.colorContrast.failed > 0 && (
                  <div className="flex justify-between">
                    <span className="flex items-center">
                      <XCircle className="w-3 h-3 text-red-600 mr-1" />
                      Failed:
                    </span>
                    <span className="text-red-600">{audit.colorContrast.failed}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Passed Checks */}
          {audit.passes.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3">
                Passed Checks ({audit.passes.length})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {audit.passes.slice(0, 5).map((pass, index) => (
                  <div key={index} className="flex items-center p-2 bg-green-50 rounded text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-green-800">{pass.description}</span>
                  </div>
                ))}
                {audit.passes.length > 5 && (
                  <div className="text-xs text-gray-500 text-center py-1">
                    +{audit.passes.length - 5} more passed checks
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Accessibility Issues */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">
            Accessibility Issues
            {audit.violations.length > 0 && (
              <span className="ml-2 text-sm font-normal text-red-600">
                ({audit.violations.length} found)
              </span>
            )}
          </h4>
          
          {audit.violations.length === 0 ? (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm text-green-800 font-medium">
                  No accessibility violations detected
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {audit.violations.map((violation, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${getImpactColor(violation.impact)}`}
                >
                  <div className="flex items-start">
                    <div className="mr-2 mt-0.5">
                      {getImpactIcon(violation.impact)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-sm font-medium">{violation.description}</h5>
                        <span className="text-xs font-semibold uppercase px-2 py-1 rounded">
                          {violation.impact}
                        </span>
                      </div>
                      <p className="text-xs mb-2">{violation.help}</p>
                      <div className="text-xs">
                        <span className="font-medium">Element:</span> 
                        <code className="ml-1 px-1 bg-black bg-opacity-10 rounded">
                          {violation.element}
                        </code>
                      </div>
                      {violation.helpUrl && (
                        <a 
                          href={violation.helpUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs underline mt-1 inline-block hover:no-underline"
                        >
                          Learn more →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-purple-50 rounded-lg">
        <div className="flex items-start">
          <Eye className="w-5 h-5 text-purple-600 mr-2 mt-0.5" />
          <div>
            <h4 className="font-medium text-purple-900 mb-1">Accessibility Guidelines</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Follow WCAG 2.1 AA standards for accessibility compliance</li>
              <li>• Ensure sufficient color contrast (4.5:1 for normal text)</li>
              <li>• Provide alt text for all meaningful images</li>
              <li>• Make all functionality available via keyboard</li>
              <li>• Use semantic HTML elements and proper heading structure</li>
              <li>• Test with screen readers and other assistive technologies</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}