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
    console.log('Testando rotas GET e PUT...\n');

    // GET um produto que deve existir (id 1 ou 5)
    console.log('GET /api/products/1');
    const getRes = await req('GET', '/api/products/1');
    console.log('Status:', getRes.status);
    console.log('Produto original:', getRes.body);

    if (getRes.status !== 200) {
      console.log('❌ GET retornou erro!');
      process.exit(1);
    }

    console.log('\n✓ GET funcionando!');

    // PUT para atualizar o produto
    console.log('\nPUT /api/products/1 com dados atualizados');
    const updateRes = await req('PUT', '/api/products/1', {
      nome: 'ProdutoAtualizado',
      preco: 199.99,
      descricao: 'Descrição atualizada pelo teste'
    });
    console.log('Status:', updateRes.status);
    console.log('Produto atualizado:', updateRes.body);

    if (updateRes.status !== 200) {
      console.log('❌ PUT retornou erro!');
      process.exit(1);
    }

    console.log('\n✓ PUT funcionando!');

    // Verificar se dados foram realmente atualizados
    console.log('\nGET /api/products/1 para confirmar atualização');
    const checkRes = await req('GET', '/api/products/1');
    console.log('Produto após atualização:', checkRes.body);

    if (checkRes.body.nome === 'ProdutoAtualizado' && checkRes.body.preco == 199.99) {
      console.log('\n✓ Dados atualizados com sucesso no banco!');
    } else {
      console.log('\n❌ Dados não foram atualizados corretamente');
    }

    process.exit(0);
  } catch(e) {
    console.error('❌ Erro:', e.message);
    process.exit(1);
  }
})();
