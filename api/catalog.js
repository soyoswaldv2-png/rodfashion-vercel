javascript
import { put, head } from "@vercel/blob";

export default async function handler(req, res) {
  // Configuración universal de cabeceras CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Respuesta inmediata a peticiones pre-vuelo del navegador
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const BLOB_FILENAME = "catalog.json";

  try {
    // ========================================================
    // 1. GET: Clientes y visitantes consultan el catálogo
    // ========================================================
    if (req.method === "GET") {
      try {
        const fileInfo = await head(BLOB_FILENAME);
        // Se añade timestamp ?t= para evitar caché del navegador y obtener siempre la última versión
        const response = await fetch(`${fileInfo.url}?t=${Date.now()}`);
        const data = await response.json();
        return res.status(200).json(data);
      } catch (notFoundError) {
        // Valores iniciales si es la primera vez que se consulta
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

      // Validación de seguridad de credenciales
      if (token !== adminSecret) {
        return res.status(401).json({
          error: "No autorizado. Credencial de administrador inválida."
        });
      }

      // Procesar datos enviados desde el panel
      const body = req.body || {};
      const payload = {
        products: Array.isArray(body.products) ? body.products : [],
        exchangeRate: parseFloat(body.exchangeRate || body.rateBcv) || 42.50,
        whatsapp: (body.whatsapp || "584244126982").replace(/[^0-9]/g, ""),
        bannerText: body.bannerText || "ENVÍOS DIRECTOS USA ➔ VENEZUELA (AÉREO & MARÍTIMO) | CALZADO 100% ORIGINAL",
        updatedAt: new Date().toISOString()
      };

      // Guardar el archivo JSON de manera pública y persistente en Vercel Blob
      const blob = await put(BLOB_FILENAME, JSON.stringify(payload), {
        access: "public",
        addRandomSuffix: false
      });

      return res.status(200).json({
        success: true,
        message: "¡Catálogo guardado exitosamente en Vercel Blob!",
        url: blob.url,
        data: payload
      });
    }

    return res.status(405).json({ error: "Método HTTP no permitido" });
  } catch (error) {
    return res.status(500).json({
      error: "Error en el servicio Vercel Blob",
      details: error.message
    });
  }
}
