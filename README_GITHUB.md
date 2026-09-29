
# RT LAB STUDIO — GitHub Pages

Repository root contents are ready to upload directly. Do not upload this ZIP inside the repository.

## Deployment
1. Delete the old repository files (keep nothing from the old app except `.git` on GitHub; do not delete repository history).
2. Upload all files/folders from this folder to the repository root.
3. Commit to `main`.
4. GitHub Actions workflow `.github/workflows/deploy.yml` builds and deploys GitHub Pages.
5. Open `https://ramimokhtar228-maker.github.io/RT-LAB-STUDIO/`.

## Supabase
The bundled `supabase-config.json` points to the RT LAB Supabase project. `supabase-setup.sql` must have been executed in that project.

## Important
The Supabase anon public key is intended for browser use; database security must be enforced with RLS policies. Never put a Supabase service-role key in this repository.
