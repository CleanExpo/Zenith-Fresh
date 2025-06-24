/**
 * ES Module wrapper for SessionStore
 * This file provides ES module exports for Next.js compatibility
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { getSessionStore, SessionStore } = require('./session-store.js');

export { getSessionStore, SessionStore };
export default SessionStore;