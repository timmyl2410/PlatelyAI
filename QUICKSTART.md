# 🚀 PlatelyAI Monorepo - Quick Reference

## 📦 What Changed?

**Added:**
- `pnpm-workspace.yaml` - Workspace configuration
- `packages/shared/` - Shared Firestore paths/types
- `apps/mobile/` - Placeholder for mobile app
- Documentation files

**Modified:**
- `package.json` - Added workspace scripts (name changed to `@plately/web`)
- `.gitignore` - Ignore mobile app until you add it

**Unchanged:**
- ✅ All web app source code (`src/`)
- ✅ Backend code (`backend/`)
- ✅ Netlify functions (`netlify/functions/`)
- ✅ Build/deploy config (`vite.config.ts`, `netlify.toml`)

---

## 🎯 Quick Commands

```bash
# Web app (frontend)
pnpm dev              # or pnpm dev:web

# Backend
pnpm dev:backend

# Mobile (after adding your app)
cd apps/mobile && expo start

# Build shared package
cd packages/shared && pnpm build
```

---

## 📚 Read This First

1. **[MONOREPO_SETUP.md](./MONOREPO_SETUP.md)** - Overview and rollback plan
2. **[apps/mobile/README.md](./apps/mobile/README.md)** - How to add your mobile app
3. **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - How to use shared package (optional)

---

## ⚡ Next Steps

### Immediate (Safe)
1. Install dependencies: `pnpm install`
2. Test web app: `pnpm dev`
3. Test backend: `pnpm dev:backend`
4. Build shared package: `cd packages/shared && pnpm build`

### When Ready (Your Timeline)
1. Copy mobile app to `apps/mobile/`
2. Optionally integrate shared package in web app (see INTEGRATION_GUIDE.md)

---

## 🆘 Emergency Rollback

If anything breaks:
```bash
rm -rf packages/
rm -rf apps/
rm pnpm-workspace.yaml
```

That's it. Your web app will work exactly as before.

---

## 🤔 FAQ

**Q: Will this break my Netlify deploy?**  
A: No. Netlify config is unchanged. Deploy works exactly as before.

**Q: Do I have to use the shared package?**  
A: No. It's completely optional. The monorepo structure alone gives you co-location benefits.

**Q: Can I still use npm/yarn instead of pnpm?**  
A: Yes, but pnpm is recommended for monorepos. npm/yarn will work but may have different linking behavior.

**Q: What if I don't have a mobile app yet?**  
A: That's fine. The `apps/mobile/` folder is just a placeholder. Ignore it until you're ready.

**Q: Do I need to change my existing code?**  
A: No. All changes are additive. Your existing web/backend code works as-is.

---

## 📞 Status Check

Run these to verify everything works:

```bash
# 1. Web app runs
pnpm dev
# ✅ Should start at http://localhost:5173

# 2. Backend runs
pnpm dev:backend
# ✅ Should start on configured port

# 3. Shared package builds
cd packages/shared && pnpm build
# ✅ Should create dist/ folder with compiled types

# 4. TypeScript is happy
cd packages/shared && pnpm tsc --noEmit
# ✅ Should have no errors
```

If all ✅ pass, you're good to go!
