import React from 'react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'warning';
}

export function Alert({ 
  variant = 'default', 
  className = '', 
  children, 
  ...props 
}: AlertProps) {
  const variants = {
    default: 'border-gray-200 bg-gray-50 text-gray-900',
    destructive: 'border-red-200 bg-red-50 text-red-900',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-900'
  };
  
  return (
    <div
      className={`rounded-lg border p-4 ${variants[variant]} ${className}`}
      role="alert"
      {...props}
    >
      {children}
    </div>
  );
}

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function AlertDescription({ 
  className = '', 
  children, 
  ...props 
}: AlertDescriptionProps) {
  return (
    <p className={`text-sm leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}