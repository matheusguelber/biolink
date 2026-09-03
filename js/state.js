/**
 * State Management & Persistence for BioLink App
 */

const STORAGE_KEY = 'biolink_user_profile_data_v1';

export const defaultBadgesCatalog = [
  { id: 'staff', name: 'Staff', icon: '🔨', tag: '', description: 'Part of the team.', active: false },
  { id: 'verified', name: 'Verified', icon: '🛡️', tag: '', description: 'Have 3k+ followers on a social media platform and active engagement.', active: false },
  { id: 'donator', name: 'Donator', icon: '🪙', tag: '', description: 'Donated to help support the development of the platform.', active: false },
  { id: 'booster', name: 'Booster', icon: '🚀', tag: '', description: 'Actively boosts our Discord server.', active: false },
  { id: 'early', name: 'Early', icon: '🗝️', tag: 'limited', description: 'Claimed the limited early badge after launch.', active: false },
  { id: 'candy', name: 'Candy Cane', icon: '🍬', tag: 'custom', description: 'Special candy badge.', active: true },
  { id: 'snowflake', name: 'Snowflake', icon: '❄️', tag: 'custom', description: 'Winter frosted badge.', active: true },
  { id: 'clover', name: 'Clover', icon: '🍀', tag: 'custom', description: 'Lucky shamrock badge.', active: true },
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
    bio: 'GO YOUR WAY AND LEAVE MINE',
    location: 'BRASIL',
    avatarUrl: 'https://i.pinimg.com/736x/39/3f/6c/393f6ca4c64750a673ecb94264a36786.jpg',
    avatarShape: 'circle',
    avatarDecoration: 'deco-water-feds',
    customDecoUrl: '',
    bannerUrl: 'https://cdn.xoa.me/uploads/809ee90a-aa38-4fec-9f2f-e89ae0385077.gif',
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
    cardStyle: 'frosted-soft',
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
      id: 'link_2',
      platform: 'discord',
      title: 'Discord',
      url: 'https://discord.com/users/mathezn',
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
    title: 'NOT FOUND',
    artist: 'Math',
    coverArt: 'https://cdn.xoa.me/uploads/809ee90a-aa38-4fec-9f2f-e89ae0385077.gif',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3'
  }
};

class StateManager {
  constructor() {
    this.state = this.loadState();
    this.listeners = [];
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        
        const existingBadgesMap = new Map((parsed.badges || []).map(b => [b.id, b.active]));
        const mergedBadges = defaultBadgesCatalog.map(b => ({
          ...b,
          active: existingBadgesMap.has(b.id) ? existingBadgesMap.get(b.id) : b.active
        }));

        return {
          ...defaultProfileState,
          ...parsed,
          appearance: { ...defaultProfileState.appearance, ...(parsed.appearance || {}) },
          badges: mergedBadges
        };
      }
    } catch (e) {
      console.warn('Erro ao carregar do localStorage:', e);
    }
    return JSON.parse(JSON.stringify(defaultProfileState));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Erro ao salvar no localStorage:', e);
    }
    this.notify();
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
      this.state = {
        ...defaultProfileState,
        ...parsed,
        appearance: { ...defaultProfileState.appearance, ...(parsed.appearance || {}) }
      };
      this.saveState();
      return true;
    } catch (e) {
      console.error('Falha ao importar JSON:', e);
      return false;
    }
  }
}

export const stateManager = new StateManager();
