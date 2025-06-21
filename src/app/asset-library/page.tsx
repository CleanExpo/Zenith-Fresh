'use client';

import { useState } from 'react';
import { Upload, Folder, File, Lock, Plus, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AssetLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Asset Library</h1>
        <p className="text-gray-600">Your central repository for all digital assets and credentials</p>
      </div>

      {/* Search and Upload Bar */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Files
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Folder
        </Button>
      </div>

      {/* Tabs for different asset types */}
      <Tabs defaultValue="media" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="media">Media Storage</TabsTrigger>
          <TabsTrigger value="brand">Brand Kit</TabsTrigger>
          <TabsTrigger value="credentials">Credential Manager</TabsTrigger>
        </TabsList>

        {/* Media Storage Tab */}
        <TabsContent value="media" className="mt-6">
          <Card className="p-6">
            <div className="grid grid-cols-4 gap-4">
              {/* Sample folders and files */}
              <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <Folder className="w-12 h-12 text-blue-500 mb-2" />
                <span className="text-sm font-medium">Images</span>
                <span className="text-xs text-gray-500">24 items</span>
              </div>
              <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <Folder className="w-12 h-12 text-blue-500 mb-2" />
                <span className="text-sm font-medium">Videos</span>
                <span className="text-xs text-gray-500">12 items</span>
              </div>
              <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <Folder className="w-12 h-12 text-blue-500 mb-2" />
                <span className="text-sm font-medium">Documents</span>
                <span className="text-xs text-gray-500">48 items</span>
              </div>
              <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <File className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-sm font-medium">logo.png</span>
                <span className="text-xs text-gray-500">2.4 MB</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Brand Kit Tab */}
        <TabsContent value="brand" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Brand Assets</h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Primary Logo</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Upload logo</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Brand Colors</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded"></div>
                    <span className="text-sm">#2563EB</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Add Color
                  </Button>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Typography</h4>
                <div className="space-y-2">
                  <p className="text-sm">Primary: Inter</p>
                  <p className="text-sm">Secondary: Arial</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Add Font
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Credential Manager Tab */}
        <TabsContent value="credentials" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Secure Credentials</h3>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Lock className="w-4 h-4" />
                End-to-end encrypted
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Google Analytics</p>
                  <p className="text-sm text-gray-500">Measurement ID: G-XXXXXXX</p>
                </div>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Facebook Pixel</p>
                  <p className="text-sm text-gray-500">Pixel ID: •••••••••</p>
                </div>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Credential
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
