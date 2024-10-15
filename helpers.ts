import axios from "axios";
import { parseStringPromise } from "xml2js";
import { nonHtmlExtensions } from "./constants";

export async function getSitemap(baseUrl: string): Promise<string[]> {
  try {
    const sitemapUrl = `${baseUrl}/sitemap.xml`;
    const response = await axios.get(sitemapUrl);
    const sitemap = await parseStringPromise(response.data);

    if (sitemap.urlset && sitemap.urlset.url) {
      console.log("🗺️  Sitemap found!");
      return sitemap.urlset.url.map((entry: any) => entry.loc[0]);
    }
  } catch (error) {
    console.log("❌ Sitemap not found.");
  }
  return [];
}


// Function to check if a link should be skipped (non-HTML, in-page link, mailto, or tel link)
export function shouldSkipLink(link: string): boolean {
  return link.startsWith("#") || link.startsWith("mailto:") || link.startsWith("tel:") || nonHtmlExtensions.some(ext => link.endsWith(ext));
}