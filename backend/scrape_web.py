import requests
from bs4 import BeautifulSoup
import os
import time

output_path = "data/web_text.txt"

# the three sitemaps to scrape - filter_keyword means only grab urls containing that string
SITEMAPS = [
    {
        "url": "https://csds.gsu.edu/page-sitemap.xml",
        "label": "GSU CS Department",
        "filter_keyword": None
    },
    {
        "url": "https://csds.gsu.edu/profile-sitemap.xml",
        "label": "GSU CS Profiles",
        "filter_keyword": None
    },
    {
        "url": "https://cas.gsu.edu/bwl_advanced_faq-sitemap.xml",
        "label": "CAS FAQs",
        "filter_keyword": None
    },
    {
        "url": "https://cas.gsu.edu/product-sitemap.xml",
        "label": "CAS Computer Science Programs",
        "filter_keyword": "computer-science"
    },
    {
        "url": "https://cas.gsu.edu/profile-sitemap1.xml",
        "label": "CAS Profiles 1",
        "filter_keyword": None
    },
    {
        "url": "https://cas.gsu.edu/profile-sitemap2.xml",
        "label": "CAS Profiles 2",
        "filter_keyword": None
    },
]

def get_urls_from_sitemap(sitemap_url, filter_keyword=None):
    # fetch and parse the sitemap xml to extract page urls
    print(f"  Reading sitemap: {sitemap_url}")

    try:
        res = requests.get(sitemap_url, timeout=20)
        soup = BeautifulSoup(res.content, "xml")
        urls = [loc.text.strip() for loc in soup.find_all("loc")]

        # skip non-html file urls
        bad_exts = (".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".pdf", ".ico")
        urls = [u for u in urls if not u.lower().endswith(bad_exts)]

        if filter_keyword:
            urls = [u for u in urls if filter_keyword in u]
            print(f"  Filtered to {len(urls)} urls containing '{filter_keyword}'")
        else:
            print(f"  Found {len(urls)} urls")

        return urls

    except Exception as e:
        print(f"  Failed to read sitemap {sitemap_url}: {e}")
        return []

def scrape_page(url):
    # grab the main text content from a page, strip nav/footer/scripts
    try:
        res = requests.get(url, timeout=10)
        soup = BeautifulSoup(res.text, "html.parser")

        # remove elements that aren't useful content
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()

        # try to use the main content area first
        content = soup.find("main")
        if content is None:
            content = soup.find("article")
        if content is None:
            content = soup

        text = content.get_text(separator="\n", strip=True)

        # collapse excessive blank lines
        lines = [line for line in text.splitlines() if line.strip()]
        text = "\n".join(lines)

        # skip pages that are too short
        if len(text) < 200:
            return None
        if "JFIF" in text or "Exif" in text:
            return None
        if "{font-size:" in text or "/*" in text:
            return None

        return text
    except Exception as e:
        print(f"  Failed to scrape {url}: {e}")
        return None

def run_scraper():
    all_text = ""
    total_scraped = 0

    for sitemap in SITEMAPS:
        print(f"\nProcessing: {sitemap['label']}")
        urls = get_urls_from_sitemap(sitemap["url"], sitemap["filter_keyword"])

        for url in urls:
            print(f"  Scraping: {url}")
            text = scrape_page(url)
            if text:
                all_text += f"\n===== SOURCE: {sitemap['label']} =====\n"
                all_text += f"===== URL: {url} =====\n"
                all_text += text + "\n"
                total_scraped += 1
            # small delay for server
            time.sleep(0.5)

    os.makedirs("data", exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(all_text)

    print(f"\nDone. Scraped {total_scraped} pages. Saved to {output_path}")

if __name__ == "__main__":
    run_scraper()