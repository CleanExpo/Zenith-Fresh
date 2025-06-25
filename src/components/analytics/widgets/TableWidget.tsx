'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ChevronUp, 
  ChevronDown,
  Search,
  Download,
  Filter,
  ArrowUpDown
} from 'lucide-react';

interface TableWidgetProps {
  config: TableConfig;
  data?: any;
  timeRange: string;
  teamId: string;
  widgetId: string;
}

interface TableConfig {
  columns: string[] | TableColumn[];
  dataSource?: string;
  limit?: number;
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  pagination?: boolean;
  showRowNumbers?: boolean;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  groupBy?: string;
}

interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'currency' | 'percentage' | 'date';
  sortable?: boolean;
  width?: string;
  format?: (value: any) => string;
}

interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

const formatCellValue = (value: any, type?: string): string => {
  if (value === null || value === undefined) return '-';
  
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Number(value));
    
    case 'percentage':
      return `${Number(value).toFixed(1)}%`;
    
    case 'number':
      if (typeof value === 'number') {
        if (value >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}K`;
        }
        return value.toLocaleString();
      }
      return value.toString();
    
    case 'date':
      return new Date(value).toLocaleDateString();
    
    default:
      return value.toString();
  }
};

export default function TableWidget({ config, data, timeRange, teamId, widgetId }: TableWidgetProps) {
  const [tableData, setTableData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortState, setSortState] = useState<SortState | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const limit = config.limit || 20;
  const itemsPerPage = config.pagination ? 10 : limit;

  useEffect(() => {
    fetchTableData();
  }, [config, timeRange, teamId]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [tableData, searchQuery, sortState]);

  const fetchTableData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        teamId,
        timeRange,
        limit: limit.toString(),
        ...(config.dataSource && { dataSource: config.dataSource }),
        ...(config.aggregation && { aggregation: config.aggregation }),
        ...(config.groupBy && { groupBy: config.groupBy })
      });

      const response = await fetch(`/api/analytics/tables/data?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch table data');
      }
      
      const result = await response.json();
      setTableData(result.data || []);
    } catch (error) {
      console.error('Error fetching table data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      
      // Fallback to sample data for development
      generateSampleData();
    } finally {
      setLoading(false);
    }
  };

  const generateSampleData = () => {
    const sampleData = [];
    const pages = ['Home', 'About', 'Products', 'Contact', 'Blog', 'Pricing', 'Features', 'Support'];
    
    for (let i = 0; i < limit; i++) {
      sampleData.push({
        page: pages[i % pages.length],
        views: Math.floor(Math.random() * 10000) + 100,
        timeOnPage: `${Math.floor(Math.random() * 300) + 30}s`,
        bounceRate: `${(Math.random() * 60 + 20).toFixed(1)}%`,
        conversions: Math.floor(Math.random() * 50),
        revenue: Math.floor(Math.random() * 5000) + 100
      });
    }
    
    setTableData(sampleData);
  };

  const applyFiltersAndSort = () => {
    let filtered = [...tableData];
    
    // Apply search filter
    if (searchQuery && config.searchable !== false) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    
    // Apply sorting
    if (sortState) {
      filtered.sort((a, b) => {
        const aValue = a[sortState.column];
        const bValue = b[sortState.column];
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
        
        return sortState.direction === 'desc' ? -comparison : comparison;
      });
    }
    
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSort = (column: string) => {
    if (config.sortable === false) return;
    
    setSortState(prevState => {
      if (prevState?.column === column) {
        // Toggle direction or clear sort
        if (prevState.direction === 'asc') {
          return { column, direction: 'desc' };
        } else {
          return null; // Clear sort
        }
      } else {
        return { column, direction: 'asc' };
      }
    });
  };

  const handleExport = () => {
    const columns = getColumns();
    const csvContent = [
      columns.map(col => typeof col === 'string' ? col : col.label).join(','),
      ...filteredData.map(row => 
        columns.map(col => {
          const key = typeof col === 'string' ? col : col.key;
          return `"${row[key] || ''}"`;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getColumns = (): (string | TableColumn)[] => {
    if (config.columns.length > 0) {
      return config.columns;
    }
    
    // Auto-generate columns from data
    if (tableData.length > 0) {
      return Object.keys(tableData[0]).map(key => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
      }));
    }
    
    return [];
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || tableData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 text-gray-400">📊</div>
          <p className="text-sm">{error || 'No table data available'}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchTableData}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const columns = getColumns();
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = config.pagination ? filteredData.slice(startIndex, endIndex) : filteredData;
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div className="h-full flex flex-col">
      {/* Table Controls */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          {config.searchable !== false && (
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-48 h-8 text-sm"
              />
            </div>
          )}
          
          <Badge variant="outline" className="text-xs">
            {filteredData.length} rows
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            className="h-6 w-6 p-0"
            title="Export data"
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b sticky top-0">
            <tr>
              {config.showRowNumbers && (
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  #
                </th>
              )}
              {columns.map((column, index) => {
                const col = typeof column === 'string' ? { key: column, label: column } : column;
                const isSorted = sortState?.column === col.key;
                const canSort = config.sortable !== false && (col.sortable !== false);
                
                return (
                  <th
                    key={col.key}
                    className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      canSort ? 'cursor-pointer hover:bg-gray-100' : ''
                    } ${col.width || ''}`}
                    onClick={() => canSort && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {canSort && (
                        <div className="flex flex-col">
                          {isSorted ? (
                            sortState?.direction === 'asc' ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {config.showRowNumbers && (
                  <td className="px-3 py-2 text-gray-500">
                    {startIndex + rowIndex + 1}
                  </td>
                )}
                {columns.map((column) => {
                  const col = typeof column === 'string' ? { key: column, label: column } : column;
                  const value = row[col.key];
                  
                  return (
                    <td key={col.key} className="px-3 py-2 text-gray-900">
                      {col.format ? col.format(value) : formatCellValue(value, col.type)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {config.pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} results
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}