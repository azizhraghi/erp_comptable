# Design Spec: Reddit Top Posts Scraper

**Date:** 2026-05-16
**Subject:** Reddit Scraper

## Goals
- Create a Python script that takes a subreddit name as input.
- Fetch the top 3 posts (titles and links) from that subreddit.
- Display the results in a clean format in the terminal.
- Ensure the script is easy to run and doesn't require complex API setup.

## Non-Goals
- Full Reddit API integration (no PRAW unless necessary).
- Support for images/media (text/links only).
- Bypassing heavy anti-bot protections (we'll use standard headers).

## User Experience
1. The user runs the script: `python reddit_scraper.py n8n`.
2. The script displays:
   ```
   Top 3 posts in r/n8n:
   1. [Title] - [Link]
   2. [Title] - [Link]
   3. [Title] - [Link]
   ```

## Technical Architecture
- **Language:** Python 3.
- **Library:** `requests` for fetching data.
- **Method:** Access the `.json` endpoint of the subreddit (e.g., `https://www.reddit.com/r/{subreddit}/top/.json?t=day&limit=3`).
- **Headers:** Custom `User-Agent` to avoid being blocked by Reddit's basic filters.

## Verification Plan
1. Run the script for `r/n8n`.
2. Verify the output contains 3 valid titles and links.
3. Test with another subreddit (e.g., `r/python`).
