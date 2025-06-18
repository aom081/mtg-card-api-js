export default {
  openapi: "3.0.0",
  info: {
    title: "MTG Card Suggestion API",
    version: "1.0.0",
    description:
      "API สำหรับแนะนำชื่อการ์ด Magic: The Gathering พร้อมรูป ราคา หมายเลข และประเภทการ์ด",
  },
  paths: {
    "/api/card/suggest/{text}": {
      get: {
        summary:
          "แนะนำชื่อการ์ดแบบ autocomplete พร้อมรูป ราคา หมายเลข และประเภท",
        tags: ["Card"],
        parameters: [
          {
            name: "text",
            in: "path",
            required: true,
            description: "คำค้น เช่น lightning, bolt",
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          200: {
            description: "รายการชื่อการ์ดที่ใกล้เคียง พร้อมข้อมูลประกอบ",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    results: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: {
                            type: "string",
                            example: "Lightning Bolt",
                          },
                          image: {
                            type: "string",
                            format: "uri",
                            example:
                              "https://c1.scryfall.com/file/scryfall-cards/normal/front/2/9/297df0f6.jpg",
                          },
                          collector_number: {
                            type: "string",
                            example: "126",
                          },
                          finishes: {
                            type: "array",
                            items: {
                              type: "string",
                              enum: ["single", "foil"],
                            },
                            example: ["single", "foil"],
                          },
                          scryfall_url: {
                            type: "string",
                            format: "uri",
                            example:
                              "https://scryfall.com/card/m11/126/lightning-bolt",
                          },
                          cardkingdom_price: {
                            type: "string",
                            example: "$1.49",
                          },
                          cardkingdom_url: {
                            type: "string",
                            format: "uri",
                            example:
                              "https://www.cardkingdom.com/mtg/m11/lightning-bolt",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          500: {
            description: "เกิดข้อผิดพลาด",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "เกิดข้อผิดพลาด",
                    },
                    detail: {
                      type: "string",
                      example: "Scryfall API error",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
