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
  try {
    console.log('Testando conexão MySQL...\n');
    
    console.log('POST /api/products -> criando produto no MySQL');
    const created = await req('POST','/api/products',{ nome:'TesteMysql', preco: 89.9, descricao:'Criado via MySQL' });
    console.log('Status:', created.status);
    console.log('Body:', created.body);
    
    if (created.status !== 201) {
      console.error('❌ Erro ao criar produto!');
      process.exit(1);
    }
    
    console.log('\n✓ Produto criado no MySQL!');
    console.log('\nGET /api/products');
    const list = await req('GET','/api/products');
    console.log('Total de produtos:', Array.isArray(list.body) ? list.body.length : 0);
    
    process.exit(0);
  } catch(e) {
    console.error('❌ Erro:', e.message);
    process.exit(1);
  }
})();
