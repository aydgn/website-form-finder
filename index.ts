import axios from "axios";
const cheerio = require("cheerio");
import { resolve as resolveUrl } from "url";
import { getSitemap, shouldSkipLink } from "./helpers";

const startingUrl = "https://boztuggroup.com/";

const visitedUrls: Set<string> = new Set();
const urlsWithForms: Array<string> = [];

// Fetch and parse the page for forms and internal links
async function crawlPage(pageUrl: string, baseUrl: string): Promise<void> {
  if (visitedUrls.has(pageUrl)) return;

  visitedUrls.add(pageUrl);
  console.log(`🌐 Crawling: ${pageUrl}`);

  try {
    const { data: html } = await axios.get(pageUrl);
    const $ = cheerio.load(html);
    // Get all <form> elements on the current page
    const forms = $("form");

    if (forms.length > 0) {
      console.info(`✅ Form found on: ${pageUrl}`);
      urlsWithForms.push(pageUrl);
    }

    // Get all internal links on the current page
    const internalLinks: Array<string> = [];
    $("a[href]").each((_, link) => {
      const href = $(link).attr("href");
      const fullUrl = resolveUrl(baseUrl, href);
      // Skip non-HTML links and in-page links
      if (fullUrl.startsWith(baseUrl) && !visitedUrls.has(fullUrl) && !shouldSkipLink(href)) {
        internalLinks.push(fullUrl);
      }
    });

    // Recursively crawl internal links concurrently
    await Promise.all(internalLinks.map(link => crawlPage(link, baseUrl)));
  } catch (error) {
    console.error(`❌ Failed to crawl ${pageUrl}:`, (error as Error).message);
  }
}

(async () => {
  const baseUrl = new URL(startingUrl).origin;

  // Try to fetch pages from the sitemap.xml if it exists
  const pagesToCrawl = await getSitemap(baseUrl);

  // Start by crawling sitemap URLs (if any)
  if (pagesToCrawl.length > 0) {
    await Promise.all(pagesToCrawl.map(pageUrl => crawlPage(pageUrl, baseUrl)));
  }

  // After sitemap, crawl the starting URL and discover additional pages
  console.info("🔍 Crawling pages beyond the sitemap...");

  await crawlPage(startingUrl, baseUrl);

  // After crawling, output the final list of URLs with forms
  console.log("📝 Summary of URLs with forms:");

  if (urlsWithForms.length > 0) {
    urlsWithForms.forEach(url => console.log(`🔗 ${url}`));
  } else {
    console.error("❌ No forms were found on the website.");
  }
})();
