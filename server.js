const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'math123';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initial default state fallback
const LOCAL_BACKUP_PATH = path.join(__dirname, 'profile.json');
const INDEX_HTML_PATH = path.join(__dirname, 'index.html');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (e) {
    console.error('Erro ao criar pasta uploads:', e.message);
  }
}

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR, {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));

// Helper to download any external URL (Discord, Imgur, Pinterest, etc) and cache locally in /uploads/
async function downloadAndCacheUrl(externalUrl, prefix = 'media') {
  if (!externalUrl || typeof externalUrl !== 'string') return externalUrl;
  const trimmed = externalUrl.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return externalUrl;
  }
  // Ignore Spotify links (Spotify uses embedded player instead of raw audio files)
  if (trimmed.includes('spotify.com') || trimmed.includes('spotify.link')) {
    return externalUrl;
  }
  // Ignore if already hosted locally
  if (trimmed.includes('/uploads/') || trimmed.startsWith('/uploads/')) {
    return externalUrl;
  }

  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(trimmed);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const req = client.get(trimmed, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*'
        }
      }, (res) => {
        // Handle redirects (301, 302, 307, 308)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return downloadAndCacheUrl(res.headers.location, prefix).then(resolve);
        }

        if (res.statusCode !== 200) {
          console.warn(`⚠️ Não foi possível baixar URL externa (${res.statusCode}):`, trimmed);
          return resolve(externalUrl);
        }

        const contentType = res.headers['content-type'] || '';
        const mimeExtMap = {
          'image/gif': '.gif',
          'image/png': '.png',
          'image/jpeg': '.jpg',
          'image/webp': '.webp',
          'image/svg+xml': '.svg',
          'video/mp4': '.mp4',
          'video/webm': '.webm',
          'audio/mpeg': '.mp3',
          'audio/mp3': '.mp3',
          'audio/wav': '.wav',
          'audio/ogg': '.ogg'
        };

        let ext = '';
        for (const mime in mimeExtMap) {
          if (contentType.includes(mime)) {
            ext = mimeExtMap[mime];
            break;
          }
        }

        if (!ext) {
          const pathname = parsedUrl.pathname;
          ext = path.extname(pathname) || '.gif';
        }

        const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${safePrefix}_${Date.now()}${ext}`;
        const destPath = path.join(UPLOADS_DIR, filename);

        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          try {
            const buffer = Buffer.concat(chunks);
            fs.writeFileSync(destPath, buffer);
            console.log(`💾 Link externo baixado e salvo localmente: ${trimmed.substring(0, 50)}... -> /uploads/${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
            resolve(`/uploads/${filename}`);
          } catch (writeErr) {
            console.error('Erro ao gravar arquivo baixado:', writeErr);
            resolve(externalUrl);
          }
        });
      });

      req.on('error', (err) => {
        console.warn('Erro ao conectar na URL para download:', err.message);
        resolve(externalUrl);
      });

      req.setTimeout(15000, () => {
        req.destroy();
        resolve(externalUrl);
      });
    } catch (e) {
      console.warn('URL inválida para download:', e.message);
      resolve(externalUrl);
    }
  });
}

// Download and cache all external links in the profile payload
async function downloadAndCacheAllFields(data) {
  if (!data || !data.profile) return data;
  const clone = JSON.parse(JSON.stringify(data));

  if (clone.profile.avatarUrl) {
    clone.profile.avatarUrl = await downloadAndCacheUrl(clone.profile.avatarUrl, 'avatar');
  }
  if (clone.profile.bgMediaUrl) {
    clone.profile.bgMediaUrl = await downloadAndCacheUrl(clone.profile.bgMediaUrl, 'background');
  }
  if (clone.profile.bannerUrl) {
    clone.profile.bannerUrl = await downloadAndCacheUrl(clone.profile.bannerUrl, 'banner');
  }
  if (clone.profile.customDecoUrl) {
    clone.profile.customDecoUrl = await downloadAndCacheUrl(clone.profile.customDecoUrl, 'deco');
  }
  if (clone.audio && clone.audio.audioUrl) {
    clone.audio.audioUrl = await downloadAndCacheUrl(clone.audio.audioUrl, 'audio');
  }
  if (clone.audio && clone.audio.coverArt) {
    clone.audio.coverArt = await downloadAndCacheUrl(clone.audio.coverArt, 'audiocover');
  }

  return clone;
}

