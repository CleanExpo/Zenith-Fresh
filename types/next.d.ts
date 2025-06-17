import { ReactNode } from 'react'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any
    }
  }
}

export interface LayoutProps {
  children: ReactNode
}

export interface PageProps {
  params: { [key: string]: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

declare module 'next' {
  interface LayoutProps {
    children: ReactNode
  }

  interface PageProps {
    params: { [key: string]: string }
    searchParams: { [key: string]: string | string[] | undefined }
  }
} 