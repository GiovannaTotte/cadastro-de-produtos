require('dotenv').config();
const express = require('express');
const path = require('path');
let mysqlPool = null;
let sqliteDb = null;
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
  // mysql2 may not be installed or cannot be loaded; will try sqlite fallback
}

// If MySQL isn't configured, try opening a local SQLite DB for persistence
try {
  const sqlite3 = require('sqlite3').verbose();
  const sqliteFile = process.env.SQLITE_FILE || path.join(__dirname, '..', 'data.db');
  sqliteDb = new sqlite3.Database(sqliteFile, (err) => {
    if (err) {
      console.error('Failed to open SQLite DB', err.message);
      sqliteDb = null;
      return;
    }
    console.log('SQLite DB opened at', sqliteFile);
    sqliteDb.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      preco REAL,
      descricao TEXT,
      create_time DATETIME DEFAULT (datetime('now','localtime'))
    )`);
  });
} catch (e) {
  // sqlite3 not available; we'll use in-memory store as last fallback
  sqliteDb = null;
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
  if (sqliteDb) {
    try {
      const rows = await new Promise((resolve, reject) => {
        sqliteDb.all(`SELECT * FROM products ORDER BY id DESC`, [], (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      });
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
  if (sqliteDb) {
    try {
      const created = await new Promise((resolve, reject) => {
        sqliteDb.run(`INSERT INTO products (nome, preco, descricao) VALUES (?, ?, ?)`, [nomeProd, precoProd, descProd], function (err) {
          if (err) return reject(err);
          const id = this.lastID;
          sqliteDb.get(`SELECT * FROM products WHERE id = ?`, [id], (e, row) => {
            if (e) return reject(e);
            resolve(row);
          });
        });
      });
      return res.status(201).json(created);
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

  if (sqliteDb) {
    try {
      const changes = await new Promise((resolve, reject) => {
        sqliteDb.run(`DELETE FROM products WHERE id = ?`, [id], function (err) {
          if (err) return reject(err);
          resolve(this.changes);
        });
      });
      if (changes === 0) return res.status(404).json({ error: 'Produto não encontrado no banco SQLite' });
      return res.json({ message: 'Produto deletado do SQLite com sucesso!' });
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