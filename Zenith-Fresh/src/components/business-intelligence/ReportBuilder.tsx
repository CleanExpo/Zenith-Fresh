'use client';

import React, { useState, useRef, useCallback } from 'react';
import { DndProvider, useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AdvancedChart } from './charts/AdvancedChart';
import { Report, ReportSection, TimeSeries, MetricDefinition } from '@/types/business-intelligence/analytics';

interface ReportBuilderProps {
  onSave?: (report: Report) => void;
  initialReport?: Report;
  theme?: 'light' | 'dark';
}

interface ComponentItem {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'text' | 'image';
  name: string;
  icon: string;
  description: string;
}

interface DroppedComponent extends ComponentItem {
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: any;
}

const componentLibrary: ComponentItem[] = [
  {
    id: 'line-chart',
    type: 'chart',
    name: 'Line Chart',
    icon: '📈',
    description: 'Show trends over time'
  },
  {
    id: 'bar-chart',
    type: 'chart',
    name: 'Bar Chart',
    icon: '📊',
    description: 'Compare values across categories'
  },
  {
    id: 'pie-chart',
    type: 'chart',
    name: 'Pie Chart',
    icon: '🥧',
    description: 'Show proportions and percentages'
  },
  {
    id: 'data-table',
    type: 'table',
    name: 'Data Table',
    icon: '📋',
    description: 'Display tabular data'
  },
  {
    id: 'kpi-metric',
    type: 'metric',
    name: 'KPI Metric',
    icon: '🎯',
    description: 'Single metric display'
  },
  {
    id: 'text-block',
    type: 'text',
    name: 'Text Block',
    icon: '📝',
    description: 'Add formatted text content'
  },
  {
    id: 'image-block',
    type: 'image',
    name: 'Image',
    icon: '🖼️',
    description: 'Insert images and logos'
  }
];

function DraggableComponent({ item }: { item: ComponentItem }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'component',
    item: item,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`p-4 border border-gray-300 rounded-lg cursor-move hover:bg-gray-50 transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{item.icon}</span>
        <div>
          <h4 className="font-medium">{item.name}</h4>
          <p className="text-sm text-gray-600">{item.description}</p>
        </div>
      </div>
    </div>
  );
}

function DroppableCanvas({ 
  components, 
  onDrop, 
  onSelectComponent, 
  selectedComponent,
  theme 
}: {
  components: DroppedComponent[];
  onDrop: (item: ComponentItem, offset: { x: number; y: number }) => void;
  onSelectComponent: (component: DroppedComponent | null) => void;
  selectedComponent: DroppedComponent | null;
  theme: 'light' | 'dark';
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'component',
    drop: (item: ComponentItem, monitor: DropTargetMonitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (offset && canvasRect) {
        onDrop(item, {
          x: offset.x - canvasRect.left,
          y: offset.y - canvasRect.top
        });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const canvasRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={(node) => {
        drop(node);
        canvasRef.current = node;
      }}
      className={`relative min-h-[600px] border-2 border-dashed rounded-lg ${
        isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
      } ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
      onClick={() => onSelectComponent(null)}
    >
      {components.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <span className="text-4xl mb-2 block">📋</span>
            <p>Drag components here to build your report</p>
          </div>
        </div>
      )}
      
      {components.map((component) => (
        <ReportComponent
          key={component.id}
          component={component}
          isSelected={selectedComponent?.id === component.id}
          onSelect={() => onSelectComponent(component)}
          theme={theme}
        />
      ))}
    </div>
  );
}

