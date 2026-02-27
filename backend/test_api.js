const http = require('http');

function req(method, path, body){
  return new Promise((resolve,reject)=>{
    const opts = { hostname: 'localhost', port: 3000, path, method, headers: { 'Content-Type':'application/json' } };
    const r = http.request(opts, res=>{
      let data='';
      res.on('data', c=>data+=c);
      res.on('end', ()=>{
        const ct = res.headers['content-type']||'';
        let parsed = data;
        if (ct.includes('application/json')){
          try{ parsed = JSON.parse(data); }catch(e){ parsed = data }
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

(async ()=>{
  console.log('POST /api/products -> creating product');
  const created = await req('POST','/api/products',{ nome:'TesteScript', preco: 19.9, descricao:'Criado por teste automático' });
  console.log('POST result:', created.status, created.body);

  console.log('\nGET /api/products -> list');
  const list = await req('GET','/api/products');
  console.log('GET result:', list.status);
  if (Array.isArray(list.body)) console.log('Total itens:', list.body.length);
  else console.log(list.body);

  const id = created.body && (created.body.id || created.body.ID || created.body.id);
  if (!id && Array.isArray(list.body) && list.body.length) {
    // try to pick first item
    id = list.body[0].id;
  }

  if (!id) {
    console.error('Não foi possível obter id do produto criado.');
    process.exit(1);
  }

  console.log('\nDELETE /api/products/' + id);
  const del = await req('DELETE','/api/products/' + id);
  console.log('DELETE result:', del.status, del.body);

  console.log('\nVerificando lista após delete');
  const after = await req('GET','/api/products');
  console.log('GET after:', after.status, Array.isArray(after.body) ? ('itens='+after.body.length) : after.body);

  process.exit(0);
})();
