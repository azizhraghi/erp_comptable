import requests
import sys

def get_top_posts(subreddit, limit=3):
    url = f"https://www.reddit.com/r/{subreddit}/top/.json?limit={limit}"
    # Essential: Custom User-Agent to avoid being blocked by Reddit
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        posts = data['data']['children']
        if not posts:
            print(f"No posts found in r/{subreddit}.")
            return

        print(f"\nTop {len(posts)} posts in r/{subreddit}:")
        for i, post in enumerate(posts, 1):
            title = post['data']['title']
            permalink = post['data']['permalink']
            post_url = f"https://www.reddit.com{permalink}"
            print(f"{i}. {title}")
            print(f"   Link: {post_url}\n")
            
    except requests.exceptions.HTTPError as e:
        if response.status_code == 404:
            print(f"Error: Subreddit 'r/{subreddit}' not found.")
        elif response.status_code == 429:
            print("Error: Too many requests. Reddit is rate-limiting us.")
        else:
            print(f"HTTP Error: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python reddit_scraper.py <subreddit_name>")
        sys.exit(1)
    
    sub = sys.argv[1]
    get_top_posts(sub)
