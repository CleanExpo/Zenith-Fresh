# README.md — Redis-Safe SaaS Template

## 🎯 Purpose
This setup ensures your Next.js SaaS application runs 100% — even if Redis is unavailable — by falling back to real DB logic without mock data or build-time failures.

---

## 🧱 Architecture Overview
| Layer            | Redis Used? | Fallback Strategy                | Notes                            |
|------------------|-------------|----------------------------------|----------------------------------|
| Cache            | ✅           | DB fallback                      | Never cache mock data            |
| Sessions         | ✅           | JWT sessions                     | RedisAdapter only in prod        |
| Rate Limiting    | ✅           | Unlimited or local count         | Uses Upstash safely              |
| Queues           | ✅           | Inline job runner fallback       | BullMQ stub when Redis down      |
| Build-Time Logic | ❌           | Never touch Redis at build time  | Wrapped in initRedis guard       |

---

## 🔐 Environment Variables Required
```
REDIS_URL=redis://your.redis.url:6379
UPSTASH_TOKEN=your-upstash-token-if-used
```

> Do NOT use 127.0.0.1 for Redis unless you're developing locally and running Redis.

---

## ✅ Redis Readiness Checklist
- [x] Central `lib/redis.ts` manages availability
- [x] `initRedis()` only runs during API route calls
- [x] All feature modules check `redis.isAvailable()`
- [x] `getMockData()` blocked in production
- [x] `.next/routes-manifest.json` builds successfully
- [x] GitHub CI uses local memory fallback for Redis

---

## 🧪 Example Redis Health Endpoint
Create `pages/api/health/redis.ts`:
```ts
import { cache, initRedis } from '@/lib/redis';

export default async function handler(req, res) {
  await initRedis();

  const redisOk = cache.isAvailable();
  res.status(redisOk ? 200 : 500).json({ redisOk });
}
```

---

## 🚀 GitHub CI Example (No Redis Required)
`.github/workflows/test.yml`
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: echo "REDIS_URL=memory" >> .env
      - run: npm run build
      - run: npm test
```

---

## 📘 Best Practices for Claude & Team
1. NEVER call Redis inside `next.config.js`, `middleware.ts`, or `getStaticProps`
2. ALWAYS use `cache.get()`/`cache.set()` from `lib/redis.ts` — never raw redis client
3. NEVER include mock data in production logic
4. IF Redis is unavailable, app must continue using real DB logic (not fail or mock)
5. IF queue/job/session uses Redis, fallback to inline/local options

---

For any future modules, always extend this safe interface.

🧙🏾‍♂️: This is your master blueprint. Continue building without Redis-based breakages ever again.