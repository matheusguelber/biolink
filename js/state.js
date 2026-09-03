/**
 * State Management & Persistence for BioLink App
 * Includes LocalStorage Caching & Firebase Cloud Sync
 */

const STORAGE_KEY = 'biolink_user_profile_data_v1';

export const defaultBadgesCatalog = [
  { id: 'staff', name: 'Staff', icon: '🔨', tag: '', description: 'Part of the team.', active: true },
  { id: 'verified', name: 'Verified', icon: '🛡️', tag: '', description: 'Have 3k+ followers on a social media platform and active engagement.', active: false },
  { id: 'donator', name: 'Donator', icon: '🪙', tag: '', description: 'Donated to help support the development of the platform.', active: false },
  { id: 'booster', name: 'Booster', icon: '🚀', tag: '', description: 'Actively boosts our Discord server.', active: false },
  { id: 'early', name: 'Early', icon: '🗝️', tag: 'limited', description: 'Claimed the limited early badge after launch.', active: false },
  { id: 'candy', name: 'Candy Cane', icon: '🍬', tag: 'custom', description: 'Special candy badge.', active: false },
  { id: 'snowflake', name: 'Snowflake', icon: '❄️', tag: 'custom', description: 'Winter frosted badge.', active: false },
  { id: 'clover', name: 'Clover', icon: '🍀', tag: 'custom', description: 'Lucky shamrock badge.', active: false },
  { id: 'diamond', name: 'Diamond', icon: '💎', tag: 'custom', description: 'Sparkling diamond gemstone badge.', active: true },
  { id: 'event_winner', name: 'Event Winner', icon: '🏆', tag: '', description: 'Won an event hosted on the platform.', active: false },
  { id: 'innovator', name: 'Innovator', icon: '💡', tag: '', description: 'Suggested an innovative feature that improved the platform.', active: false },
  { id: 'partner', name: 'Partner', icon: '🤍', tag: '', description: 'Officially partnered member.', active: false },
  { id: 'trending', name: 'Trending', icon: '⭐', tag: '', description: 'Have 1k views on your profile.', active: false },
  { id: 'popular', name: 'Popular', icon: '🌟', tag: '', description: 'Have 5k views on your profile.', active: false },
  { id: 'famous', name: 'Famous', icon: '✨', tag: '', description: 'Achieved 10k views.', active: false },
  { id: 'inviter', name: 'Inviter', icon: '🍸', tag: '', description: 'Invited friends to the server.', active: false },
  { id: 'active', name: 'Active', icon: '⚡', tag: '', description: 'Active member in our community.', active: false },
  { id: 'gambler', name: 'Gambler', icon: '🎲', tag: '', description: 'Participated in the casino games.', active: false },
  { id: 'og', name: 'OG', icon: '🎖️', tag: 'exclusive', description: 'Joined our platform before 500 users.', active: false },
  { id: 'featured', name: 'Featured', icon: '🔥', tag: '', description: 'Featured on our official website.', active: false }
];

export const defaultProfileState = {
  profile: {
    username: 'math',
    displayName: 'Math',
    bio: 'EH ISSO AI',
    location: 'BRASIL',
    avatarUrl: 'https://i.pinimg.com/736x/39/3f/6c/393f6ca4c64750a673ecb94264a36786.jpg',
    avatarShape: 'circle',
    avatarDecoration: 'deco-santa_cat_ears',
    customDecoUrl: '',
    bannerUrl: '',
    bgType: 'media',
    bgMediaUrl: 'https://cdn.xoa.me/uploads/bbeadda3-43ab-4942-8af4-fcf7424ae2a1.gif',
    bgMediaType: 'image',
    bgColor: '#070709',
    bgTitle: 'THE END',
    cursorUrl: '',
    views: 132
  },
  appearance: {
    layout: 'floating-avatar',
    cardStyle: 'outlined',
    cardBgColor: '#12131a',
    cardOpacity: 0.75,
    cardBlur: 24,
    cardBorderColor: '',
    themeColor: '#ef4444',
    nameColor: '#ffffff',
    textColor: '#ffffff',
    nameFont: 'Inter',
    textFont: 'Cinzel',
    nameEffect: 'glow',
    bioEffect: 'none',
    pageOverlay: 'retro',
    cursorTrail: 'none',
    bgEffect: 'none',
    animateViews: true,
    tiltingCard: true,
    glowingIcons: true,
    audioVisualizer: true,
    glowColor: '#6366f1'
  },
  badges: defaultBadgesCatalog,
  links: [
    {
      id: 'link_1',
      platform: 'instagram',
      title: 'Instagram',
      url: 'https://instagram.com/mathguelber',
      customIcon: '',
      active: true
    },
    {
      id: 'link_3',
      platform: 'steam',
      title: 'Steam',
      url: 'https://steamcommunity.com/id/dlnalina',
      customIcon: '',
      active: true
    }
  ],
  audio: {
    enabled: true,
    autoplayOnEnter: true,
    title: 'MATH',
    artist: 'Math',
    coverArt: 'https://cdn.xoa.me/uploads/809ee90a-aa38-4fec-9f2f-e89ae0385077.gif',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3'
  }
};

class StateManager {
  constructor() {
    this.state = this.loadInitialCache();
    this.listeners = [];
    this.statusListeners = [];
    this.syncTimeout = null;
    this.cloudStatus = 'ready'; // 'ready' | 'syncing' | 'synced' | 'error' | 'offline'

    // Automatically sync with server/cloud
    this.fetchRemoteState();
  }

