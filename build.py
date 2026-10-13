# Gera index.html a partir de src/index.src.html + src/template-pgm.json (rodar só se editar os fontes)
import json, pathlib
root = pathlib.Path(__file__).parent
tpl = json.loads((root/'src/template-pgm.json').read_text(encoding='utf-8'))
src = (root/'src/index.src.html').read_text(encoding='utf-8')
out = src.replace('/*__TEMPLATE__*/null', json.dumps(tpl, ensure_ascii=False).replace('</', '<\\/'))
(root/'index.html').write_text(out, encoding='utf-8')
print('index.html gerado', len(out), 'bytes')
