import express from "express";
import axios from "axios";
import puppeteer from "puppeteer-core";

const router = express.Router();

/**
 * 🔍 ดึงราคาจาก Card Kingdom ด้วย puppeteer-core
 */
async function getCardKingdomPrice(cardName) {
  const searchUrl = `https://www.cardkingdom.com/shop/search?search=header&filter[name]=${encodeURIComponent(
    cardName
  )}`;

  // กำหนด path ของ chromium ที่ Render มีให้ หรือ path บนเครื่อง dev ของคุณ
  const executablePath =
    process.env.CHROMIUM_PATH || "/usr/bin/chromium-browser"; // หรือเปลี่ยนตาม environment ของคุณ

  let browser;

  try {
    browser = await puppeteer.launch({
      executablePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    );
    await page.goto(searchUrl, { waitUntil: "networkidle2" });

    // รอให้ element ที่ต้องการโหลด (itemContentWrapper) อย่างน้อย 1 ชิ้น
    await page.waitForSelector(".itemContentWrapper", { timeout: 5000 });

    // ดึงข้อมูลการ์ดชิ้นแรก
    const product = await page.$(".itemContentWrapper");

    if (!product) {
      return null;
    }

    const name = await product.$eval(".productDetails a", (el) =>
      el.textContent.trim()
    );
    const price = await product.$eval(".stylePrice", (el) =>
      el.textContent.trim()
    );
    const url = await product.$eval(".productDetails a", (el) =>
      el.getAttribute("href")
    );

    if (!name || !price || !url) return null;

    return {
      name,
      price,
      url: "https://www.cardkingdom.com" + url,
    };
  } catch (error) {
    console.error(
      "❌ Error fetching from Card Kingdom (puppeteer):",
      error.message
    );
    return null;
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * 🔸 ดึงข้อมูลการ์ดจาก Scryfall
 */
async function getCardDetails(cardName) {
  try {
    const res = await axios.get(
      `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(
        cardName
      )}`
    );
    const c = res.data;

    return {
      name: c.name,
      image: c.image_uris?.normal ?? null,
      collector_number: c.collector_number ?? null,
      finishes: [c.nonfoil ? "single" : null, c.foil ? "foil" : null].filter(
        Boolean
      ),
      scryfall_url: c.scryfall_uri,
    };
  } catch (err) {
    console.error("❌ Scryfall API error:", err.message);
    return null;
  }
}

/**
 * 🔹 GET /api/card/suggest/:text
 */
router.get("/suggest/:text", async (req, res) => {
  const { text } = req.params;

  try {
    const response = await axios.get(
      `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(
        text
      )}`
    );
    const suggestions = response.data.data.slice(0, 5);

    const enriched = await Promise.all(
      suggestions.map(async (name) => {
        const details = await getCardDetails(name);
        const priceInfo = await getCardKingdomPrice(name);

        return {
          name,
          image: details?.image ?? null,
          collector_number: details?.collector_number ?? null,
          finishes: details?.finishes ?? [],
          scryfall_url: details?.scryfall_url ?? null,
          cardkingdom_price: priceInfo?.price ?? "ไม่พบราคา",
          cardkingdom_url: priceInfo?.url ?? null,
        };
      })
    );

    res.json({ results: enriched });
  } catch (error) {
    console.error("❌ API Error:", error.message);
    res.status(500).json({
      error: "เกิดข้อผิดพลาด",
      detail: error.message,
    });
  }
});

export default router;
