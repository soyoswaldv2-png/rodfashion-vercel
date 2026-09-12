import { put, head } from "@vercel/blob";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    if (req.method === "GET") {
      try {
        const fileInfo = await head("catalog.json");
        const response = await fetch(fileInfo.url);
        const data = await response.json();
        return res.status(200).json(data);
      } catch (e) {
        return res.status(200).json({
          status: "default",
          products: [],
          exchangeRate: 42.50,
          whatsapp: "584244126982",
          updatedAt: new Date().toISOString()
        });
      }
    }

    if (req.method === "POST" || req.method === "PUT") {
      const authHeader = req.headers["authorization"] || "";
      const adminSecret = process.env.ADMIN_SECRET_KEY || "rodadmin2026";
      if (authHeader.replace("Bearer ", "").trim() !== adminSecret) {
        return res.status(401).json({ error: "No autorizado." });
      }

      const body = req.body || {};
      const payload = {
        products: body.products || [],
        exchangeRate: parseFloat(body.exchangeRate || body.rateBcv) || 42.50,
        whatsapp: (body.whatsapp || "584244126982").replace(/[^0-9]/g, ""),
        bannerText: body.bannerText || "ENVÍOS DIRECTOS USA ➔ VENEZUELA (AÉREO & MARÍTIMO) | CALZADO 100% ORIGINAL",
        updatedAt: new Date().toISOString()
      };

      await put("catalog.json", JSON.stringify(payload), {
        access: "public",
        addRandomSuffix: false
      });

      return res.status(200).json({ success: true, data: payload });
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}