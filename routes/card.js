import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const router = express.Router();

/**
 * ดึงราคาจาก Card Kingdom
 */
async function getCardKingdomPrice(cardName) {
  const searchUrl = `https://www.cardkingdom.com/catalog/search?search=header&filter[name]=${encodeURIComponent(
    cardName
  )}`;

  try {
    const res = await axios.get(searchUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }, // สำคัญเพื่อหลีกเลี่ยง bot detection
    });

    const $ = cheerio.load(res.data);
    const product = $(".productDetail").first();

    const name = product.find(".productLink").text().trim();
    const price =
      product.find(".stylePrice").first().text().trim() ||
      product.find(".price").first().text().trim(); // fallback

    const url = product.find(".productLink").attr("href");

    if (!name || !url) return null;

    return {
      name,
      price: price || "ไม่พบราคา",
      url: "https://www.cardkingdom.com" + url,
    };
  } catch (err) {
    console.error("Card Kingdom scrape error:", err.message);
    return null;
  }
}


/**
 * ดึงข้อมูลการ์ดจาก Scryfall แบบ fuzzy
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
  } catch {
    return null;
  }
}

/**
 * 🔹 GET /api/card/suggest/:text
 * แนะนำชื่อการ์ด พร้อมรูป ราคา หมายเลข และประเภท
 */
router.get("/suggest/:text", async (req, res) => {
  const { text } = req.params;

  try {
    const response = await axios.get(
      `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(
        text
      )}`
    );
    const suggestions = response.data.data.slice(0, 5); // จำกัด 5 ใบ

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
    res.status(500).json({
      error: "เกิดข้อผิดพลาด",
      detail: error.message,
    });
  }
});

export default router;
