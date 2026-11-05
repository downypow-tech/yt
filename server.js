const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// API สตรีมเสียงโดยตรงผ่าน yt-dlp
app.get('/api/stream', (req, res) => {
  const videoId = req.query.id;
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: 'Invalid Video ID' });
  }

  const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // ดึง Direct Audio Stream URL จาก YouTube
  const processYt = spawn('yt-dlp', [
    '-f', 'ba/b',
    '--no-playlist',
    '-g',
    ytUrl
  ]);

  let audioUrl = '';
  let errorMsg = '';

  processYt.stdout.on('data', (data) => {
    audioUrl += data.toString();
  });

  processYt.stderr.on('data', (data) => {
    errorMsg += data.toString();
  });

  processYt.on('close', (code) => {
    if (code !== 0 || !audioUrl.trim()) {
      console.error(`yt-dlp error: ${errorMsg}`);
      return res.status(500).json({ error: 'ไม่สามารถดึงเสียงได้ กรุณาตรวจสอบ yt-dlp ในเครื่อง' });
    }

    // ส่ง Redirect ไปยังไฟล์เสียงตรงๆ เพื่อให้แท็ก <audio> เล่นทันที
    res.redirect(audioUrl.trim());
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(` plamtube server running on port: ${PORT}`);
  console.log(` Local: http://localhost:${PORT}`);
  console.log(`=========================================`);
});