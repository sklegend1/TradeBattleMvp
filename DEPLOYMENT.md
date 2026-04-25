# Trade Battle MVP - Deployment & Known Issues

## ✅ What's Fixed

### Vercel 404 Issue
- **Root Cause**: Dynamic routes `/game/[roomId]` were being prerendered as static, but infinite room IDs can't be prerendered
- **Solution**: Added `export const dynamic = 'force-dynamic'` to render routes on-demand
- **Status**: ✅ Fixed and deployed

---

## ⚠️ Known Limitations (MVP)

### 1. **In-Memory State Across Instances** (Critical for Production)

**Problem**: The game store is in-memory JavaScript object
- Each Vercel serverless function instance has its own copy
- Different requests may hit different instances
- Game state can be lost or desynchronized

**Workaround** (Current MVP):
- Both players should keep their browser tabs OPEN
- Polling every 1 second keeps them synced within the same session

**Production Solution - Choose One**:

#### Option A: Vercel KV (Recommended)
```bash
npm install @vercel/kv
```
Update `lib/gameStore.ts` to use Vercel KV instead of in-memory object

#### Option B: Upstash Redis
```bash
npm install @upstash/redis
```

#### Option C: Firebase Realtime Database
- Global, free, real-time syncing built-in
- Less setup than Redis

---

## 🚀 Deployment Checklist

- ✅ Vercel deployment working
- ✅ Dynamic routes rendering
- ⚠️ Game state persistence needed for multi-instance scenarios
- ⚠️ BTC price fetching (uses fallback $42,500 without working proxy)

---

## 📋 Next Steps for Production

### 1. Fix BTC Price (High Priority)
Either:
- Set up proxy at `127.0.0.1:10808` (local only)
- Or modify `lib/priceService.ts` to use direct Binance API in production

### 2. Add Persistent State (High Priority)
```typescript
// Quick fix: Switch from in-memory to Vercel KV
import { kv } from '@vercel/kv';

// Replace games[roomId] with:
// await kv.set(`game:${roomId}`, gameData);
// const gameData = await kv.get(`game:${roomId}`);
```

### 3. Add Authentication (For Real Releases)
- Replace player selection with sign-in
- Store player profiles and match history

### 4. WebSockets (Optional Optimization)
- Replace polling with Socket.IO for real-time updates
- Reduces latency from 1 second to <100ms

---

## 🔍 Testing Deployment

1. Go to your Vercel dashboard → [Project Name]
2. Check **Deployments** tab for latest status
3. Click the deployment to view logs
4. Test: `https://<your-domain>/game/test-room-1?player=1`

---

## 📞 Debugging

### If still seeing 404:
1. Check Vercel deployment logs (Deployments → Log)
2. Verify git push completed: `git log --oneline` (should see latest commits)
3. Try visiting `/` to confirm home page loads
4. Try `/api/game?roomId=test` to test API directly

### If game state resets:
This is expected with in-memory store. Use Redis solution above to fix.

### If BTC price shows fallback ($42,500):
The proxy or Binance API isn't accessible. Check:
- Is proxy running at `127.0.0.1:10808`?
- Does Vercel have internet access to Binance?

---

## 📊 MVP vs Production Differences

| Feature | MVP | Production |
|---------|-----|-----------|
| State Management | In-Memory | Redis/Firestore |
| Real-Time Updates | Polling (1s) | WebSockets (<100ms) |
| Authentication | Room-based | User-based |
| Data Persistence | Session Only | Permanent |
| Price Source | Fallback | Live Binance |
| Scalability | Single Instance | Multi-Instance |

