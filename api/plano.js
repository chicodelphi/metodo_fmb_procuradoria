// Função serverless (Vercel) OPCIONAL: análise do edital + prova com a API da Anthropic.
// Só fica ativa se a variável de ambiente ANTHROPIC_API_KEY estiver configurada no projeto.
// Sem a chave, o app funciona normalmente com a análise automática local (no navegador).

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';

const PROMPT = `Você organiza planos de estudo para concursos públicos brasileiros.
Recebe o texto do EDITAL (conteúdo programático) e, opcionalmente, o texto da ÚLTIMA PROVA.

Tarefa:
1. Extraia do edital TODAS as matérias (disciplinas) da prova, na ordem do edital, e os tópicos de cada uma,
   preservando a numeração/ordem do edital. Cada tópico: "title" curto (até ~12 palavras) e "subs" (subtópicos, frases curtas).
   Não invente conteúdo. Ignore regras do concurso, cronograma, vagas etc.
2. Se houver prova: conte quantas questões da prova pertencem a cada matéria ("questions") e marque "hot": true
   nos tópicos efetivamente cobrados. Se não houver prova, "questions": null.
3. "weight": número de questões da matéria na prova; sem prova, use o número de tópicos.
4. Se o edital trouxer a data da prova objetiva, devolva em "exam_date" (AAAA-MM-DD); senão null.

Responda SOMENTE com JSON válido, sem comentários, neste formato:
{"title":"Cargo · Órgão Ano","exam_name":"Prova Objetiva","exam_date":null,
 "subjects":[{"name":"Direito Administrativo","weight":15,"questions":15,
   "topics":[{"title":"...","subs":["...","..."],"hot":false}]}],
 "notes":"observações curtas (ex.: matérias sem questões identificadas)"}`;

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

async function readBody(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

const handler = async function handler(req, res) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (req.method === 'GET') return send(res, 200, { enabled: !!key });
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido' });
  if (!key) return send(res, 503, { error: 'Análise com IA não configurada (ANTHROPIC_API_KEY ausente).' });

  let body;
  try { body = await readBody(req); } catch (e) { return send(res, 400, { error: 'JSON inválido' }); }
  const edital = String(body.edital || '').slice(0, 180000);
  const prova = String(body.prova || '').slice(0, 120000);
  if (edital.length < 200) return send(res, 400, { error: 'Texto do edital muito curto.' });

  const user = `<edital>\n${edital}\n</edital>\n\n<prova>\n${prova || '(não enviada)'}\n</prova>`;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 16000, system: PROMPT, messages: [{ role: 'user', content: user }] }),
    });
    const j = await r.json();
    if (!r.ok) return send(res, 502, { error: (j.error && j.error.message) || 'Erro na API' });
    const text = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return send(res, 502, { error: 'Resposta sem JSON' });
    const data = JSON.parse(m[0]);
    if (!Array.isArray(data.subjects) || !data.subjects.length) return send(res, 502, { error: 'Nenhuma matéria identificada' });
    return send(res, 200, data);
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
};

module.exports = handler;
module.exports.config = { maxDuration: 60 };
