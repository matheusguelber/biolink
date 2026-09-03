/**
 * Public Profile & Live Preview Renderer
 */

import { getPlatformById } from './platforms.js';
import { getDecorationById } from './decorations.js';

function hexToRgba(hex, alpha = 0.75) {
  if (!hex) return `rgba(18, 19, 26, ${alpha})`;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(18, 19, 26, ${alpha})`;
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

class ProfileRenderer {
  constructor() {
    this.audioElement = null;
    this.isPlaying = false;
    this.isMuted = false;
  }

  initAudio() {
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.loop = true;
    }
  }

  render(state, containerElement, isPreview = false) {
    if (!containerElement) return;

    const { profile, appearance, badges, links, audio } = state;
    const decoration = getDecorationById(profile.avatarDecoration, profile.customDecoUrl);

    // Filter active badges and links
    const activeBadges = (badges || []).filter(b => b.active);
    const activeLinks = (links || []).filter(l => l.active);

    const layoutClass = `layout-${appearance.layout || 'floating-avatar'}`;
    const cardStyleClass = `card-style-${appearance.cardStyle || 'frosted-soft'}`;
    const shapeClass = `shape-${profile.avatarShape || 'circle'}`;
    const nameEffectClass = appearance.nameEffect && appearance.nameEffect !== 'none' ? `name-effect-${appearance.nameEffect}` : '';
    const glowingIconsClass = appearance.glowingIcons ? 'glowing-icons' : '';
    const overlayClass = appearance.pageOverlay && appearance.pageOverlay !== 'none' ? `page-overlay-${appearance.pageOverlay}` : '';

    // Compute Card Dynamic Colors & Glassmorphism
    const cardBgColor = appearance.cardBgColor || '#12131a';
    const cardOpacity = appearance.cardOpacity !== undefined ? appearance.cardOpacity : 0.75;
    const cardBlur = appearance.cardBlur !== undefined ? appearance.cardBlur : 24;
    const cardBorderColor = appearance.cardBorderColor || 'rgba(255, 255, 255, 0.12)';
    const cardSolidColorRgba = hexToRgba(cardBgColor, cardOpacity);

    // Apply Dynamic Theme Variables & Fonts
    containerElement.style.setProperty('--theme-color', appearance.themeColor || '#ef4444');
    containerElement.style.setProperty('--name-color', appearance.nameColor || '#ffffff');
    containerElement.style.setProperty('--text-color', appearance.textColor || '#ffffff');
    containerElement.style.setProperty('--card-bg-solid', cardSolidColorRgba);

    const cardCustomStyle = `
      background: ${cardSolidColorRgba} !important;
      backdrop-filter: blur(${cardBlur}px) !important;
      -webkit-backdrop-filter: blur(${cardBlur}px) !important;
      border-color: ${cardBorderColor} !important;
    `;

    const hasBannerImage = !!profile.bannerUrl;
    const bannerStyle = hasBannerImage ? `background-image: url('${profile.bannerUrl}');` : 'background: transparent;';
    const bannerClass = hasBannerImage ? 'has-image' : 'no-image';

    // Build Background Layer
    let bgContentHtml = '';
    if (profile.bgType === 'media' && profile.bgMediaUrl) {
      if (profile.bgMediaType === 'video') {
        bgContentHtml = `<video class="profile-bg-media" autoplay loop muted playsinline src="${profile.bgMediaUrl}"></video>`;
      } else {
        bgContentHtml = `<img class="profile-bg-media" src="${profile.bgMediaUrl}" alt="Background" />`;
      }
    } else {
      bgContentHtml = `<div class="profile-bg-media" style="background-color: ${profile.bgColor || '#070709'};"></div>`;
    }

    // Build Badges HTML
    const badgesHtml = activeBadges.map(b => `
      <span class="badge-item" title="${b.name}: ${b.description}">${b.icon}</span>
    `).join('');

    // Build Links HTML
    const linksHtml = activeLinks.map(link => {
      const platform = getPlatformById(link.platform);
      return `
        <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="social-link-btn" title="${link.title || platform.name}">
          ${platform.icon}
        </a>
      `;
    }).join('');

    // Build Audio Visualizer HTML
    const visualizerHtml = appearance.audioVisualizer ? `
      <div class="audio-visualizer-bars">
        <span class="viz-bar"></span>
        <span class="viz-bar"></span>
        <span class="viz-bar"></span>
        <span class="viz-bar"></span>
      </div>
    ` : '';

    // Build Audio Widget HTML
    const audioWidgetHtml = (audio && audio.enabled && audio.title) ? `
      <div class="profile-audio-widget">
        <div class="audio-cover-art">
          <img src="${audio.coverArt || profile.avatarUrl}" alt="Cover Art" />
        </div>
        <div class="audio-info">
          <div class="audio-track-title">${audio.title}</div>
          <div class="audio-artist-name">${audio.artist || profile.displayName}</div>
        </div>
        ${visualizerHtml}
        <div class="audio-controls">
          <button class="audio-play-btn" id="audioToggleBtn" title="Play / Pause Audio">
            <svg id="audioIconPlay" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            <svg id="audioIconPause" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display: none;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          </button>
        </div>
      </div>
    ` : '';

    containerElement.innerHTML = `
      ${overlayClass ? `<div class="${overlayClass}"></div>` : ''}

      <div class="profile-bg-layer">
        ${bgContentHtml}
        <div class="profile-bg-overlay"></div>
      </div>

      ${profile.bgTitle ? `<div class="profile-bg-text">${profile.bgTitle}</div>` : ''}

      <div class="profile-card-wrapper ${layoutClass} ${glowingIconsClass}" id="profileCardWrapper">
        <div class="profile-card ${cardStyleClass}" style="${cardCustomStyle}">
          
          <div class="card-banner ${bannerClass}" style="${bannerStyle}">
            <div class="views-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <span>${profile.views || 0}</span>
            </div>
          </div>

          <div class="card-body">
            <div class="avatar-wrapper ${shapeClass}">
              <img src="${profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}" 
                   alt="${profile.displayName}" 
                   class="profile-avatar-img" />
              ${decoration.imgUrl ? `<img src="${decoration.imgUrl}" class="avatar-decoration-overlay-img" alt="${decoration.name}" onerror="this.style.display='none'" />` : ''}
              ${decoration.className ? `<div class="avatar-decoration ${decoration.className}"></div>` : ''}
            </div>

            <h1 class="profile-name ${nameEffectClass}" style="font-family: '${appearance.nameFont || 'Inter'}', sans-serif;">
              ${profile.displayName || 'Nome'}
            </h1>

            ${activeBadges.length > 0 ? `<div class="profile-badges">${badgesHtml}</div>` : ''}

            ${profile.bio ? `<div class="profile-bio" style="font-family: '${appearance.textFont || 'Cinzel'}', serif;">${profile.bio}</div>` : ''}

            ${profile.location ? `
              <div class="profile-location">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                <span>${profile.location}</span>
              </div>
            ` : ''}

            ${activeLinks.length > 0 ? `
              <div class="profile-links-row">
                ${linksHtml}
              </div>
            ` : ''}
          </div>
        </div>

        ${audioWidgetHtml}
      </div>
    `;

    // 3D Tilting Card Effect
    if (appearance.tiltingCard) {
      this.attach3DTilt(containerElement);
    }

    // Apply custom cursor if defined
    if (profile.cursorUrl) {
      containerElement.style.cursor = `url('${profile.cursorUrl}'), auto`;
    } else {
      containerElement.style.cursor = 'default';
    }

    // Attach Audio Playback Events if in full mode
    if (!isPreview && audio && audio.enabled && audio.audioUrl) {
      this.setupAudioListeners(audio.audioUrl);
    }
  }

  attach3DTilt(container) {
    const cardWrapper = container.querySelector('#profileCardWrapper');
    if (!cardWrapper) return;

    container.onmousemove = (e) => {
      const rect = cardWrapper.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotateX = (-y / rect.height) * 16;
      const rotateY = (x / rect.width) * 16;
      cardWrapper.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    container.onmouseleave = () => {
      cardWrapper.style.transform = 'rotateX(0deg) rotateY(0deg)';
    };
  }

  setupAudioListeners(audioUrl) {
    this.initAudio();
    if (this.audioElement.src !== audioUrl) {
      this.audioElement.src = audioUrl;
    }

    const toggleBtn = document.getElementById('audioToggleBtn');
    const playIcon = document.getElementById('audioIconPlay');
    const pauseIcon = document.getElementById('audioIconPause');

    if (toggleBtn) {
      toggleBtn.onclick = (e) => {
        e.stopPropagation();
        this.togglePlay(playIcon, pauseIcon);
      };
    }
  }

  togglePlay(playIcon, pauseIcon) {
    if (!this.audioElement) return;

    if (this.audioElement.paused) {
      this.audioElement.play().then(() => {
        this.isPlaying = true;
        if (playIcon) playIcon.style.display = 'none';
        if (pauseIcon) pauseIcon.style.display = 'block';
      }).catch(err => console.log('Audio autoplay policy:', err));
    } else {
      this.audioElement.pause();
      this.isPlaying = false;
      if (playIcon) playIcon.style.display = 'block';
      if (pauseIcon) pauseIcon.style.display = 'none';
    }
  }

  startAudioOnEnter() {
    if (this.audioElement && this.audioElement.paused) {
      this.audioElement.play().catch(e => console.log('Audio play triggered'));
      this.isPlaying = true;
      const playIcon = document.getElementById('audioIconPlay');
      const pauseIcon = document.getElementById('audioIconPause');
      if (playIcon) playIcon.style.display = 'none';
      if (pauseIcon) pauseIcon.style.display = 'block';
    }
  }
}

export const profileRenderer = new ProfileRenderer();
