#!/usr/bin/env bash
# exit on error
set -o errexit

# Install project dependencies
npm install

# Ensure Puppeteer cache directory exists
export PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
mkdir -p $PUPPETEER_CACHE_DIR

# Download and install Chrome for Testing matching the Puppeteer version
npx puppeteer browsers install chrome
