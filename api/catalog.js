javascript
import { put, head } from "@vercel/blob";

export default async function handler(req, res) {
  // Configuración de cabeceras CORS universales
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Respuesta inmediata a peticiones preflight CORS
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const BLOB_FILENAME = "catalog.json";

  // Verificación de disponibilidad del token de Vercel Blob
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({
      error: "BLOB_TOKEN_MISSING",
      message: "Falta conectar Vercel Blob en: Vercel > Storage > tu Blob > Connected Projects > Connect Project."
    });
  }

  try {
    // ========================================================
    // 1. GET: Consulta de datos para clientes y visitantes
    // ========================================================
    if (req.method === "GET") {
      try {
        const fileInfo = await head(BLOB_FILENAME);
        // Evitar caché agregando timestamp
        const response = await fetch(`${fileInfo.url}?t=${Date.now()}`);
        const data = await response.json();
        return res.status(200).json(data);
      } catch (notFound) {
        // Estructura de respaldo si la base de datos es nueva
        return res.status(200).json({
          status: "default",
          products: [],
          exchangeRate: 42.50,
          whatsapp: "584244126982",
          bannerText: "ENVÍOS DIRECTOS USA ➔ VENEZUELA (AÉREO & MARÍTIMO) | CALZADO 100% ORIGINAL",
          updatedAt: new Date().toISOString()
        });
      }
    }

    // ========================================================
    // 2. POST / PUT: Guardar cambios desde el Panel de Admin
    // ========================================================
    if (req.method === "POST" || req.method === "PUT") {
      const authHeader = req.headers["authorization"] || "";
      const adminSecret = process.env.ADMIN_SECRET_KEY || "rodadmin2026";
      const token = authHeader.replace("Bearer ", "").trim();

      if (token !== adminSecret) {
        return res.status(401).json({
          error: "UNAUTHORIZED",
          message: "Credencial o contraseña de administrador inválida."
        });
      }

      const body = req.body || {};
      const payload = {
        products: Array.isArray(body.products) ? body.products : [],
        exchangeRate: parseFloat(body.exchangeRate || body.rateBcv) || 42.50,
        whatsapp: (body.whatsapp || "584244126982").replace(/[^0-9]/g, ""),
        bannerText: body.bannerText || "ENVÍOS DIRECTOS USA ➔ VENEZUELA (AÉREO & MARÍTIMO) | CALZADO 100% ORIGINAL",
        updatedAt: new Date().toISOString()
      };

      // Guardar en la nube pública de Vercel Blob
      const blob = await put(BLOB_FILENAME, JSON.stringify(payload), {
        access: "public",
        addRandomSuffix: false
      });

      return res.status(200).json({
        success: true,
        message: "¡Catálogo guardado con éxito en Vercel Blob!",
        url: blob.url,
        data: payload
      });
    }

    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

  } catch (error) {
    return res.status(500).json({
      error: "INTERNAL_BLOB_ERROR",
      details: error.message
    });
  }
}
