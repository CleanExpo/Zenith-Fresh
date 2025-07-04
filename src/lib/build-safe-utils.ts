// Build-safe utilities that work during static generation

export function safeHeaders() {
  // During build, return empty headers object
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    return {};
  }
  
  try {
    if (typeof headers !== 'undefined') {
      return headers();
    }
    return {};
  } catch {
    return {};
  }
}

export function safeRequest(request?: Request) {
  if (!request) {
    return { url: '', searchParams: new URLSearchParams() };
  }
  
  try {
    const url = new URL(request.url);
    return {
      url: request.url,
      searchParams: url.searchParams
    };
  } catch {
    return { url: '', searchParams: new URLSearchParams() };
  }
}

export function safeAuth() {
  try {
    return auth();
  } catch {
    return null;
  }
}
