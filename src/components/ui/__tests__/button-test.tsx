// Test component to verify Button functionality
import React from 'react'
import { Button } from '../button'

export function ButtonTest() {
  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Button Component Test</h2>
      
      {/* Regular Button Usage */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Regular Button Usage:</h3>
        <Button>Default Button</Button>
        <Button variant="destructive">Destructive Button</Button>
        <Button variant="outline">Outline Button</Button>
        <Button variant="ghost">Ghost Button</Button>
        <Button variant="gradient">Gradient Button</Button>
      </div>

      {/* asChild Usage with Links */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">asChild Usage with Links:</h3>
        <Button asChild variant="default">
          <a href="#test">Link styled as Button</a>
        </Button>
        
        <Button asChild variant="outline">
          <a href="#test2">Outline Link Button</a>
        </Button>
        
        <Button asChild variant="gradient">
          <a href="#test3">Gradient Link Button</a>
        </Button>
      </div>

      {/* asChild Usage with Divs */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">asChild Usage with Divs:</h3>
        <Button asChild variant="secondary">
          <div role="button" tabIndex={0}>
            Div styled as Button
          </div>
        </Button>
        
        <Button asChild variant="glass">
          <div role="button" tabIndex={0} className="cursor-pointer">
            Glass Div Button (should merge classes)
          </div>
        </Button>
      </div>

      {/* Edge Cases */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Edge Cases:</h3>
        
        {/* This should render null and show warning in dev mode */}
        <div>
          <p className="text-sm text-gray-600">asChild with no children (should render null):</p>
          <Button asChild variant="default">
            {/* No children */}
          </Button>
        </div>
        
        {/* This should render null and show warning in dev mode */}
        <div>
          <p className="text-sm text-gray-600">asChild with multiple children (should render null):</p>
          <Button asChild variant="default">
            <span>First child</span>
            <span>Second child</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
