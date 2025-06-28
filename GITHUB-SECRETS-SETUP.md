# GitHub Secrets Configuration

## Required Secrets for GitHub Actions

Add these to your GitHub repository:
https://github.com/CleanExpo/Zenith-Fresh/settings/secrets/actions

### 1. VERCEL_PROJECT_ID ✅
```
prj_qIKYHm4gGHsUiJzHFIcejT5bjHRd
```

### 2. VERCEL_TOKEN
```
N5UFI8ZprlgY69oigubxRp6s
```

### 3. VERCEL_ORG_ID ⚠️ (Still needed)
This should look like `team_xxxxxxxxxxxx` or could be your personal account ID.

To find your Vercel Org/Team ID:
1. Go to https://vercel.com/account
2. Look for "Team ID" or "Personal Account ID"
3. It might also be in the URL when you're in your dashboard

OR 

Try deploying manually first with:
```bash
vercel --prod
```

If it asks you to select a scope/team, the ID will be shown there.

## Quick Deploy Command

Once you have all three secrets configured in GitHub, push an empty commit to trigger deployment:

```bash
git commit --allow-empty -m "Deploy: With Vercel secrets configured"
git push origin main
```