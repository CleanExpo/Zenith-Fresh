'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { TimeSeries, DataPoint } from '@/types/business-intelligence/analytics';

interface D3ChartProps {
  type: 'heatmap' | 'treemap' | 'sankey' | 'network' | 'choropleth' | 'sunburst';
  data: any;
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
  interactive?: boolean;
  animations?: boolean;
  colorScheme?: string[];
  onNodeClick?: (node: any) => void;
  onNodeHover?: (node: any) => void;
  className?: string;
}

export function D3Chart({
  type,
  data,
  width = 800,
  height = 600,
  theme = 'light',
  interactive = true,
  animations = true,
  colorScheme,
  onNodeClick,
  onNodeHover,
  className = ''
}: D3ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

  const colors = colorScheme || (theme === 'dark' 
    ? ['#1E40AF', '#DC2626', '#059669', '#D97706', '#7C3AED']
    : ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6']
  );

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    switch (type) {
      case 'heatmap':
        renderHeatmap(g, data, innerWidth, innerHeight);
        break;
      case 'treemap':
        renderTreemap(g, data, innerWidth, innerHeight);
        break;
      case 'network':
        renderNetwork(g, data, innerWidth, innerHeight);
        break;
      case 'sunburst':
        renderSunburst(g, data, innerWidth, innerHeight);
        break;
      default:
        console.warn(`Chart type ${type} not implemented yet`);
    }
  }, [data, type, width, height, theme, colors]);

  const renderHeatmap = (g: any, data: any[], width: number, height: number) => {
    if (!data || !Array.isArray(data)) return;

    const xValues = Array.from(new Set(data.map(d => d.x))).sort();
    const yValues = Array.from(new Set(data.map(d => d.y))).sort();

    const xScale = d3.scaleBand()
      .domain(xValues)
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleBand()
      .domain(yValues)
      .range([0, height])
      .padding(0.1);

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain(d3.extent(data, d => d.value) as [number, number]);

    // Create cells
    const cells = g.selectAll('.cell')
      .data(data)
      .enter().append('rect')
      .attr('class', 'cell')
      .attr('x', (d: any) => xScale(d.x))
      .attr('y', (d: any) => yScale(d.y))
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', (d: any) => colorScale(d.value))
      .attr('stroke', theme === 'dark' ? '#374151' : '#E5E7EB')
      .attr('stroke-width', 1);

    if (interactive) {
      cells
        .on('mouseover', function(this: any, event: any, d: any) {
          d3.select(this).attr('opacity', 0.8);
          setTooltip({
            x: event.pageX,
            y: event.pageY,
            content: `${d.x}, ${d.y}: ${d.value}`
          });
          onNodeHover?.(d);
        })
        .on('mouseout', function(this: any) {
          d3.select(this).attr('opacity', 1);
          setTooltip(null);
        })
        .on('click', function(event: any, d: any) {
          onNodeClick?.(d);
        });
    }

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('fill', theme === 'dark' ? '#D1D5DB' : '#374151');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('fill', theme === 'dark' ? '#D1D5DB' : '#374151');
  };

  const renderTreemap = (g: any, data: any, width: number, height: number) => {
    const root = d3.hierarchy(data)
      .sum((d: any) => d.value)
      .sort((a: any, b: any) => b.value - a.value);

    d3.treemap()
      .size([width, height])
      .paddingInner(2)
      .paddingOuter(2)
      (root);

    const colorScale = d3.scaleOrdinal(colors);

    const leaf = g.selectAll('g')
      .data(root.leaves())
      .enter().append('g')
      .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`);

    leaf.append('rect')
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('fill', (d: any, i: number) => colorScale(i.toString()))
      .attr('stroke', theme === 'dark' ? '#374151' : '#E5E7EB')
      .attr('stroke-width', 1);

    leaf.append('text')
      .attr('x', 4)
      .attr('y', 14)
      .text((d: any) => d.data.name)
      .attr('font-size', '12px')
      .attr('fill', theme === 'dark' ? '#F9FAFB' : '#111827');

    if (interactive) {
      leaf
        .on('mouseover', function(this: any, event: any, d: any) {
          d3.select(this).select('rect').attr('opacity', 0.8);
          setTooltip({
            x: event.pageX,
            y: event.pageY,
            content: `${d.data.name}: ${d.data.value}`
          });
          onNodeHover?.(d.data);
        })
        .on('mouseout', function(this: any) {
          d3.select(this).select('rect').attr('opacity', 1);
          setTooltip(null);
        })
        .on('click', function(event: any, d: any) {
          onNodeClick?.(d.data);
        });
    }
  };

  const renderNetwork = (g: any, data: any, width: number, height: number) => {
    const { nodes, links } = data;

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', theme === 'dark' ? '#6B7280' : '#9CA3AF')
      .attr('stroke-width', (d: any) => Math.sqrt(d.value || 1));

    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', (d: any) => Math.sqrt(d.value || 20))
      .attr('fill', (d: any, i: number) => colors[i % colors.length])
      .attr('stroke', theme === 'dark' ? '#374151' : '#E5E7EB')
      .attr('stroke-width', 2);

    const labels = g.append('g')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .text((d: any) => d.name)
      .attr('font-size', 12)
      .attr('fill', theme === 'dark' ? '#F9FAFB' : '#111827')
      .attr('text-anchor', 'middle')
      .attr('dy', 4);

    if (interactive) {
      node.call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

      node
        .on('mouseover', function(this: any, event: any, d: any) {
          d3.select(this).attr('opacity', 0.8);
          setTooltip({
            x: event.pageX,
            y: event.pageY,
            content: `${d.name}: ${d.value || 'N/A'}`
          });
          onNodeHover?.(d);
        })
        .on('mouseout', function(this: any) {
          d3.select(this).attr('opacity', 1);
          setTooltip(null);
        })
        .on('click', function(event: any, d: any) {
          onNodeClick?.(d);
        });
    }

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      labels
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  };

  const renderSunburst = (g: any, data: any, width: number, height: number) => {
    const radius = Math.min(width, height) / 2;
    const colorScale = d3.scaleOrdinal(colors);

    const partition = d3.partition()
      .size([2 * Math.PI, radius]);

    const root = d3.hierarchy(data)
      .sum((d: any) => d.value)
      .sort((a: any, b: any) => b.value - a.value);

    partition(root);

    // Type the partitioned data correctly
    const partitionedRoot = root as d3.HierarchyNode<any> & {
      x0: number;
      x1: number;
      y0: number;
      y1: number;
    };

    const arc = d3.arc<any>()
      .startAngle((d: any) => d.x0)
      .endAngle((d: any) => d.x1)
      .innerRadius((d: any) => d.y0)
      .outerRadius((d: any) => d.y1);

    const slices = g.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`)
      .selectAll('path')
      .data(partitionedRoot.descendants())
      .enter().append('path')
      .attr('d', arc)
      .attr('fill', (d: any) => colorScale(d.data.name))
      .attr('stroke', theme === 'dark' ? '#374151' : '#E5E7EB')
      .attr('stroke-width', 1);

    if (interactive) {
      slices
        .on('mouseover', function(this: any, event: any, d: any) {
          d3.select(this).attr('opacity', 0.8);
          setTooltip({
            x: event.pageX,
            y: event.pageY,
            content: `${d.data.name}: ${d.data.value || d.value}`
          });
          onNodeHover?.(d.data);
        })
        .on('mouseout', function(this: any) {
          d3.select(this).attr('opacity', 1);
          setTooltip(null);
        })
        .on('click', function(event: any, d: any) {
          onNodeClick?.(d.data);
        });
    }

    // Add labels for larger segments
    g.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`)
      .selectAll('text')
      .data(partitionedRoot.descendants().filter((d: any) => (d.x1 - d.x0) > 0.1))
      .enter().append('text')
      .attr('transform', (d: any) => {
        const angle = (d.x0 + d.x1) / 2;
        const radius = (d.y0 + d.y1) / 2;
        return `rotate(${angle * 180 / Math.PI - 90}) translate(${radius}) rotate(${angle < Math.PI ? 0 : 180})`;
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', theme === 'dark' ? '#F9FAFB' : '#111827')
      .text((d: any) => d.data.name);
  };

  return (
    <div className={`relative ${className}`}>
      <svg ref={svgRef} />
      {tooltip && (
        <div
          className={`absolute z-10 px-2 py-1 text-sm rounded shadow-lg pointer-events-none ${
            theme === 'dark' 
              ? 'bg-gray-800 text-white border border-gray-600' 
              : 'bg-white text-gray-900 border border-gray-200'
          }`}
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}