import express from "express";
import axios from "axios";
import puppeteer from "puppeteer-core";

const router = express.Router();

/**
 * 🔍 ดึงราคาจาก Card Kingdom ด้วย Puppeteer
 */
async function getCardKingdomPrice(cardName) {
  const searchUrl = `https://www.cardkingdom.com/catalog/search?search=header&filter[name]=${encodeURIComponent(
    cardName
  )}`;

  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser",
      headless: "new",
    });

    const page = await browser.newPage();
    await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 0 });

    const result = await page.evaluate(() => {
      const product = document.querySelector(".itemContentWrapper");
      if (!product) return null;

      const name = product
        .querySelector(".productDetails a")
        ?.textContent?.trim();
      const price = product.querySelector(".stylePrice")?.textContent?.trim();
      const url = product
        .querySelector(".productDetails a")
        ?.getAttribute("href");

      if (!name || !price || !url) return null;

      return {
        name,
        price,
        url: "https://www.cardkingdom.com" + url,
      };
    });

    await browser.close();
    return result || null;
  } catch (err) {
    console.error("❌ Puppeteer Error:", err.message);
    return null;
  }
}

/**
 * 🔸 ดึงข้อมูลจาก Scryfall
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
    console.error("❌ Scryfall API Error:", err.message);
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
