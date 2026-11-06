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
    // 1. ดึงข้อมูลวิดีโอเพื่อเลือกฟอร์แมตเสียงโดยตรง
    const info = await ytdl.getInfo(ytUrl);
    
    // เลือกฟอร์แมตเสียงแบบ MP4/M4A เพื่อให้เบราว์เซอร์เล่นได้ทันทีโดยไม่ต้องรอแปลง
    const format = ytdl.chooseFormat(info.formats, {
      quality: 'highestaudio',
      filter: (f) => f.container === 'mp4' && !f.hasVideo && f.hasAudio
    }) || ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });

    if (!format) {
      return res.status(404).send('Audio format not found');
    }

    // 2. ตั้งค่า Header สำหรับ Audio Streaming
    res.setHeader('Content-Type', format.mimeType || 'audio/mp4');
    res.setHeader('Accept-Ranges', 'bytes');

    // 3. ปล่อย Stream ข้อมูลตรงไปยังเครื่องผู้ใช้
    const stream = ytdl.downloadFromInfo(info, {
      format: format,
      highWaterMark: 1 << 20 // ขนาดบัฟเฟอร์เริ่มต้น 1MB ให้โหลดไว
    });

    stream.on('error', (err) => {
      console.error('ytdl stream error:', err.message);
      if (!res.headersSent) res.status(500).end();
    });

    stream.pipe(res);
  } catch (err) {
    console.error('Fetch error:', err.message);
    if (!res.headersSent) res.status(500).end();
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port: ${PORT}`);
});