// Helper to extract base64 strings and save to files to prevent Firestore 1MB limits
function sanitizePayloadAndExtractBase64(data) {
  if (!data) return data;
  const clone = JSON.parse(JSON.stringify(data));

  function processObj(obj) {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && obj[key].startsWith('data:')) {
        const matches = obj[key].match(/^data:([A-Za-z0-9-+/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          try {
            const buffer = Buffer.from(base64Data, 'base64');
            const mimeExtMap = {
              'image/jpeg': '.jpg',
              'image/png': '.png',
              'image/gif': '.gif',
              'image/webp': '.webp',
              'video/mp4': '.mp4',
              'video/webm': '.webm',
              'audio/mpeg': '.mp3',
              'audio/mp3': '.mp3',
              'audio/wav': '.wav'
            };
            const ext = mimeExtMap[mimeType] || '.png';
            const fileName = `auto_${key}_${Date.now()}${ext}`;
            fs.writeFileSync(path.join(UPLOADS_DIR, fileName), buffer);
            obj[key] = `/uploads/${fileName}`;
            console.log(`📁 Auto-convertido base64 de ${key} para /uploads/${fileName} (${(buffer.length / 1024).toFixed(1)} KB)`);
          } catch (err) {
            console.error(`Erro ao extrair base64 de ${key}:`, err.message);
          }
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        processObj(obj[key]);
      }
    }
  }

  processObj(clone);
  return clone;
}

// Initialize Firebase Admin
let db = null;
let firebaseInitialized = false;

try {
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    firebaseInitialized = true;
    console.log('🔥 Firebase Admin inicializado com sucesso para o projeto:', serviceAccount.project_id);
  } else {
    console.warn('⚠️ Arquivo serviceAccountKey.json não encontrado. Usando persistência local.');
  }
} catch (err) {
  console.error('❌ Erro ao inicializar Firebase Admin:', err.message);
}

// Helper to get profile data
async function getProfileFromSource() {
  if (firebaseInitialized && db) {
    try {
      const docRef = db.collection('biolink_data').doc('profile_main');
      const doc = await docRef.get();
      if (doc.exists) {
        return doc.data();
      }
    } catch (e) {
      console.error('Erro ao ler do Firestore:', e.message);
    }
  }

  // Fallback to local profile.json if Firestore fails or is empty
  if (fs.existsSync(LOCAL_BACKUP_PATH)) {
    try {
      const raw = fs.readFileSync(LOCAL_BACKUP_PATH, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('Erro ao ler profile.json local:', e.message);
    }
  }

  return null;
}

// Helper to save profile data
async function saveProfileToSource(data) {
  let savedToFirebase = false;
  // 1. Convert any base64
  let processedData = sanitizePayloadAndExtractBase64(data);
  // 2. Download and permanently cache external URLs (Discord, etc) to /uploads/
  processedData = await downloadAndCacheAllFields(processedData);

  if (firebaseInitialized && db) {
    try {
      const docRef = db.collection('biolink_data').doc('profile_main');
      await docRef.set({
        ...processedData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      savedToFirebase = true;
    } catch (e) {
      console.error('Erro ao salvar no Firestore:', e.message);
    }
  }

  // Also save locally as backup
  try {
    fs.writeFileSync(LOCAL_BACKUP_PATH, JSON.stringify(processedData, null, 2), 'utf8');
  } catch (e) {
    console.error('Erro ao salvar profile.json backup:', e.message);
  }

  return { savedToFirebase, data: processedData };
}

// No-cache middleware for HTML and JS
app.use((req, res, next) => {
  if (req.path.endsWith('.js') || req.path.endsWith('.html') || req.path === '/') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  }
  next();
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    firebase: firebaseInitialized,
    timestamp: new Date().toISOString()
  });
});

