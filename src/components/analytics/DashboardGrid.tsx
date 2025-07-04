'use client';

import React from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Move, Settings } from 'lucide-react';
import KPIWidget from './widgets/KPIWidget';
import ChartWidget from './widgets/ChartWidget';
import TableWidget from './widgets/TableWidget';
import FunnelWidget from './widgets/FunnelWidget';
import HeatmapWidget from './widgets/HeatmapWidget';
import MapWidget from './widgets/MapWidget';

// CSS imports for react-grid-layout
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  widgets: Widget[];
  layout: GridLayout;
  isEditing: boolean;
  onLayoutChange: (layout: any[]) => void;
  timeRange: string;
  teamId: string;
}

interface Widget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'funnel' | 'heatmap' | 'map';
  title: string;
  description?: string;
  config: any;
  dataSource: string;
  position: { x: number; y: number; w: number; h: number };
  refreshRate?: number;
  data?: any;
}

interface GridLayout {
  columns: number;
  rowHeight: number;
  margin: [number, number];
}

const widgetComponents = {
  kpi: KPIWidget,
  chart: ChartWidget,
  table: TableWidget,
  funnel: FunnelWidget,
  heatmap: HeatmapWidget,
  map: MapWidget
};

export default function DashboardGrid({
  widgets,
  layout,
  isEditing,
  onLayoutChange,
  timeRange,
  teamId
}: DashboardGridProps) {
  const gridLayout = widgets.map(widget => ({
    i: widget.id,
    x: widget.position.x,
    y: widget.position.y,
    w: widget.position.w,
    h: widget.position.h,
    minW: getMinWidth(widget.type),
    minH: getMinHeight(widget.type),
    maxW: getMaxWidth(widget.type),
    maxH: getMaxHeight(widget.type)
  }));

  const handleLayoutChange = (newLayout: any[]) => {
    if (isEditing) {
      onLayoutChange(newLayout);
    }
  };

  const handleRemoveWidget = (widgetId: string) => {
    // This would be handled by parent component
    console.log('Remove widget:', widgetId);
  };

  const handleEditWidget = (widgetId: string) => {
    // This would open widget configuration modal
    console.log('Edit widget:', widgetId);
  };

  return (
    <div className="dashboard-grid">
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: gridLayout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: layout.columns, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={layout.rowHeight}
        margin={layout.margin}
        isDraggable={isEditing}
        isResizable={isEditing}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        resizeHandles={['se']}
      >
        {widgets.map((widget) => {
          const WidgetComponent = widgetComponents[widget.type];
          
          if (!WidgetComponent) {
            return (
              <Card key={widget.id} className="p-4">
                <div className="text-center text-gray-500">
                  Unknown widget type: {widget.type}
                </div>
              </Card>
            );
          }

          return (
            <div key={widget.id} className="widget-container">
              <Card className="h-full overflow-hidden">
                {/* Widget Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
                  <div className="flex items-center gap-2">
                    {isEditing && (
                      <div className="drag-handle cursor-move">
                        <Move className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {widget.title}
                      </h3>
                      {widget.description && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {widget.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditWidget(widget.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Settings className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveWidget(widget.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Widget Content */}
                <div className="widget-content h-full overflow-hidden">
                  <WidgetComponent
                    config={widget.config}
                    data={widget.data}
                    timeRange={timeRange}
                    teamId={teamId}
                    widgetId={widget.id}
                  />
                </div>
              </Card>
            </div>
          );
        })}
      </ResponsiveGridLayout>

      <style jsx global>{`
        .react-grid-layout {
          position: relative;
        }

        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top;
        }

        .react-grid-item.cssTransforms {
          transition-property: transform;
        }

        .react-grid-item > .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
          bottom: 0;
          right: 0;
          background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB2aWV3Qm94PSIwIDAgNiA2IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZG90cyBmaWxsPSIjOTk5IiBkPSJtMTUgMTJjMCAuNTUyMjg0NzQ5LS40NDc3MTUyNTEgMS0xIDFzLTEtLjQ0NzcxNTI1MS0xLTEgLjQ0NzcxNTI1MS0xIDEtMXptLTQgMGMwIC41NTIyODQ3NDktLjQ0NzcxNTI1MSAxLTEgMXMtMS0uNDQ3NzE1MjUxLTEtMSAuNDQ3NzE1MjUxLTEgMS0xem0tNCAwYzAgLjU1MjI4NDc0OS0uNDQ3NzE1MjUxIDEtMSAxcy0xLS40NDc3MTUyNTEtMS0xIC40NDc3MTUyNTEtMSAxLTF6bTggNGMwIC41NTIyODQ3NDktLjQ0NzcxNTI1MSAxLTEgMXMtMS0uNDQ3NzE1MjUxLTEtMSAuNDQ3NzE1MjUxLTEgMS0xem0tNCAwYzAgLjU1MjI4NDc0OS0uNDQ3NzE1MjUxIDEtMSAxcy0xLS40NDc3MTUyNTEtMS0xIC40NDc3MTUyNTEtMSAxLTF6bTggNGMwIC41NTIyODQ3NDktLjQ0NzcxNTI1MSAxLTEgMXMtMS0uNDQ3NzE1MjUxLTEtMSAuNDQ3NzE1MjUxLTEgMS0xeiIvPgo8L3N2Zz4K');
          background-position: bottom right;
          padding: 0 3px 3px 0;
          background-repeat: no-repeat;
          background-origin: content-box;
          box-sizing: border-box;
          cursor: se-resize;
        }

        .react-grid-item.react-grid-placeholder {
          background: rgb(59 130 246 / 0.15);
          border: 2px dashed rgb(59 130 246 / 0.4);
          opacity: 0.2;
          transition-duration: 100ms;
          z-index: 2;
          user-select: none;
        }

        .widget-container {
          height: 100%;
        }

        .widget-content {
          height: calc(100% - 56px); /* Subtract header height */
        }

        .drag-handle:hover {
          color: rgb(59 130 246);
        }
      `}</style>
    </div>
  );
}

// Widget size constraints
function getMinWidth(type: string): number {
  const minWidths = {
    kpi: 3,
    chart: 4,
    table: 4,
    funnel: 4,
    heatmap: 6,
    map: 6
  };
  return minWidths[type as keyof typeof minWidths] || 3;
}

function getMinHeight(type: string): number {
  const minHeights = {
    kpi: 2,
    chart: 3,
    table: 3,
    funnel: 4,
    heatmap: 4,
    map: 4
  };
  return minHeights[type as keyof typeof minHeights] || 2;
}

function getMaxWidth(type: string): number {
  return 12; // Full width
}

function getMaxHeight(type: string): number {
  const maxHeights = {
    kpi: 4,
    chart: 8,
    table: 8,
    funnel: 6,
    heatmap: 8,
    map: 8
  };
  return maxHeights[type as keyof typeof maxHeights] || 8;
}