function ReportComponent({ 
  component, 
  isSelected, 
  onSelect,
  theme 
}: {
  component: DroppedComponent;
  isSelected: boolean;
  onSelect: () => void;
  theme: 'light' | 'dark';
}) {
  const renderComponentContent = () => {
    switch (component.type) {
      case 'chart':
        return (
          <div className="h-full w-full">
            <AdvancedChart
              type={component.config?.chartType || 'line'}
              data={component.config?.data || []}
              title={component.config?.title || component.name}
              height={component.size.height - 20}
              theme={theme}
              showLegend={component.config?.showLegend !== false}
              showGrid={component.config?.showGrid !== false}
            />
          </div>
        );
        
      case 'table':
        return (
          <div className="h-full w-full overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}>
                  {(component.config?.columns || ['Column 1', 'Column 2', 'Column 3']).map((col: string, i: number) => (
                    <th key={i} className="px-3 py-2 text-left font-medium">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(component.config?.data || [
                  ['Sample Data 1', '100', '15.2%'],
                  ['Sample Data 2', '250', '22.8%'],
                  ['Sample Data 3', '175', '18.5%']
                ]).map((row: string[], i: number) => (
                  <tr key={i} className={`border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        
      case 'metric':
        return (
          <div className="h-full w-full flex flex-col justify-center items-center text-center">
            <div className="text-3xl font-bold text-blue-600">
              {component.config?.value || '1,234'}
            </div>
            <div className="text-lg font-medium mt-2">
              {component.config?.title || 'Sample Metric'}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {component.config?.subtitle || 'Description'}
            </div>
          </div>
        );
        
      case 'text':
        return (
          <div className="h-full w-full p-4">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{
                __html: component.config?.content || '<h3>Sample Heading</h3><p>This is sample text content. You can edit this in the properties panel.</p>'
              }}
            />
          </div>
        );
        
      case 'image':
        return (
          <div className="h-full w-full flex items-center justify-center">
            {component.config?.src ? (
              <img
                src={component.config.src}
                alt={component.config.alt || 'Report image'}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-center text-gray-500">
                <span className="text-4xl block mb-2">🖼️</span>
                <p>No image selected</p>
              </div>
            )}
          </div>
        );
        
      default:
        return (
          <div className="h-full w-full flex items-center justify-center text-gray-500">
            <span className="text-2xl">{component.icon}</span>
          </div>
        );
    }
  };

  return (
    <div
      className={`absolute border-2 cursor-pointer ${
        isSelected ? 'border-blue-500' : 'border-transparent'
      } ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-sm hover:shadow-md transition-shadow`}
      style={{
        left: component.position.x,
        top: component.position.y,
        width: component.size.width,
        height: component.size.height
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {isSelected && (
        <div className="absolute -top-6 left-0 bg-blue-500 text-white px-2 py-1 rounded text-xs">
          {component.name}
        </div>
      )}
      {renderComponentContent()}
      
      {/* Resize handles */}
      {isSelected && (
        <>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded cursor-se-resize" />
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 rounded cursor-s-resize" />
          <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded cursor-e-resize" />
        </>
      )}
    </div>
  );
}

function PropertiesPanel({ 
  component, 
  onUpdate,
  theme 
}: {
  component: DroppedComponent | null;
  onUpdate: (updates: Partial<DroppedComponent>) => void;
  theme: 'light' | 'dark';
}) {
  if (!component) {
    return (
      <div className={`p-4 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-50'}`}>
        <h3 className="font-medium mb-4">Properties</h3>
        <p className="text-gray-500">Select a component to edit its properties</p>
      </div>
    );
  }

  const updateConfig = (updates: any) => {
    onUpdate({
      config: { ...component.config, ...updates }
    });
  };

  const renderPropertiesForm = () => {
    switch (component.type) {
      case 'chart':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Chart Type</label>
              <select
                value={component.config?.chartType || 'line'}
                onChange={(e) => updateConfig({ chartType: e.target.value })}
                className={`w-full rounded border ${
                  theme === 'dark' 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white'
                } px-3 py-2`}
              >
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="area">Area Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="doughnut">Doughnut Chart</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={component.config?.title || ''}
                onChange={(e) => updateConfig({ title: e.target.value })}
                className={`w-full rounded border ${
                  theme === 'dark' 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white'
                } px-3 py-2`}
                placeholder="Chart title"
              />
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={component.config?.showLegend !== false}
                  onChange={(e) => updateConfig({ showLegend: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Show Legend</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={component.config?.showGrid !== false}
                  onChange={(e) => updateConfig({ showGrid: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Show Grid</span>
              </label>
            </div>
          </div>
        );
        
      case 'metric':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={component.config?.title || ''}
                onChange={(e) => updateConfig({ title: e.target.value })}
                className={`w-full rounded border ${
                  theme === 'dark' 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white'
                } px-3 py-2`}
                placeholder="Metric title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Value</label>
              <input
                type="text"
                value={component.config?.value || ''}
                onChange={(e) => updateConfig({ value: e.target.value })}
                className={`w-full rounded border ${
                  theme === 'dark' 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white'
                } px-3 py-2`}
                placeholder="1,234"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Subtitle</label>
              <input
                type="text"
                value={component.config?.subtitle || ''}
                onChange={(e) => updateConfig({ subtitle: e.target.value })}
                className={`w-full rounded border ${
                  theme === 'dark' 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white'
                } px-3 py-2`}
                placeholder="Description"
              />
            </div>
          </div>
        );
        
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Content</label>
              <textarea
                value={component.config?.content || ''}
                onChange={(e) => updateConfig({ content: e.target.value })}
                className={`w-full h-32 rounded border ${
                  theme === 'dark' 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white'
                } px-3 py-2`}
                placeholder="Enter HTML content..."
              />
            </div>
          </div>
        );
        
      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <input
                type="url"
                value={component.config?.src || ''}
                onChange={(e) => updateConfig({ src: e.target.value })}
                className={`w-full rounded border ${
                  theme === 'dark' 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white'
                } px-3 py-2`}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Alt Text</label>
              <input
                type="text"
                value={component.config?.alt || ''}
                onChange={(e) => updateConfig({ alt: e.target.value })}
                className={`w-full rounded border ${
                  theme === 'dark' 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white'
                } px-3 py-2`}
                placeholder="Image description"
              />
            </div>
          </div>
        );
        
      default:
        return <p className="text-gray-500">No properties available for this component.</p>;
    }
  };

  return (
    <div className={`p-4 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-50'}`}>
      <h3 className="font-medium mb-4">Properties: {component.name}</h3>
      
      {/* Position and Size */}
      <div className="mb-6 space-y-4">
        <h4 className="text-sm font-medium text-gray-600">Position & Size</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">X</label>
            <input
              type="number"
              value={component.position.x}
              onChange={(e) => onUpdate({
                position: { ...component.position, x: parseInt(e.target.value) || 0 }
              })}
              className={`w-full rounded border ${
                theme === 'dark' 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white'
              } px-2 py-1 text-sm`}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Y</label>
            <input
              type="number"
              value={component.position.y}
              onChange={(e) => onUpdate({
                position: { ...component.position, y: parseInt(e.target.value) || 0 }
              })}
              className={`w-full rounded border ${
                theme === 'dark' 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white'
              } px-2 py-1 text-sm`}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Width</label>
            <input
              type="number"
              value={component.size.width}
              onChange={(e) => onUpdate({
                size: { ...component.size, width: parseInt(e.target.value) || 100 }
              })}
              className={`w-full rounded border ${
                theme === 'dark' 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white'
              } px-2 py-1 text-sm`}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Height</label>
            <input
              type="number"
              value={component.size.height}
              onChange={(e) => onUpdate({
                size: { ...component.size, height: parseInt(e.target.value) || 100 }
              })}
              className={`w-full rounded border ${
                theme === 'dark' 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white'
              } px-2 py-1 text-sm`}
            />
          </div>
        </div>
      </div>
      
      {/* Component-specific properties */}
      <div>
        <h4 className="text-sm font-medium text-gray-600 mb-4">Configuration</h4>
        {renderPropertiesForm()}
      </div>
    </div>
  );
}

export function ReportBuilder({ onSave, initialReport, theme = 'light' }: ReportBuilderProps) {
  const [reportName, setReportName] = useState(initialReport?.name || 'Untitled Report');
  const [reportDescription, setReportDescription] = useState(initialReport?.description || '');
  const [components, setComponents] = useState<DroppedComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<DroppedComponent | null>(null);
  const [nextId, setNextId] = useState(1);

  const handleDrop = useCallback((item: ComponentItem, offset: { x: number; y: number }) => {
    const newComponent: DroppedComponent = {
      ...item,
      id: `${item.id}-${nextId}`,
      position: { x: Math.max(0, offset.x - 100), y: Math.max(0, offset.y - 50) },
      size: { width: 300, height: 200 },
      config: {}
    };
    
    setComponents(prev => [...prev, newComponent]);
    setSelectedComponent(newComponent);
    setNextId(prev => prev + 1);
  }, [nextId]);

  const handleUpdateComponent = useCallback((updates: Partial<DroppedComponent>) => {
    if (!selectedComponent) return;
    
    const updatedComponent = { ...selectedComponent, ...updates };
    setComponents(prev => prev.map(c => c.id === selectedComponent.id ? updatedComponent : c));
    setSelectedComponent(updatedComponent);
  }, [selectedComponent]);

  const handleDeleteComponent = useCallback(() => {
    if (!selectedComponent) return;
    
    setComponents(prev => prev.filter(c => c.id !== selectedComponent.id));
    setSelectedComponent(null);
  }, [selectedComponent]);

  const handleSaveReport = useCallback(() => {
    const report: Report = {
      id: initialReport?.id || `report-${Date.now()}`,
      name: reportName,
      description: reportDescription,
      sections: components.map(component => ({
        id: component.id,
        type: component.type,
        title: component.config?.title || component.name,
        content: component,
        layout: 'full'
      })),
      format: 'html'
    };
    
    onSave?.(report);
  }, [reportName, reportDescription, components, initialReport, onSave]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`h-screen flex ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
        {/* Sidebar - Component Library */}
        <div className={`w-80 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r flex flex-col`}>
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Component Library</h2>
            <p className="text-sm text-gray-600">Drag components to build your report</p>
          </div>
          
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {componentLibrary.map((item) => (
              <DraggableComponent key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-4 flex items-center justify-between`}>
            <div className="flex items-center space-x-4">
              <div>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className={`text-lg font-semibold bg-transparent border-none outline-none ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}
                  placeholder="Report Name"
                />
                <input
                  type="text"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  className={`block text-sm bg-transparent border-none outline-none mt-1 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}
                  placeholder="Description"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {selectedComponent && (
                <button
                  onClick={handleDeleteComponent}
                  className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                onClick={handleSaveReport}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Save Report
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 p-4">
            <DroppableCanvas
              components={components}
              onDrop={handleDrop}
              onSelectComponent={setSelectedComponent}
              selectedComponent={selectedComponent}
              theme={theme}
            />
          </div>
        </div>

        {/* Properties Panel */}
        <div className={`w-80 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-l`}>
          <PropertiesPanel
            component={selectedComponent}
            onUpdate={handleUpdateComponent}
            theme={theme}
          />
        </div>
      </div>
    </DndProvider>
  );
}