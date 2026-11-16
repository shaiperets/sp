#!/usr/bin/env bash
# Copies only the public site files into _site/ for preview, Lighthouse and deploy.
set -euo pipefail

cd "$(dirname "$0")/.."
rm -rf _site
mkdir -p _site
cp index.html _site/
cp -R css js assets _site/
touch _site/.nojekyll
echo "Site assembled in _site/ ($(du -sh _site | cut -f1))"
