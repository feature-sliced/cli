# Maintainer's Guide

## Publishing a new version

1. Run `pnpm changeset version` and review the changes
2. Commit the changes and push to `main`
3. Run `pnpm changeset publish`
4. Push the tag to GitHub: `git push --follow-tags`
