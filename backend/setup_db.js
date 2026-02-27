require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  try {
    console.log('Conectando ao MySQL...');
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE
    });

    console.log('✓ Conectado ao banco ' + process.env.MYSQL_DATABASE);

    const table = process.env.MYSQL_TABLE || 'products';
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS \`${table}\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        preco DECIMAL(10, 2) NOT NULL,
        descricao TEXT,
        create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await connection.query(createTableSQL);
    console.log(`✓ Tabela \`${table}\` criada/verificada!`);

    await connection.end();
    console.log('✓ Pronto!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
})();
