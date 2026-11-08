const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// API ค้นหาเพลง พร้อมระบบ Abort Timeout ป้องกันเซิร์ฟเวอร์ค้าง
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Missing search query' });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // หากเกิน 5 วินาทีให้ตัดทันที ไม่ปล่อยให้ค้าง

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'th,en-US;q=0.9,en;q=0.8'
      }
    });
    clearTimeout(timeoutId);

    const html = await response.text();
    const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    
    if (match && match[1]) {
      return res.json({ videoId: match[1] });
    }

    res.status(404).json({ error: 'Video not found' });
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('Search request failed or timed out:', err.message);
    res.status(500).json({ error: 'Search failed or timed out' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port: ${PORT}`);
});
