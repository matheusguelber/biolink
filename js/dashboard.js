/**
 * Dashboard Controller & Live Editor Logic
 */

import { stateManager } from './state.js?v=2.0.1';
import { AVATAR_DECORATIONS, getDecorationById } from './decorations.js?v=2.0.1';
import { SOCIAL_PLATFORMS, getPlatformById } from './platforms.js?v=2.0.1';
import { profileRenderer } from './profile.js?v=2.0.1';

export class DashboardController {
  constructor() {
    this.previewContainer = document.getElementById('livePreviewScreen');
    this.initEventListeners();
    this.syncFormWithState();
    this.renderLivePreview();
  }

  syncFormWithState() {
    const state = stateManager.getState();
    const { profile, appearance, audio } = state;

    // Profile Tab Inputs
    this.setInputValue('inputDisplayName', profile.displayName);
    this.setInputValue('inputBio', profile.bio);
    this.setInputValue('inputLocation', profile.location);
    this.setInputValue('inputAvatarUrl', profile.avatarUrl);
    this.setInputValue('inputBannerUrl', profile.bannerUrl);
    this.setInputValue('inputBgMediaUrl', profile.bgMediaUrl);
    this.setInputValue('inputBgTitle', profile.bgTitle || '');
    this.setInputValue('inputBgColor', profile.bgColor);
    this.setInputValue('inputCursorUrl', profile.cursorUrl || '');

    // Appearance Colors
    this.setColorPicker('themeColorBtn', 'themeColorInput', appearance.themeColor || '#ef4444');
    this.setColorPicker('cardBgColorBtn', 'cardBgColorInput', appearance.cardBgColor || '#12131a');
    this.setColorPicker('nameColorBtn', 'nameColorInput', appearance.nameColor || '#ffffff');
    this.setColorPicker('textColorBtn', 'textColorInput', appearance.textColor || '#ffffff');

    // Appearance Sliders
    const opacityVal = appearance.cardOpacity !== undefined ? Math.round(appearance.cardOpacity * 100) : 75;
    this.setInputValue('rangeCardOpacity', opacityVal);
    const labelOpacity = document.getElementById('labelCardOpacity');
    if (labelOpacity) labelOpacity.textContent = `${opacityVal}%`;

    const blurVal = appearance.cardBlur !== undefined ? appearance.cardBlur : 24;
    this.setInputValue('rangeCardBlur', blurVal);
    const labelBlur = document.getElementById('labelCardBlur');
    if (labelBlur) labelBlur.textContent = `${blurVal}px`;

    // Appearance Fonts
    this.setInputValue('selectNameFont', appearance.nameFont || 'Inter');
    this.setInputValue('selectTextFont', appearance.textFont || 'Cinzel');

    // Appearance Switches
    this.setCheckboxValue('switchAnimateViews', appearance.animateViews);
    this.setCheckboxValue('switchTiltingCard', appearance.tiltingCard);
    this.setCheckboxValue('switchGlowingIcons', appearance.glowingIcons);
    this.setCheckboxValue('switchAudioVisualizer', appearance.audioVisualizer);

    // Appearance Chips
    document.querySelectorAll('.name-effect-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.effect === (appearance.nameEffect || 'none'));
    });

