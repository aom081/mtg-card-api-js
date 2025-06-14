import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const router = express.Router();

/**
 * 🔍 ดึงราคาจาก Card Kingdom พร้อม debug HTML
 */
async function getCardKingdomPrice(cardName) {
  const searchUrl = `https://www.cardkingdom.com/shop/search?search=header&filter[name]=${encodeURIComponent(
    cardName
  )}`;

  try {
    const res = await axios.get(searchUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const html = res.data;
    const $ = cheerio.load(html);

    // 🔸 Debug ดูว่าโหลด HTML มาได้ไหม
    console.log("✅ HTML loaded. Showing first 500 characters:");
    console.log(html.slice(0, 500));

    // 🔸 Debug ดูว่ามี element ที่เราต้องการไหม
    const countItems = $(".itemContentWrapper").length;
    console.log("🔍 .itemContentWrapper found:", countItems);

    const product = $(".itemContentWrapper").first();
    const name = product.find(".productDetails a").text().trim();
    const price = product.find(".stylePrice").first().text().trim();
    const url = product.find(".productDetails a").attr("href");

    console.log("🎯 Fetched:", { name, price, url });

    if (!name || !price || !url) return null;

    return {
      name,
      price,
      url: "https://www.cardkingdom.com" + url,
    };
  } catch (err) {
    console.error("❌ Error fetching from Card Kingdom:", err.message);
    return null;
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
