// api/store.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('store_data')
      .select('data')
      .eq('id', 1)
      .single();

    if (error) {
      // Si todavía no existe la fila, no es un error grave: devolvemos vacío.
      return res.status(200).json({});
    }
    return res.status(200).json(data?.data || {});
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const { error } = await supabase
      .from('store_data')
      .upsert({ id: 1, data: body });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
