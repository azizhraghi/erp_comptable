# Implementation Plan: Reddit Top Posts Scraper

**Date:** 2026-05-16
**Subject:** Reddit Scraper

## Overview
This plan outlines the steps to build a Python-based Reddit scraper that fetches the top 3 posts from a specified subreddit using the JSON endpoint.

## Proposed Changes
- Create `reddit_scraper.py`: The main script logic.
- Create `test_scraper.py` (optional): For basic verification if needed.

## Step-by-Step Instructions
- [ ] **Step 1: Setup Environment**
  - Verify Python 3 is installed.
  - Install `requests` library if missing: `pip install requests`.
  - *Verification:* Run `python --version` and `pip show requests`.
- [ ] **Step 2: Implement Scraper Logic**
  - Create `reddit_scraper.py`.
  - Add logic to handle command-line arguments (subreddit name).
  - Add logic to fetch data from `https://www.reddit.com/r/{subreddit}/top/.json?limit=3`.
  - Include a custom `User-Agent` in headers.
  - *Verification:* Check if the script can print the raw JSON response.
- [ ] **Step 3: Parse and Format Output**
  - Extract `title` and `url` from the JSON response.
  - Print them in a numbered list.
  - *Verification:* Run `python reddit_scraper.py n8n` and check the output format.
- [ ] **Step 4: Error Handling**
  - Add `try-except` blocks for network errors or invalid subreddits.
  - *Verification:* Run `python reddit_scraper.py invalid_subreddit_name_xyz` and check for a graceful error message.

## Final Verification
- Run `python reddit_scraper.py n8n`.
- Confirm 3 posts are displayed with correct links.
