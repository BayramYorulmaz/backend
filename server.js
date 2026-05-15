const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');

app.use(cors());
app.use(bodyParser.json());

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(LEADERBOARD_FILE);
    } catch {
      const initialData = [
        { name: 'Ahmet', score: 850, date: new Date().toISOString() },
        { name: 'Fatma', score: 920, date: new Date().toISOString() },
        { name: 'Mehmet', score: 780, date: new Date().toISOString() },
      ];
      await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(initialData, null, 2));
    }
  } catch (err) {
    console.error('Data file setup error:', err);
  }
}

async function readLeaderboard() {
  try {
    const txt = await fs.readFile(LEADERBOARD_FILE, 'utf8');
    return JSON.parse(txt || '[]');
  } catch (err) {
    console.error('Read error', err);
    return [];
  }
}

async function writeLeaderboard(list) {
  try {
    await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(list, null, 2));
  } catch (err) {
    console.error('Write error', err);
  }
}

app.get('/leaderboard', async (req, res) => {
  const by = String(req.query.by || 'score');
  const order = String(req.query.order || 'desc');

  const list = await readLeaderboard();

  const compare = (a, b) => {
    if (by === 'name') {
      const cmp = String(a.name).localeCompare(String(b.name));
      return order === 'asc' ? cmp : -cmp;
    }
    if (by === 'date') {
      const da = new Date(a.date || 0).getTime();
      const db = new Date(b.date || 0).getTime();
      return order === 'asc' ? da - db : db - da;
    }
    return order === 'asc' ? a.score - b.score : b.score - a.score;
  };

  list.sort(compare);
  res.json(list);
});

app.post('/score', async (req, res) => {
  const { name, score } = req.body;
  if (typeof name !== 'string' || typeof score !== 'number') {
    return res.status(400).json({ message: 'Invalid payload. Expect { name: string, score: number }' });
  }
  
  const list = await readLeaderboard();
  list.push({ name: name.trim(), score, date: new Date().toISOString() });
  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, 100);
  
  await writeLeaderboard(trimmed);
  res.status(201).json(trimmed);
});

app.delete('/leaderboard', async (req, res) => {
  await writeLeaderboard([]);
  res.status(204).send();
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

ensureDataFile().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Leaderboard server listening on port ${PORT}`);
    console.log(`📊 GET http://localhost:${PORT}/leaderboard`);
    console.log(`📝 POST http://localhost:${PORT}/score`);
  });
});