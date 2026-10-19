#!/bin/sh
# Copy only public assets; no dependencies, installs, or network access.
set -eu
mkdir -p _site/.well-known
cp index.html privacy.html terms.html 404.html _site/
cp -R images share _site/
cp .well-known/apple-app-site-association .well-known/assetlinks.json _site/.well-known/
