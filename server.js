const express = require('express');
const cors = require('cors');
const path = require('path');
const ytdl = require('@distube/ytdl-core');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// API ดึงสตรีมเสียงตรงผ่าน Node.js Native Library
app.get('/api/stream', async (req, res) => {
  const videoId = req.query.id;
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: 'Invalid Video ID' });
  }

  try {
    const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // ดึงข้อมูลวิดีโอ
    const info = await ytdl.getInfo(ytUrl);
    
    // เลือกฟอร์แมตที่เป็น Audio Only คุณภาพดีที่สุด
    const format = ytdl.chooseFormat(info.formats, { 
      quality: 'highestaudio',
      filter: 'audioonly' 
    });

    if (!format || !format.url) {
      return res.status(500).json({ error: 'Audio stream format not found' });
    }

    // ส่ง Redirect ไปยัง Direct Audio Stream URL ทันที
    res.redirect(format.url);
  } catch (err) {
    console.error('ytdl-core error:', err.message);
    res.status(500).json({ error: 'Failed to extract stream' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`plamtube server running on port: ${PORT}`);
});
