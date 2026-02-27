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
  const produtos = [
    { nome: 'Notebook Dell', preco: 3500.00, descricao: 'Notebook i7 com 16GB RAM' },
    { nome: 'Mouse Logitech', preco: 150.00, descricao: 'Mouse sem fio ergonômico' },
    { nome: 'Teclado Mecânico', preco: 450.00, descricao: 'Teclado RGB mecânico' },
    { nome: 'Monitor 24"', preco: 900.00, descricao: 'Monitor Full HD IPS' }
  ];

  console.log('Inserindo produtos...');
  for (const p of produtos) {
    const res = await req('POST','/api/products', p);
    console.log(`✓ ${p.nome} (id: ${res.body.id})`);
  }

  console.log('\nVerificando lista');
  const list = await req('GET','/api/products');
  console.log(`Total produtos: ${list.body.length}`);
  process.exit(0);
})();
