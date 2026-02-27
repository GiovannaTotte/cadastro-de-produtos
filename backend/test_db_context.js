require('dotenv').config();
const mysql = require('mysql2/promise');
(async ()=>{
  try{
    const conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE
    });

    const [dbRow] = await conn.query('SELECT DATABASE() AS db');
    console.log('Connected default database:', dbRow[0].db);

    const [tables] = await conn.query('SHOW TABLES');
    console.log('Tables in', process.env.MYSQL_DATABASE, ':', tables.length ? tables.map(r=>Object.values(r)[0]) : []);

    try{
      const curTable = process.env.MYSQL_TABLE || 'products';
      const [count] = await conn.query(`SELECT COUNT(*) AS c FROM \`${curTable}\``);
      console.log(`Count in ${curTable} table (current DB):`, count[0].c);
    }catch(e){
      console.log('Could not count products in current DB:', e.message);
    }

    // Check web_03mb if different
    if (process.env.MYSQL_DATABASE !== 'web_03mb'){
      try{
        const [tables2] = await conn.query("SHOW TABLES FROM web_03mb");
        console.log('Tables in web_03mb:', tables2.length ? tables2.map(r=>Object.values(r)[0]) : []);
        const [count2] = await conn.query('SELECT COUNT(*) AS c FROM web_03mb.products');
        console.log('Count in web_03mb.products:', count2[0].c);
      }catch(e){
        console.log('web_03mb access error:', e.message);
      }
    }

    await conn.end();
  }catch(err){
    console.error('Erro:', err.message);
    process.exit(1);
  }
})();