    document.querySelectorAll('.page-overlay-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.overlay === (appearance.pageOverlay || 'none'));
    });

    // Decoration info text
    const currentDeco = getDecorationById(profile.avatarDecoration, profile.customDecoUrl);
    const decoNameEl = document.getElementById('currentDecoName');
    if (decoNameEl) decoNameEl.textContent = currentDeco.name;

    // Shape buttons active state
    document.querySelectorAll('.shape-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.shape === profile.avatarShape);
    });

    // Layout presets active state
    document.querySelectorAll('.layout-preset-card').forEach(card => {
      card.classList.toggle('active', card.dataset.layout === appearance.layout);
    });

    // Card style presets active state
    document.querySelectorAll('.style-preset-card').forEach(card => {
      card.classList.toggle('active', card.dataset.style === appearance.cardStyle);
    });

    // Audio Inputs
    this.setInputValue('inputAudioTitle', audio.title);
    this.setInputValue('inputAudioArtist', audio.artist);
    this.setInputValue('inputAudioUrl', audio.audioUrl);
    this.setInputValue('inputAudioCover', audio.coverArt);

    // Render Dynamic Lists
    this.renderLinksList();
    this.renderBadgesGrid();
    this.updateUserWidget(profile);
  }

  collectFormDataToState() {
    const getVal = (id, fallback = '') => {
      const el = document.getElementById(id);
      return (el && el.value !== undefined) ? el.value : fallback;
    };
    const getCheck = (id, fallback = false) => {
      const el = document.getElementById(id);
      return el ? el.checked : fallback;
    };

    const state = stateManager.getState();

    // Profile Fields
    state.profile.displayName = getVal('inputDisplayName', state.profile.displayName);
    state.profile.bio = getVal('inputBio', state.profile.bio);
    state.profile.location = getVal('inputLocation', state.profile.location);
    state.profile.avatarUrl = getVal('inputAvatarUrl', state.profile.avatarUrl);
    state.profile.bannerUrl = getVal('inputBannerUrl', state.profile.bannerUrl);
    state.profile.bgMediaUrl = getVal('inputBgMediaUrl', state.profile.bgMediaUrl);
    state.profile.bgTitle = getVal('inputBgTitle', state.profile.bgTitle);
    state.profile.bgColor = getVal('inputBgColor', state.profile.bgColor);
    state.profile.cursorUrl = getVal('inputCursorUrl', state.profile.cursorUrl);

    // Appearance Colors & Sliders
    state.appearance.themeColor = getVal('themeColorInput', state.appearance.themeColor);
    state.appearance.cardBgColor = getVal('cardBgColorInput', state.appearance.cardBgColor);
    state.appearance.nameColor = getVal('nameColorInput', state.appearance.nameColor);
    state.appearance.textColor = getVal('textColorInput', state.appearance.textColor);
    state.appearance.nameFont = getVal('selectNameFont', state.appearance.nameFont);
    state.appearance.textFont = getVal('selectTextFont', state.appearance.textFont);

    const rangeOpacity = document.getElementById('rangeCardOpacity');
    if (rangeOpacity) state.appearance.cardOpacity = parseInt(rangeOpacity.value, 10) / 100;

    const rangeBlur = document.getElementById('rangeCardBlur');
    if (rangeBlur) state.appearance.cardBlur = parseInt(rangeBlur.value, 10);

    state.appearance.animateViews = getCheck('switchAnimateViews', state.appearance.animateViews);
    state.appearance.tiltingCard = getCheck('switchTiltingCard', state.appearance.tiltingCard);
    state.appearance.glowingIcons = getCheck('switchGlowingIcons', state.appearance.glowingIcons);
    state.appearance.audioVisualizer = getCheck('switchAudioVisualizer', state.appearance.audioVisualizer);

    // Audio Fields
    state.audio.title = getVal('inputAudioTitle', state.audio.title);
    state.audio.artist = getVal('inputAudioArtist', state.audio.artist);
    state.audio.audioUrl = getVal('inputAudioUrl', state.audio.audioUrl);
    state.audio.coverArt = getVal('inputAudioCover', state.audio.coverArt);

    stateManager.saveState();
  }

  setInputValue(elementId, value) {
    const el = document.getElementById(elementId);
    if (el && value !== undefined) el.value = value;
  }

  setCheckboxValue(elementId, value) {
    const el = document.getElementById(elementId);
    if (el) el.checked = !!value;
  }

  setColorPicker(btnId, inputId, color) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (btn) btn.style.backgroundColor = color;
    if (input) input.value = color;
  }

  updateUserWidget(profile) {
    const nameEl = document.getElementById('widgetUserName');
    const avatarEl = document.getElementById('widgetUserAvatar');
    const urlEl = document.getElementById('widgetUserUrl');

    if (nameEl) nameEl.textContent = profile.displayName || 'Usuário';
    if (avatarEl) avatarEl.src = profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
    if (urlEl) urlEl.textContent = `slat.cc/${profile.username || 'math'}`;
  }

  renderLivePreview() {
    if (this.previewContainer) {
      profileRenderer.render(stateManager.getState(), this.previewContainer, true);
    }
  }

  initEventListeners() {
    // Top Tabs switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        this.switchTab(tabId);
      });
    });

    // Sidebar menu tabs switching
    document.querySelectorAll('.sidebar-item[data-tab]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab(item.dataset.tab);
      });
    });

    // Profile input bindings
    this.bindInput('inputDisplayName', (val) => stateManager.updateProfileField('displayName', val));
    this.bindInput('inputBio', (val) => stateManager.updateProfileField('bio', val));
    this.bindInput('inputLocation', (val) => stateManager.updateProfileField('location', val));
    this.bindInput('inputAvatarUrl', (val) => stateManager.updateProfileField('avatarUrl', val));
    this.bindInput('inputBannerUrl', (val) => stateManager.updateProfileField('bannerUrl', val));
    this.bindInput('inputBgMediaUrl', (val) => stateManager.updateProfileField('bgMediaUrl', val));
    this.bindInput('inputBgTitle', (val) => stateManager.updateProfileField('bgTitle', val));
    this.bindInput('inputBgColor', (val) => stateManager.updateProfileField('bgColor', val));
    this.bindInput('inputCursorUrl', (val) => stateManager.updateProfileField('cursorUrl', val));

    // Appearance Color Pickers
    this.bindColorPicker('themeColorBtn', 'themeColorInput', (val) => stateManager.updateAppearanceField('themeColor', val));
    this.bindColorPicker('cardBgColorBtn', 'cardBgColorInput', (val) => stateManager.updateAppearanceField('cardBgColor', val));
    this.bindColorPicker('nameColorBtn', 'nameColorInput', (val) => stateManager.updateAppearanceField('nameColor', val));
    this.bindColorPicker('textColorBtn', 'textColorInput', (val) => stateManager.updateAppearanceField('textColor', val));

    // Appearance Sliders
    const rangeOpacity = document.getElementById('rangeCardOpacity');
    const labelOpacity = document.getElementById('labelCardOpacity');
    if (rangeOpacity) {
      rangeOpacity.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (labelOpacity) labelOpacity.textContent = `${val}%`;
        stateManager.updateAppearanceField('cardOpacity', val / 100);
      });
    }

    const rangeBlur = document.getElementById('rangeCardBlur');
    const labelBlur = document.getElementById('labelCardBlur');
    if (rangeBlur) {
      rangeBlur.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (labelBlur) labelBlur.textContent = `${val}px`;
        stateManager.updateAppearanceField('cardBlur', val);
      });
    }

    // Appearance Font Selects
    this.bindInput('selectNameFont', (val) => stateManager.updateAppearanceField('nameFont', val));
    this.bindInput('selectTextFont', (val) => stateManager.updateAppearanceField('textFont', val));

    // Appearance Switches
    this.bindCheckbox('switchAnimateViews', (val) => stateManager.updateAppearanceField('animateViews', val));
    this.bindCheckbox('switchTiltingCard', (val) => stateManager.updateAppearanceField('tiltingCard', val));
    this.bindCheckbox('switchGlowingIcons', (val) => stateManager.updateAppearanceField('glowingIcons', val));
    this.bindCheckbox('switchAudioVisualizer', (val) => stateManager.updateAppearanceField('audioVisualizer', val));

    // Name Effect Chips
    document.querySelectorAll('.name-effect-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const effect = chip.dataset.effect;
        document.querySelectorAll('.name-effect-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        stateManager.updateAppearanceField('nameEffect', effect);
      });
    });

    // Page Overlay Chips
    document.querySelectorAll('.page-overlay-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const overlay = chip.dataset.overlay;
        document.querySelectorAll('.page-overlay-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        stateManager.updateAppearanceField('pageOverlay', overlay);
      });
    });

    // Audio input bindings
    this.bindInput('inputAudioTitle', (val) => stateManager.updateAudioField('title', val));
    this.bindInput('inputAudioArtist', (val) => stateManager.updateAudioField('artist', val));
    this.bindInput('inputAudioUrl', (val) => stateManager.updateAudioField('audioUrl', val));
    this.bindInput('inputAudioCover', (val) => stateManager.updateAudioField('coverArt', val));

    // File upload bindings
    this.bindFileUpload('fileAvatarInput', (dataUrl) => {
      stateManager.updateProfileField('avatarUrl', dataUrl);
      this.setInputValue('inputAvatarUrl', dataUrl);
    });

    this.bindFileUpload('fileBannerInput', (dataUrl) => {
      stateManager.updateProfileField('bannerUrl', dataUrl);
      this.setInputValue('inputBannerUrl', dataUrl);
    });

    this.bindFileUpload('fileBgMediaInput', (dataUrl) => {
      stateManager.updateProfileField('bgMediaUrl', dataUrl);
      this.setInputValue('inputBgMediaUrl', dataUrl);
    });

    // Avatar Shape buttons
    document.querySelectorAll('.shape-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const shape = btn.dataset.shape;
        document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        stateManager.updateProfileField('avatarShape', shape);
      });
    });

    // Layout presets
    document.querySelectorAll('.layout-preset-card').forEach(card => {
      card.addEventListener('click', () => {
        const layout = card.dataset.layout;
        document.querySelectorAll('.layout-preset-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        stateManager.updateAppearanceField('layout', layout);
      });
    });

    // Card style presets
    document.querySelectorAll('.style-preset-card').forEach(card => {
      card.addEventListener('click', () => {
        const style = card.dataset.style;
        document.querySelectorAll('.style-preset-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        stateManager.updateAppearanceField('cardStyle', style);
      });
    });

    // Modals
    this.initDecorationModal();
    this.initAddLinkModal();

    // Create Custom Badge button
    const btnCreateBadge = document.getElementById('btnCreateCustomBadge');
    if (btnCreateBadge) {
      btnCreateBadge.addEventListener('click', () => {
        const name = prompt('Nome do emblema:', 'Meu Emblema');
        if (name) {
          const icon = prompt('Ícone / Emoji do emblema:', '🔥') || '⭐';
          stateManager.addCustomBadge(name, icon);
          this.renderBadgesGrid();
        }
      });
    }

    // Manual Save to Cloud button
    const btnSaveToCloud = document.getElementById('btnSaveToCloud');
    if (btnSaveToCloud) {
      btnSaveToCloud.addEventListener('click', async () => {
        btnSaveToCloud.disabled = true;
        btnSaveToCloud.innerHTML = `<span>⏳ Salvando na nuvem...</span>`;
        
        // Collect all currently typed/selected form values into state
        this.collectFormDataToState();
        this.renderLivePreview();
        this.updateUserWidget(stateManager.getState().profile);

        const result = await stateManager.syncToServer();
        btnSaveToCloud.disabled = false;
        btnSaveToCloud.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          Salvar na Nuvem
        `;

        if (result && result.success) {
          alert('✅ Perfil salvo com sucesso na nuvem do Firebase!\n\nSuas alterações agora estão ativas para todos os visitantes e dispositivos.');
        } else {
          alert('⚠️ Erro ao salvar na nuvem:\n' + (result ? result.message : 'Falha de rede'));
        }
      });
    }

    // Export / Import
    const exportBtn = document.getElementById('exportJsonBtn');
    if (exportBtn) exportBtn.addEventListener('click', () => stateManager.exportJSON());

    const importInput = document.getElementById('importJsonInput');
    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const success = stateManager.importJSON(event.target.result);
            if (success) {
              this.syncFormWithState();
              alert('Configurações importadas com sucesso!');
            } else {
              alert('Arquivo JSON inválido.');
            }
          };
          reader.readAsText(file);
        }
      });
    }

    // Subscribe to state changes to refresh preview
    stateManager.subscribe(() => {
      this.renderLivePreview();
      this.updateUserWidget(stateManager.getState().profile);
    });

    // Subscribe to Cloud Sync status changes
    const pill = document.getElementById('cloudSyncStatusPill');
    const pillText = document.getElementById('cloudSyncStatusText');
    stateManager.onStatusChange((status, message) => {
      if (!pill || !pillText) return;
      pill.classList.remove('syncing', 'synced', 'error', 'offline');

      if (status === 'syncing') {
        pill.classList.add('syncing');
        pillText.textContent = message || 'Salvando na nuvem...';
      } else if (status === 'synced') {
        pill.classList.add('synced');
        pillText.textContent = message || 'Sincronizado na Nuvem';
      } else if (status === 'error') {
        pill.classList.add('error');
        pillText.textContent = message || 'Erro ao sincronizar';
      } else if (status === 'offline') {
        pill.classList.add('offline');
        pillText.textContent = message || 'Modo Local';
      } else {
        pillText.textContent = message || 'Firebase Conectado';
      }
    });
  }

  bindInput(elementId, callback) {
    const el = document.getElementById(elementId);
    if (el) {
      el.addEventListener('input', (e) => callback(e.target.value));
      el.addEventListener('change', (e) => callback(e.target.value));
    }
  }

  bindCheckbox(elementId, callback) {
    const el = document.getElementById(elementId);
    if (el) {
      el.addEventListener('change', (e) => callback(e.target.checked));
    }
  }

  bindColorPicker(btnId, inputId, callback) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (btn && input) {
      input.addEventListener('input', (e) => {
        const color = e.target.value;
        btn.style.backgroundColor = color;
        callback(color);
      });
    }
  }

  bindFileUpload(elementId, callback) {
    const el = document.getElementById(elementId);
    if (el) {
      el.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => callback(event.target.result);
          reader.readAsDataURL(file);
        }
      });
    }
  }

  switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    document.querySelectorAll('.sidebar-item[data-tab]').forEach(i => i.classList.toggle('active', i.dataset.tab === tabId));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tabId}`));
  }

  // Discord Decorations Modal
  initDecorationModal() {
    const modal = document.getElementById('modalDecorations');
    const openBtn = document.getElementById('btnOpenDecoModal');
    const removeBtn = document.getElementById('btnRemoveDeco');
    const closeBtn = document.getElementById('btnCloseDecoModal');
    const grid = document.getElementById('decorationsGrid');
    const inputCustomDecoUrl = document.getElementById('inputCustomDecoUrl');
    const btnApplyCustomDeco = document.getElementById('btnApplyCustomDeco');
    const inputSearchDeco = document.getElementById('inputSearchDeco');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        if (inputSearchDeco) inputSearchDeco.value = '';
        this.renderDecorationsGrid(grid, modal, '');
        if (inputCustomDecoUrl) {
          inputCustomDecoUrl.value = stateManager.getState().profile.customDecoUrl || '';
        }
        modal.classList.add('active');
      });
    }

    if (inputSearchDeco && grid) {
      inputSearchDeco.addEventListener('input', (e) => {
        this.renderDecorationsGrid(grid, modal, e.target.value.toLowerCase());
      });
    }

    if (btnApplyCustomDeco && inputCustomDecoUrl) {
      btnApplyCustomDeco.addEventListener('click', () => {
        const url = inputCustomDecoUrl.value.trim();
        if (url) {
          stateManager.updateProfileField('avatarDecoration', 'custom');
          stateManager.updateProfileField('customDecoUrl', url);
          const decoNameEl = document.getElementById('currentDecoName');
          if (decoNameEl) decoNameEl.textContent = 'Moldura Personalizada';
          modal.classList.remove('active');
        } else {
          alert('Por favor, cole o link da imagem da moldura.');
        }
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        stateManager.updateProfileField('avatarDecoration', 'none');
        stateManager.updateProfileField('customDecoUrl', '');
        const decoNameEl = document.getElementById('currentDecoName');
        if (decoNameEl) decoNameEl.textContent = 'Nenhuma Moldura';
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }
  }

  renderDecorationsGrid(gridElement, modal, query = '') {
    if (!gridElement) return;
    const currentDeco = stateManager.getState().profile.avatarDecoration;
    const avatarUrl = stateManager.getState().profile.avatarUrl;

    const filtered = AVATAR_DECORATIONS.filter(d => 
      d.name.toLowerCase().includes(query) || 
      (d.category && d.category.toLowerCase().includes(query)) ||
      (d.description && d.description.toLowerCase().includes(query))
    );

    if (filtered.length === 0) {
      gridElement.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.85rem;">
          Nenhuma moldura encontrada para "${query}".
        </div>
      `;
      return;
    }

    gridElement.innerHTML = filtered.map(deco => `
      <div class="deco-card-option ${deco.id === currentDeco ? 'active' : ''}" data-id="${deco.id}">
        <div class="deco-preview-avatar">
          <img src="${avatarUrl}" alt="${deco.name}" />
          ${deco.imgUrl ? `<img src="${deco.imgUrl}" class="avatar-decoration-overlay-img" onerror="this.style.display='none'" />` : ''}
          ${deco.className ? `<div class="avatar-decoration ${deco.className}"></div>` : ''}
        </div>
        <span class="deco-option-name">${deco.name}</span>
      </div>
    `).join('');

    gridElement.querySelectorAll('.deco-card-option').forEach(card => {
      card.addEventListener('click', () => {
        const decoId = card.dataset.id;
        stateManager.updateProfileField('avatarDecoration', decoId);
        stateManager.updateProfileField('customDecoUrl', '');
        const current = getDecorationById(decoId);
        const decoNameEl = document.getElementById('currentDecoName');
        if (decoNameEl) decoNameEl.textContent = current.name;
        modal.classList.remove('active');
      });
    });
  }

  // Add Link Modal with Form
  initAddLinkModal() {
    const modal = document.getElementById('modalAddLink');
    const openBtn = document.getElementById('btnOpenAddLinkModal');
    const closeBtn = document.getElementById('btnCloseAddLinkModal');
    const searchInput = document.getElementById('searchPlatformInput');
    const platformsGrid = document.getElementById('platformsGrid');
    const selectedPlatformBadge = document.getElementById('selectedPlatformBadge');
    const inputLinkTitle = document.getElementById('inputNewLinkTitle');
    const inputLinkUrl = document.getElementById('inputNewLinkUrl');
    const btnConfirmAddLink = document.getElementById('btnConfirmAddLink');

    let currentSelectedPlatform = 'instagram';

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        currentSelectedPlatform = 'instagram';
        this.renderPlatformsList(platformsGrid, (platform) => {
          currentSelectedPlatform = platform.id;
          if (selectedPlatformBadge) selectedPlatformBadge.textContent = platform.name;
          if (inputLinkTitle) inputLinkTitle.value = platform.name;
          if (inputLinkUrl) {
            inputLinkUrl.placeholder = platform.placeholder;
            inputLinkUrl.value = '';
            inputLinkUrl.focus();
          }
        }, '');
        
        const initialPlatform = getPlatformById('instagram');
        if (selectedPlatformBadge) selectedPlatformBadge.textContent = initialPlatform.name;
        if (inputLinkTitle) inputLinkTitle.value = initialPlatform.name;
        if (inputLinkUrl) inputLinkUrl.placeholder = initialPlatform.placeholder;

        modal.classList.add('active');
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }

    if (searchInput && platformsGrid) {
      searchInput.addEventListener('input', (e) => {
        this.renderPlatformsList(platformsGrid, (platform) => {
          currentSelectedPlatform = platform.id;
          if (selectedPlatformBadge) selectedPlatformBadge.textContent = platform.name;
          if (inputLinkTitle) inputLinkTitle.value = platform.name;
          if (inputLinkUrl) {
            inputLinkUrl.placeholder = platform.placeholder;
            inputLinkUrl.focus();
          }
        }, e.target.value.toLowerCase());
      });
    }

    if (btnConfirmAddLink) {
      btnConfirmAddLink.addEventListener('click', () => {
        const title = (inputLinkTitle && inputLinkTitle.value.trim()) || 'Link';
        const url = (inputLinkUrl && inputLinkUrl.value.trim());

        if (!url) {
          alert('Por favor, informe a URL ou link da rede social.');
          return;
        }

        stateManager.addLink({
          platform: currentSelectedPlatform,
          title: title,
          url: url
        });

        this.renderLinksList();
        modal.classList.remove('active');
      });
    }
  }

  renderPlatformsList(container, onSelect, query) {
    if (!container) return;
    const filtered = SOCIAL_PLATFORMS.filter(p => p.name.toLowerCase().includes(query));

    container.innerHTML = filtered.map(p => `
      <div class="platform-option-item" data-id="${p.id}">
        <span class="platform-option-icon" style="color: ${p.color};">${p.icon}</span>
        <span class="platform-option-name">${p.name}</span>
      </div>
    `).join('');

    container.querySelectorAll('.platform-option-item').forEach(item => {
      item.addEventListener('click', () => {
        const platform = getPlatformById(item.dataset.id);
        container.querySelectorAll('.platform-option-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        if (onSelect) onSelect(platform);
      });
    });
  }

  renderLinksList() {
    const listEl = document.getElementById('dashboardLinksList');
    if (!listEl) return;
    const links = stateManager.getState().links || [];

    if (links.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.85rem;">
          Nenhum link adicionado ainda. Clique em "+ Adicionar Link" acima.
        </div>
      `;
      return;
    }

    listEl.innerHTML = links.map(link => {
      const platform = getPlatformById(link.platform);
      return `
        <div class="link-item-row" data-id="${link.id}">
          <div class="link-item-left">
            <span class="link-drag-handle">⋮⋮</span>
            <div class="link-item-icon" style="color: ${platform.color};">
              ${platform.icon}
            </div>
            <div class="link-item-details">
              <span class="link-item-title">${link.title || platform.name}</span>
              <span class="link-item-url">${link.url}</span>
            </div>
          </div>
          <div class="link-item-actions">
            <button class="btn btn-danger btn-sm delete-link-btn" data-id="${link.id}">Remover</button>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.delete-link-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        stateManager.removeLink(btn.dataset.id);
        this.renderLinksList();
      });
    });
  }

  renderBadgesGrid() {
    const gridEl = document.getElementById('badgesSelectionGrid');
    if (!gridEl) return;
    const badges = stateManager.getState().badges || [];

    gridEl.innerHTML = badges.map(b => {
      let tagHtml = '';
      if (b.tag === 'limited') tagHtml = '<span class="badge-tag-pill badge-tag-limited">limited</span>';
      else if (b.tag === 'exclusive') tagHtml = '<span class="badge-tag-pill badge-tag-exclusive">exclusive</span>';
      else if (b.tag === 'custom') tagHtml = '<span class="badge-tag-pill badge-tag-custom">custom</span>';

      return `
        <div class="badge-card-row ${b.active ? 'active' : ''}" data-id="${b.id}">
          <div class="badge-card-left">
            <div class="badge-card-icon">${b.icon}</div>
            <div class="badge-card-info">
              <div class="badge-card-title-row">
                <span class="badge-card-name">${b.name}</span>
                ${tagHtml}
              </div>
              <span class="badge-card-desc" title="${b.description}">${b.description}</span>
            </div>
          </div>
          <button class="badge-equip-btn" data-id="${b.id}">
            ${b.active ? '✓ Ativo' : 'Equipar'}
          </button>
        </div>
      `;
    }).join('');

    // Attach single click listener to each card
    gridEl.querySelectorAll('.badge-card-row').forEach(card => {
      card.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const badgeId = card.dataset.id;
        if (badgeId) {
          stateManager.toggleBadge(badgeId);
          this.renderBadgesGrid();
        }
      };
    });
  }
}
