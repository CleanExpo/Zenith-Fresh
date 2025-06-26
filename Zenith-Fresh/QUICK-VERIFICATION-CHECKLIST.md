# 🔍 QUICK VERIFICATION CHECKLIST

## Status Level Definitions

### ✅ COMPLETE
- [ ] Component/feature files exist
- [ ] Files compile without TypeScript errors
- [ ] Component is imported and used in a route
- [ ] Route returns 200 and renders properly
- [ ] Feature shows real data (not just static UI)
- [ ] All dependencies are working
- [ ] Can be used by end users

### ⚡ FUNCTIONAL
- [ ] Component/feature files exist
- [ ] Files compile without TypeScript errors
- [ ] Component is imported and used in a route
- [ ] Route returns 200 and renders properly
- [ ] Shows UI but may use mock/static data
- [ ] Basic functionality works

### 🚧 IN PROGRESS
- [ ] Component/feature files exist
- [ ] Files compile without TypeScript errors
- [ ] May have import/routing issues
- [ ] UI partially works or shows errors
- [ ] Missing key functionality

### ❌ NOT STARTED
- [ ] No files exist
- [ ] Or files exist but don't compile
- [ ] Or no routes/imports found
- [ ] Cannot be accessed by users

### ❓ UNKNOWN
- [ ] Cannot verify due to missing dependencies
- [ ] Or environment issues prevent testing
- [ ] Requires external services not available

## Required Evidence for Each Status

### For ✅ COMPLETE:
```bash
# 1. File existence
ls path/to/component.tsx

# 2. No TypeScript errors
npm run build

# 3. Find imports
grep -r "ComponentName" app/

# 4. Test route
curl http://localhost:3000/route
# OR browser screenshot showing working feature

# 5. Test data flow
# Screenshot or description of real data being displayed
```

### For ⚡ FUNCTIONAL:
```bash
# 1-4 same as COMPLETE
# 5. UI works but data may be static
# Screenshot showing UI renders properly
```

### For 🚧 IN PROGRESS:
```bash
# 1-2 same as above
# 3. Show what's missing (imports, routes, etc.)
# 4. Show errors or incomplete functionality
```

## Verification Commands

### Check File Existence
```bash
# List all components in a category
find components/[category] -name "*.tsx"

# Check specific component
ls components/path/ComponentName.tsx
```

### Check TypeScript Compilation
```bash
# Full build test
npm run build

# Type check only
npm run type-check
```

### Find Component Usage
```bash
# Find imports
grep -r "import.*ComponentName" app/ src/

# Find component usage
grep -r "<ComponentName" app/ src/
```

### Test Routes
```bash
# Start dev server
npm run dev

# Test route (in another terminal)
curl -I http://localhost:3000/route-path

# Or use browser and document with screenshot
```

### Check Dependencies
```bash
# Check if databases are accessible
npm run db:status # (if exists)

# Check environment variables
env | grep -E "(DATABASE|REDIS|STRIPE)"

# Test API endpoints
curl http://localhost:3000/api/test-endpoint
```

## Template for Evidence Documentation

```markdown
## Feature: [Feature Name]

**Status**: ✅ COMPLETE / ⚡ FUNCTIONAL / 🚧 IN PROGRESS / ❌ NOT STARTED / ❓ UNKNOWN

**Files Checked**:
- [ ] `/path/to/component.tsx` - EXISTS/NOT FOUND
- [ ] `/app/route/page.tsx` - EXISTS/NOT FOUND

**Compilation**:
```bash
$ npm run build
[paste output showing success/failure]
```

**Route Test**:
```bash
$ curl -I http://localhost:3000/route
[paste response]
```

**Functionality Test**:
[Screenshot or description of what you tested]

**Evidence**:
- File exists: ✅/❌
- Compiles: ✅/❌  
- Route accessible: ✅/❌
- Shows real data: ✅/❌/STATIC
- User can interact: ✅/❌/PARTIAL

**Last Verified**: [Date]
**Verified By**: [Person/Script]
```

## Critical Rules

1. **NEVER mark as COMPLETE without testing the actual route**
2. **ALWAYS provide command output as evidence**
3. **DISTINGUISH between UI mockups and working features**
4. **Mark as UNKNOWN if you can't test, not COMPLETE**
5. **Include date and verification method for every claim**

## Quick Reference

🔍 BEFORE marking complete → TEST IT  
📁 File exists → CHECK IMPORTS  
🚀 Compiles → TEST FUNCTIONALITY  
📊 Shows UI → CHECK DATA FLOW  
✅ Works locally → VERIFY DEPENDENCIES  

**Remember**: It's better to be accurate than optimistic!