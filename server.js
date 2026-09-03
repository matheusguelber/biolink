const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'math123';

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Initial default state fallback
const LOCAL_BACKUP_PATH = path.join(__dirname, 'profile.json');
const INDEX_HTML_PATH = path.join(__dirname, 'index.html');

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

  if (firebaseInitialized && db) {
    try {
      const docRef = db.collection('biolink_data').doc('profile_main');
      await docRef.set({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      savedToFirebase = true;
    } catch (e) {
      console.error('Erro ao salvar no Firestore:', e.message);
    }
  }

  // Also save locally as backup
  try {
    fs.writeFileSync(LOCAL_BACKUP_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Erro ao salvar profile.json backup:', e.message);
  }

  return { savedToFirebase };
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

// [FEATURE 4]: Discord / WhatsApp / Social Crawler OpenGraph Dynamic Injection
app.get('*', async (req, res) => {
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  const isCrawler = /bot|crawl|spider|facebookexternalhit|whatsapp|discordbot|slackbot|twitterbot|telegrambot/i.test(userAgent);

  if (isCrawler && fs.existsSync(INDEX_HTML_PATH)) {
    try {
      const profileData = await getProfileFromSource();
      let html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

      if (profileData && profileData.profile) {
        const title = `${profileData.profile.displayName || 'Math'} &bull; BioLink`;
        const desc = profileData.profile.bio || 'Visite meu perfil oficial, links e redes sociais.';
        const img = profileData.profile.avatarUrl || 'https://servidormatheus.com/favicon.ico';
        const color = profileData.appearance?.themeColor || '#ef4444';

        html = html
          .replace(/<title>.*?<\/title>/i, `<title>${title}</title>`)
          .replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${title}" />`)
          .replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${desc}" />`)
          .replace(/<meta property="og:image" content=".*?" \/>/i, `<meta property="og:image" content="${img}" />`)
          .replace(/<meta name="theme-color" content=".*?" \/>/i, `<meta name="theme-color" content="${color}" />`);
      }

      return res.send(html);
    } catch (e) {
      console.error('Erro ao injetar meta tags para bot:', e);
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
