const express = require('express');
const cors = require('cors');
const path = require('path');
const ytdl = require('@distube/ytdl-core');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/stream', async (req, res) => {
  const videoId = req.query.id;
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).send('Invalid Video ID');
  }

  const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    res.setHeader('Content-Type', 'audio/webm');
    res.setHeader('Accept-Ranges', 'bytes');

    // ดึง Audio Stream คุณภาพต่ำลงเล็กน้อยเพื่อความเร็วและลดการตรวจจับ
    const stream = ytdl(ytUrl, {
      filter: 'audioonly',
      quality: 'lowestaudio',
      highWaterMark: 1 << 23,
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      }
    });

    stream.on('error', (err) => {
      console.error('Stream Error:', err.message);
      if (!res.headersSent) {
        res.status(500).end();
      }
    });

    stream.pipe(res);
  } catch (err) {
    console.error('Server Catch Error:', err.message);
    if (!res.headersSent) {
      res.status(500).end();
    }
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port: ${PORT}`);
});
