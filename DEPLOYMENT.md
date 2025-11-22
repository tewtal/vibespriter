# GitHub Pages Deployment Guide

## Prerequisites

1. GitHub account
2. Git installed locally
3. Node.js installed (for local testing)

## Initial Setup

### 1. Create GitHub Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: VibeSpriter NES sprite editor"

# Create repository on GitHub (via web interface)
# Then add remote
git remote add origin https://github.com/yourusername/vibespriter.git

# Push to GitHub
git push -u origin main
```

### 2. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Source**, select:
   - **Source**: GitHub Actions
4. Click **Save**

That's it! The workflow will automatically deploy on every push to `main`.

## Configuration

### Base URL

The `vite.config.js` is configured with:

```javascript
base: '/vibespriter/'
```

**Important**: Change this to match your repository name!
- If your repo is `my-sprite-editor`, change to `/my-sprite-editor/`
- If deploying to a custom domain, set `base: '/'`

### Custom Domain (Optional)

1. Create a file named `CNAME` in the project root:
   ```
   yourdomain.com
   ```

2. In GitHub Settings → Pages, add your custom domain

3. Update `vite.config.js`:
   ```javascript
   base: '/'
   ```

## Deployment

### Automatic Deployment

Every push to `main` branch triggers automatic deployment:

```bash
git add .
git commit -m "Update features"
git push
```

### Manual Deployment

Trigger manually from GitHub:
1. Go to **Actions** tab
2. Select "Deploy to GitHub Pages"
3. Click **Run workflow**

## Local Testing

Test the production build locally:

```bash
# Build
npm run build

# Preview
npm run preview
```

Visit `http://localhost:4173/vibespriter/` to test.

## Workflow Status

Check deployment status:
- GitHub repository → **Actions** tab
- Green checkmark = successful deployment
- Red X = failed (click for logs)

## File Structure After Build

```
dist/
├── index.html
├── assets/
│   ├── main-[hash].js
│   └── style-[hash].css
└── default/              # Sample files
    ├── link.rdc
    └── samus.rdc
```

## Troubleshooting

### Build Fails

1. Check GitHub Actions logs
2. Test locally: `npm run build`
3. Common issues:
   - Missing dependencies: `npm install`
   - Syntax errors: Check console output

### 404 on Assets

- Verify `base` in `vite.config.js` matches repo name
- Check file paths are relative, not absolute

### Sample Files Not Loading

- Ensure `default/` folder exists
- Verify `publicDir: 'default'` in `vite.config.js`
- Check browser console for fetch errors

## Updating

To update after making changes:

```bash
# Make changes
git add .
git commit -m "Description of changes"
git push
```

The site auto-updates in ~1-2 minutes.

## Your Live URL

After deployment, your site will be at:
```
https://yourusername.github.io/vibespriter/
```

Replace `yourusername` with your GitHub username.

## Notes

- First deployment may take 5-10 minutes
- Subsequent deploys are faster (~60 seconds)
- Cache may cause old versions to show (hard refresh: Ctrl+Shift+R)
- Free tier has 100 GB/month bandwidth limit

## Support

If issues persist:
1. Check [GitHub Pages documentation](https://docs.github.com/en/pages)
2. Review [Vite deployment guide](https://vitejs.dev/guide/static-deploy.html)
3. Open an issue in this repository
