'use client';

import { useState, useEffect } from 'react';
import { X, Cookie, Settings, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always required
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    } else {
      // Load existing preferences
      try {
        const savedPreferences = JSON.parse(consent);
        setPreferences(savedPreferences);
        applyCookieSettings(savedPreferences);
      } catch (error) {
        console.error('Error parsing cookie preferences:', error);
        setIsVisible(true);
      }
    }
  }, []);

  const applyCookieSettings = (prefs: CookiePreferences) => {
    // Apply Google Analytics based on analytics preference
    if (prefs.analytics && typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
      });
    } else if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
      });
    }

    // Apply marketing cookies
    if (prefs.marketing && typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      });
    } else if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
    }

    // Store preferences with timestamp
    const consentData = {
      ...prefs,
      timestamp: new Date().toISOString(),
      version: '2.0',
    };
    
    localStorage.setItem('cookie-consent', JSON.stringify(consentData));
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    setPreferences(allAccepted);
    applyCookieSettings(allAccepted);
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    setPreferences(essentialOnly);
    applyCookieSettings(essentialOnly);
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    applyCookieSettings(preferences);
    setIsVisible(false);
    setShowSettings(false);
  };

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white shadow-2xl rounded-xl overflow-hidden">
        {!showSettings ? (
          <div className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Cookie className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  We value your privacy
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  We use cookies and similar technologies to enhance your browsing experience, 
                  analyze website performance, and provide personalized content. You can customize 
                  your cookie preferences or accept all cookies.
                </p>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-medium text-gray-900 text-sm mb-1">Essential Cookies</h3>
                <p className="text-xs text-gray-600">Required for basic site functionality</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-medium text-gray-900 text-sm mb-1">Analytics Cookies</h3>
                <p className="text-xs text-gray-600">Help us improve our website</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleAcceptAll}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Accept All Cookies
              </Button>
              <Button
                onClick={handleRejectAll}
                variant="outline"
                className="flex-1"
              >
                Reject All
              </Button>
              <Button
                onClick={() => setShowSettings(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Customize
              </Button>
            </div>

            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
              <a 
                href="/privacy" 
                className="hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                Privacy Policy <ExternalLink className="w-3 h-3" />
              </a>
              <span>•</span>
              <a 
                href="/terms" 
                className="hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                Terms of Service <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ←
              </button>
              <h2 className="text-xl font-bold text-gray-900">Cookie Preferences</h2>
            </div>

            <div className="space-y-6">
              {/* Essential Cookies */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">Essential Cookies</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    These cookies are necessary for the website to function and cannot be switched off. 
                    They are usually only set in response to actions made by you which amount to a request 
                    for services, such as setting your privacy preferences, logging in, or filling in forms.
                  </p>
                  <div className="text-xs text-gray-500">
                    Examples: Authentication, security, preferences
                  </div>
                </div>
                <Switch
                  checked={preferences.essential}
                  disabled={true}
                  className="mt-1"
                />
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">Analytics Cookies</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    These cookies allow us to count visits and traffic sources so we can measure and 
                    improve the performance of our site. They help us know which pages are the most 
                    and least popular and see how visitors move around the site.
                  </p>
                  <div className="text-xs text-gray-500">
                    Examples: Google Analytics, page views, session duration
                  </div>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => handlePreferenceChange('analytics', checked)}
                  className="mt-1"
                />
              </div>

              {/* Functional Cookies */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">Functional Cookies</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    These cookies enable the website to provide enhanced functionality and personalisation. 
                    They may be set by us or by third party providers whose services we have added to our pages.
                  </p>
                  <div className="text-xs text-gray-500">
                    Examples: Chat widgets, video players, social media integrations
                  </div>
                </div>
                <Switch
                  checked={preferences.functional}
                  onCheckedChange={(checked) => handlePreferenceChange('functional', checked)}
                  className="mt-1"
                />
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">Marketing Cookies</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    These cookies may be set through our site by our advertising partners. They may be 
                    used by those companies to build a profile of your interests and show you relevant 
                    adverts on other sites.
                  </p>
                  <div className="text-xs text-gray-500">
                    Examples: Targeted advertising, conversion tracking, remarketing
                  </div>
                </div>
                <Switch
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => handlePreferenceChange('marketing', checked)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Button
                onClick={handleSavePreferences}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Preferences
              </Button>
              <Button
                onClick={handleAcceptAll}
                variant="outline"
                className="flex-1"
              >
                Accept All
              </Button>
            </div>

            <div className="text-center mt-4">
              <p className="text-xs text-gray-500">
                You can change these settings at any time in your account preferences.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CookieConsent;