'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Loader2, Building2, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

interface GmbAccount {
  name: string;
  accountName: string;
  locations: GmbLocation[];
}

interface GmbLocation {
  name: string;
  locationName: string;
  address?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
  };
}

export default function GmbAccountSelector() {
  const [accounts, setAccounts] = useState<GmbAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/gmb/accounts');
      if (!response.ok) throw new Error('Failed to fetch GMB accounts');
      
      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (err) {
      setError('Unable to load Google My Business accounts. Please ensure you have connected your Google account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedAccount || !selectedLocation) {
      setError('Please select both an account and a location');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      const account = accounts.find(a => a.name === selectedAccount);
      const location = account?.locations.find(l => l.name === selectedLocation);
      
      const response = await fetch('/api/gmb/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gmbAccountId: selectedAccount.split('/').pop(),
          gmbLocationId: selectedLocation.split('/').pop(),
          gmbAccountName: account?.accountName || '',
          gmbLocationName: location?.locationName || ''
        })
      });

      if (!response.ok) throw new Error('Failed to save GMB configuration');
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save GMB configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
          <span className="text-gray-500">Loading GMB accounts...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Google My Business Setup
          </h3>
          <p className="text-sm text-gray-600">
            Select your Google My Business account and location to enable live data features.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">GMB configuration saved successfully!</p>
          </div>
        )}

        {accounts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No Google My Business accounts found.</p>
            <p className="text-sm mt-1">Please ensure you have access to at least one GMB account.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Account
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => {
                  setSelectedAccount(e.target.value);
                  setSelectedLocation(''); // Reset location when account changes
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose an account...</option>
                {accounts.map((account) => (
                  <option key={account.name} value={account.name}>
                    {account.accountName}
                  </option>
                ))}
              </select>
            </div>

            {selectedAccount && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Select Location
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a location...</option>
                  {accounts
                    .find(a => a.name === selectedAccount)
                    ?.locations.map((location) => (
                      <option key={location.name} value={location.name}>
                        {location.locationName}
                        {location.address && (
                          <span className="text-gray-500 ml-2">
                            - {location.address.locality}, {location.address.administrativeArea}
                          </span>
                        )}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={fetchAccounts}
                disabled={isLoading}
              >
                Refresh
              </Button>
              <Button
                onClick={handleSave}
                disabled={!selectedAccount || !selectedLocation || isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