// [FEATURE]: Cache External URL to Local Uploads (Never lose expired Discord/external links!)
app.post('/api/cache-url', async (req, res) => {
  try {
    const { url, field } = req.body || {};
    if (!url) return res.status(400).json({ success: false, error: 'URL ausente' });

    const localUrl = await downloadAndCacheUrl(url, field || 'media');
    return res.json({
      success: true,
      originalUrl: url,
      localUrl: localUrl
    });
  } catch (err) {
    console.error('API /api/cache-url error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// [FEATURE]: File Upload Endpoint (PC local file -> /uploads/...)
app.post('/api/upload', (req, res) => {
  try {
    const { data, filename } = req.body || {};
    if (!data) {
      return res.status(400).json({ success: false, error: 'Nenhum dado de arquivo enviado.' });
    }

    const matches = data.match(/^data:([A-Za-z0-9-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, error: 'Formato de base64 inválido.' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Extension deduction
    const mimeExtMap = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'audio/mpeg': '.mp3',
      'audio/mp3': '.mp3',
      'audio/wav': '.wav',
      'audio/ogg': '.ogg'
    };

    let ext = mimeExtMap[mimeType];
    if (!ext && filename && path.extname(filename)) {
      ext = path.extname(filename);
    }
    if (!ext) ext = '.png';

    const safeBaseName = filename 
      ? path.basename(filename, path.extname(filename)).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)
      : 'upload';
    
    const uniqueFileName = `${safeBaseName}_${Date.now()}${ext}`;
    const filePath = path.join(UPLOADS_DIR, uniqueFileName);

    fs.writeFileSync(filePath, buffer);
    console.log(`📁 Upload concluído: ${uniqueFileName} (${(buffer.length / 1024).toFixed(1)} KB)`);

    return res.json({
      success: true,
      url: `/uploads/${uniqueFileName}`,
      filename: uniqueFileName
    });
  } catch (err) {
    console.error('API /api/upload error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/profile', async (req, res) => {
  try {
    const data = await getProfileFromSource();
    if (data) {
      return res.json({ success: true, data });
    }
    return res.json({ success: false, data: null, message: 'Nenhum perfil salvo no banco ainda.' });
  } catch (err) {
    console.error('API GET /profile error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// [FEATURE 2]: Password Protected Profile Save
app.post('/api/profile', async (req, res) => {
  try {
    const authHeader = req.headers['x-admin-password'] || (req.body && req.body.adminPassword);
    if (authHeader !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, error: 'Acesso não autorizado. Senha mestre incorreta.' });
    }

    const payload = req.body;
    if (!payload || !payload.profile) {
      return res.status(400).json({ success: false, error: 'Dados de perfil inválidos.' });
    }

    const result = await saveProfileToSource(payload);
    console.log(`✅ Perfil atualizado em ${new Date().toLocaleTimeString()} (Firebase: ${result.savedToFirebase})`);
    
    return res.json({
      success: true,
      savedToFirebase: result.savedToFirebase,
      data: result.data,
      message: result.savedToFirebase ? 'Salvo no Firebase Cloud com sucesso!' : 'Salvo localmente com sucesso!'
    });
  } catch (err) {
    console.error('API POST /profile error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// [FEATURE 3]: Real Views Increment
app.post('/api/view', async (req, res) => {
  try {
    let currentViews = 1;
    if (firebaseInitialized && db) {
      const docRef = db.collection('biolink_data').doc('profile_main');
      await docRef.set({
        profile: {
          views: admin.firestore.FieldValue.increment(1)
        }
      }, { merge: true });
      const snap = await docRef.get();
      currentViews = (snap.exists && snap.data()?.profile?.views) || 1;
    } else {
      // Local fallback
      const data = await getProfileFromSource() || {};
      data.profile = data.profile || {};
      data.profile.views = (data.profile.views || 0) + 1;
      currentViews = data.profile.views;
      await saveProfileToSource(data);
    }
    return res.json({ success: true, views: currentViews });
  } catch (err) {
    console.error('API /api/view error:', err.message);
    res.json({ success: false, error: err.message });
  }
});

// [FEATURE 5]: Link Click Tracker
app.post('/api/link-click', async (req, res) => {
  try {
    const { linkId } = req.body || {};
    if (!linkId) return res.status(400).json({ success: false, error: 'linkId ausente' });

    let clickCount = 1;
    if (firebaseInitialized && db) {
      const docRef = db.collection('biolink_data').doc('profile_main');
      await docRef.set({
        linkClicks: {
          [linkId]: admin.firestore.FieldValue.increment(1)
        }
      }, { merge: true });
      const snap = await docRef.get();
      clickCount = snap.data()?.linkClicks?.[linkId] || 1;
    } else {
      const data = await getProfileFromSource() || {};
      data.linkClicks = data.linkClicks || {};
      data.linkClicks[linkId] = (data.linkClicks[linkId] || 0) + 1;
      clickCount = data.linkClicks[linkId];
      await saveProfileToSource(data);
    }

    return res.json({ success: true, linkId, clicks: clickCount });
  } catch (err) {
    console.error('API /api/link-click error:', err.message);
    res.json({ success: false, error: err.message });
  }
});

// Serve static frontend files
app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.json')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    }
  }
}));

// [FEATURE 4]: 100% Dynamic OpenGraph & Meta Injection directly from Firebase
app.get('*', async (req, res) => {
  if (fs.existsSync(INDEX_HTML_PATH)) {
    try {
      const profileData = await getProfileFromSource();
      let html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

      if (profileData && profileData.profile) {
        const title = `${profileData.profile.displayName || 'Math'} &bull; BioLink`;
        const desc = profileData.profile.bio || 'Visite meu perfil oficial, links e redes sociais.';
        const img = profileData.profile.avatarUrl || profileData.profile.bgMediaUrl || '';
        const color = profileData.appearance?.themeColor || '#ef4444';

        html = html
          .replace(/<title>.*?<\/title>/i, `<title>${title}</title>`)
          .replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${title}" />`)
          .replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${desc}" />`)
          .replace(/<meta property="og:image" content=".*?" \/>/i, `<meta property="og:image" content="${img}" />`)
          .replace(/<meta property="twitter:image" content=".*?" \/>/i, `<meta property="twitter:image" content="${img}" />`)
          .replace(/<meta name="theme-color" content=".*?" \/>/i, `<meta name="theme-color" content="${color}" />`);

        return res.send(html);
      }
    } catch (e) {
      console.error('Erro ao injetar meta tags dinâmicas:', e);
    }
  }

  res.sendFile(INDEX_HTML_PATH);
});

// Start Server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 BioLink Server rodando na porta ${PORT}`);
  console.log(`🌐 Acesso Local: http://localhost:${PORT}`);
  console.log(`🔥 Firebase Sync: ${firebaseInitialized ? 'ATIVADO ✅' : 'DESATIVADO ❌'}`);
  console.log(`=========================================`);
});