  loadInitialCache() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return this.mergeWithDefaults(parsed);
      }
    } catch (e) {
      console.warn('Erro ao carregar do localStorage:', e);
    }
    return JSON.parse(JSON.stringify(defaultProfileState));
  }

  mergeWithDefaults(parsed) {
    if (!parsed) return JSON.parse(JSON.stringify(defaultProfileState));
    
    const existingBadgesMap = new Map((parsed.badges || []).map(b => [b.id, b.active]));
    const mergedBadges = defaultBadgesCatalog.map(b => ({
      ...b,
      active: existingBadgesMap.has(b.id) ? existingBadgesMap.get(b.id) : b.active
    }));

    return {
      ...defaultProfileState,
      ...parsed,
      profile: { ...defaultProfileState.profile, ...(parsed.profile || {}) },
      appearance: { ...defaultProfileState.appearance, ...(parsed.appearance || {}) },
      audio: { ...defaultProfileState.audio, ...(parsed.audio || {}) },
      badges: mergedBadges,
      links: Array.isArray(parsed.links) ? parsed.links : defaultProfileState.links
    };
  }

  async fetchRemoteState() {
    try {
      this.setCloudStatus('syncing', 'Buscando configurações da nuvem...');
      
      // Try fetching from Node API endpoint first
      let response = await fetch('/api/profile').catch(() => null);

      if (response && response.ok) {
        const result = await response.json();
        if (result && result.success && result.data) {
          this.applyRemoteData(result.data);
          this.setCloudStatus('synced', 'Sincronizado com Firebase Cloud');
          return;
        } else if (localStorage.getItem(STORAGE_KEY)) {
          // Firebase is brand new/empty, initialize it with current client configuration
          console.log('Firebase vazio. Enviando configuração inicial local...');
          this.syncToServer();
          return;
        }
      }

      // Fallback: Try static profile.json if running as pure static files
      const staticRes = await fetch('./profile.json').catch(() => null);
      if (staticRes && staticRes.ok) {
        const staticData = await staticRes.json();
        if (staticData) {
          this.applyRemoteData(staticData);
          this.setCloudStatus('synced', 'Sincronizado com profile.json');
          return;
        }
      }

      this.setCloudStatus('ready', 'Pronto');
    } catch (err) {
      console.warn('Não foi possível conectar ao servidor de nuvem:', err.message);
      this.setCloudStatus('offline', 'Modo Local');
    }
  }

  applyRemoteData(remoteData) {
    const merged = this.mergeWithDefaults(remoteData);
    this.state = merged;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {}
    this.notify();
  }

  saveState() {
    // 1. Save locally immediately
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Erro ao salvar no localStorage:', e);
    }
    this.notify();

    // 2. Debounce push to Server / Firebase
    if (this.syncTimeout) clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(() => {
      this.syncToServer();
    }, 600);
  }

  async syncToServer() {
    this.setCloudStatus('syncing', 'Salvando no Firebase...');
    const adminPassword = localStorage.getItem('biolink_admin_password') || 'math123';
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify(this.state)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const msg = data.savedToFirebase ? 'Salvo no Firebase Cloud ✅' : 'Salvo no Servidor ✅';
          this.setCloudStatus('synced', msg);
          setTimeout(() => {
            if (this.cloudStatus === 'synced') {
              this.setCloudStatus('ready', 'Sincronizado');
            }
          }, 4000);
          return { success: true, message: msg };
        }
      }
      this.setCloudStatus('error', 'Erro ao salvar no servidor');
      return { success: false, message: 'Erro na resposta do servidor' };
    } catch (e) {
      console.warn('Falha na requisição para salvar no servidor:', e.message);
      this.setCloudStatus('offline', 'Salvo localmente (offline)');
      return { success: false, message: e.message };
    }
  }

  setCloudStatus(status, message = '') {
    this.cloudStatus = status;
    this.statusListeners.forEach(fn => fn(status, message));
  }

  onStatusChange(listener) {
    this.statusListeners.push(listener);
    listener(this.cloudStatus, '');
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  getState() {
    return this.state;
  }

  updateProfileField(field, value) {
    this.state.profile[field] = value;
    this.saveState();
  }

  updateAppearanceField(field, value) {
    this.state.appearance[field] = value;
    this.saveState();
  }

  updateAudioField(field, value) {
    this.state.audio[field] = value;
    this.saveState();
  }

  toggleBadge(badgeId) {
    const badge = this.state.badges.find(b => b.id === badgeId);
    if (badge) {
      badge.active = !badge.active;
      this.saveState();
    }
  }

  addCustomBadge(name, icon) {
    const newBadge = {
      id: 'custom_' + Date.now(),
      name: name || 'Custom',
      icon: icon || '⭐',
      tag: 'custom',
      description: 'Custom badge created by user.',
      active: true
    };
    this.state.badges.push(newBadge);
    this.saveState();
  }

  addLink(linkData) {
    const newLink = {
      id: 'link_' + Date.now(),
      platform: linkData.platform || 'custom',
      title: linkData.title || 'Link',
      url: linkData.url || '#',
      customIcon: linkData.customIcon || '',
      active: true
    };
    this.state.links.push(newLink);
    this.saveState();
  }

  removeLink(linkId) {
    this.state.links = this.state.links.filter(l => l.id !== linkId);
    this.saveState();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this.state));
  }

  exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${this.state.profile.username || 'profile'}_backup.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      this.state = this.mergeWithDefaults(parsed);
      this.saveState();
      return true;
    } catch (e) {
      console.error('Falha ao importar JSON:', e);
      return false;
    }
  }
}

export const stateManager = new StateManager();
