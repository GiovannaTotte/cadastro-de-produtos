const express = require('express');
const path = require('path');
let mysqlPool = null;
try {
  const mysql = require('mysql2/promise');
  const { MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE } = process.env;
  if (MYSQL_HOST) {
    mysqlPool = mysql.createPool({
      host: MYSQL_HOST,
      port: MYSQL_PORT || 3306,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE || 'web_03mb',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('MySQL pool configured (host:', MYSQL_HOST + ')');
  }
} catch (e) {
  // mysql2 may not be installed yet; optional
}
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// If MySQL is configured (via env), backend will use it. Otherwise use in-memory store.
const products = [];

app.get('/api/products', async (req, res) => {
  const table = process.env.MYSQL_TABLE || 'products';
  if (mysqlPool) {
    try {
      const [rows] = await mysqlPool.query(`SELECT * FROM \`${table}\` ORDER BY id DESC`);
      return res.json(rows);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  res.json(products.slice().reverse());
});

app.post('/api/products', async (req, res) => {
  const { name, price, nome, preco, descricao } = req.body;
  const nomeProd = nome || name;
  const precoProd = preco || price;
  const descProd = descricao || '';
  if (!nomeProd || precoProd == null) return res.status(400).json({ error: 'Missing name or price' });
  if (mysqlPool) {
    try {
      const table = process.env.MYSQL_TABLE || 'products';
      const [result] = await mysqlPool.query(`INSERT INTO \`${table}\` (nome, preco, descricao) VALUES (?, ?, ?)`, [nomeProd, precoProd, descProd]);
      const [rows] = await mysqlPool.query(`SELECT * FROM \`${table}\` WHERE id = ?`, [result.insertId]);
      return res.status(201).json(rows[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  const id = products.length ? products[products.length - 1].id + 1 : 1;
  const item = { id, nome: nomeProd, preco: precoProd, descricao: descProd, create_time: new Date().toISOString() };
  products.push(item);
  res.status(201).json(item);
});

const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));

// Rota para deletar produto por ID
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const table = process.env.MYSQL_TABLE || 'products';

  if (mysqlPool) {
    try {
      // Deleta do Banco de Dados MySQL
      const [result] = await mysqlPool.query(`DELETE FROM \`${table}\` WHERE id = ?`, [id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Produto não encontrado no banco' });
      }
      return res.json({ message: 'Produto deletado do MySQL com sucesso!' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Fallback: Deleta do Array em memória (se não houver MySQL)
  const index = products.findIndex(p => p.id == id);
  if (index !== -1) {
    products.splice(index, 1);
    return res.json({ message: 'Produto deletado da memória com sucesso!' });
  } else {
    return res.status(404).json({ error: 'Produto não encontrado na memória' });
  }
});