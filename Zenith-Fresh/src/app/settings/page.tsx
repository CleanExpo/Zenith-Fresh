'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-64">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full text-left px-4 py-2 rounded-lg ${
                activeTab === 'general' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-2 rounded-lg ${
                activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full text-left px-4 py-2 rounded-lg ${
                activeTab === 'security' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full text-left px-4 py-2 rounded-lg ${
                activeTab === 'notifications' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full text-left px-4 py-2 rounded-lg ${
                activeTab === 'billing' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Billing
            </button>
          </nav>
        </div>
        
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            {activeTab === 'general' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">General Settings</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Application Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue="Zenith Fresh"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Language
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Zone
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>UTC</option>
                      <option>Eastern Time</option>
                      <option>Pacific Time</option>
                      <option>Central Time</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="john@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'security' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">Change Password</h3>
                    <div className="space-y-4">
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Current Password"
                      />
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="New Password"
                      />
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Confirm New Password"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Enable 2FA</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                    <span className="text-gray-700">Email Notifications</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                  </label>
                  
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                    <span className="text-gray-700">Push Notifications</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                  </label>
                  
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                    <span className="text-gray-700">Weekly Reports</span>
                    <input type="checkbox" className="w-4 h-4 text-blue-600" />
                  </label>
                  
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                    <span className="text-gray-700">Product Updates</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                  </label>
                </div>
              </div>
            )}
            
            {activeTab === 'billing' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Billing & Subscription</h2>
                <div className="bg-blue-50 p-6 rounded-lg mb-6">
                  <h3 className="font-semibold text-lg mb-2">Current Plan: Pro</h3>
                  <p className="text-gray-700 mb-4">$49/month • Renews on Feb 1, 2024</p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Upgrade Plan
                  </button>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Payment Method</h3>
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center text-xs">
                          VISA
                        </div>
                        <span>•••• •••• •••• 4242</span>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800">Update</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-8 flex justify-end">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}