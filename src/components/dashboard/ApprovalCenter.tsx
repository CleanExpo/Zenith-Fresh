// src/components/dashboard/ApprovalCenter.tsx
'use client';

import React, { useState, useEffect } from 'react';

// Simplified type for demonstration. In a real app, this would be imported from your Prisma client types.
type ApprovalItem = {
  id: string;
  type: string;
  content: {
    text: string;
  };
};

export default function ApprovalCenter() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchItems() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/approvals');
        if (!response.ok) {
          throw new Error('Failed to fetch approval items.');
        }
        const data = await response.json();
        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchItems();
  }, []);

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    // Optimistically remove the item from the UI
    setItems(currentItems => currentItems.filter(item => item.id !== id));
    
    try {
      await fetch(`/api/approvals/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
    } catch (err) {
      // If the API call fails, we would ideally add the item back and show an error toast.
      console.error(`Failed to ${action.toLowerCase()} item:`, err);
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading pending approvals...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }
  
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Approval Center</h1>
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-500">No items currently pending your approval.</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-lg shadow-md border">
              <p className="text-sm font-bold text-gray-500 uppercase">{item.type.replace('_', ' ')}</p>
              <div className="my-4 p-4 bg-gray-50 rounded-md border">
                <p className="text-gray-800 whitespace-pre-wrap">{item.content.text}</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => handleAction(item.id, 'APPROVE')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">Approve</button>
                <button onClick={() => handleAction(item.id, 'REJECT')} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">Reject</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
