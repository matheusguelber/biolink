const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Initial default state fallback
const LOCAL_BACKUP_PATH = path.join(__dirname, 'profile.json');

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

app.post('/api/profile', async (req, res) => {
  try {
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

// Serve static frontend files
app.use(express.static(__dirname));

// Route all frontend routes to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 BioLink Server rodando na porta ${PORT}`);
  console.log(`🌐 Acesso Local: http://localhost:${PORT}`);
  console.log(`🔥 Firebase Sync: ${firebaseInitialized ? 'ATIVADO ✅' : 'DESATIVADO ❌'}`);
  console.log(`=========================================`);
});
