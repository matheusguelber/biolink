/**
 * Main Application Router, Security Lock & Entry Point
 */

import { stateManager } from './state.js';
import { profileRenderer } from './profile.js';
import { DashboardController } from './dashboard.js';

class App {
  constructor() {
    this.viewDashboard = document.getElementById('viewDashboard');
    this.viewPublicProfile = document.getElementById('viewPublicProfile');
    this.modalAuth = document.getElementById('modalAuth');
    this.publicContainer = document.getElementById('publicProfileContainer');
    this.clickOverlay = document.getElementById('clickToEnterOverlay');
    this.dashboardController = null;
    this.isAuthenticated = false;

    // Default password can be changed or stored in localStorage
    this.MASTER_PASSWORD = localStorage.getItem('biolink_admin_password') || 'math123';

    this.initRouting();
    this.initEventListeners();
    this.initClickSparks();

    // Re-render public profile whenever remote data arrives from Firebase
    stateManager.subscribe((state) => {
      if (this.viewPublicProfile && this.viewPublicProfile.style.display !== 'none') {
        profileRenderer.render(state, this.publicContainer, false);
      }
    });
  }

  initRouting() {
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
    this.handleRoute();
  }

  handleRoute() {
    const hash = window.location.hash.toLowerCase();

    if (hash === '#dashboard' || hash === '#admin' || hash === '#edit') {
      if (this.isAuthenticated) {
        this.showDashboard();
      } else {
        this.showAuthModal();
      }
    } else {
      // Default route for public visitors: root `/`, `/#math`, `/#profile`
      this.showPublicProfile();
    }
  }

  showAuthModal() {
    this.viewDashboard.style.display = 'none';
    this.viewPublicProfile.style.display = 'block';
    profileRenderer.render(stateManager.getState(), this.publicContainer, false);

    if (this.modalAuth) {
      this.modalAuth.classList.add('active');
      const inputPass = document.getElementById('inputAuthPassword');
      const authError = document.getElementById('authErrorMessage');
      if (authError) authError.style.display = 'none';
      if (inputPass) {
        inputPass.value = '';
        inputPass.focus();
      }
    }
  }

  showDashboard() {
    if (this.modalAuth) this.modalAuth.classList.remove('active');
    this.viewPublicProfile.style.display = 'none';
    this.viewDashboard.style.display = 'flex';

    if (profileRenderer.audioElement) {
      profileRenderer.audioElement.pause();
    }

    if (!this.dashboardController) {
      this.dashboardController = new DashboardController();
    } else {
      this.dashboardController.syncFormWithState();
      this.dashboardController.renderLivePreview();
    }
  }

  showPublicProfile() {
    if (this.modalAuth) this.modalAuth.classList.remove('active');
    this.viewDashboard.style.display = 'none';
    this.viewPublicProfile.style.display = 'block';

    const state = stateManager.getState();
    profileRenderer.render(state, this.publicContainer, false);

    // Setup click to enter overlay for sound autoplay
    if (this.clickOverlay) {
      this.clickOverlay.classList.remove('hidden');
    }
  }

  initEventListeners() {
    // Buttons to view public profile
    document.querySelectorAll('.btn-view-profile').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.hash = '#math';
      });
    });

    // Button to return to dashboard
    const btnBack = document.getElementById('btnBackToDashboard');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        window.location.hash = '#dashboard';
      });
    }

    // Discreet Admin Settings button in profile view
    const btnOpenAdmin = document.getElementById('btnOpenAdmin');
    if (btnOpenAdmin) {
      btnOpenAdmin.addEventListener('click', () => {
        window.location.hash = '#dashboard';
      });
    }

    // Auth Form submission
    const btnSubmitAuth = document.getElementById('btnSubmitAuth');
    const inputAuthPassword = document.getElementById('inputAuthPassword');
    const btnCloseAuthModal = document.getElementById('btnCloseAuthModal');
    const authError = document.getElementById('authErrorMessage');

    const handleLogin = () => {
      const entered = inputAuthPassword ? inputAuthPassword.value : '';
      if (entered === this.MASTER_PASSWORD) {
        this.isAuthenticated = true;
        if (authError) authError.style.display = 'none';
        this.showDashboard();
      } else {
        if (authError) {
          authError.textContent = 'Senha incorreta. Tente novamente.';
          authError.style.display = 'block';
        }
      }
    };

    if (btnSubmitAuth) btnSubmitAuth.addEventListener('click', handleLogin);
    if (inputAuthPassword) {
      inputAuthPassword.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleLogin();
      });
    }

    if (btnCloseAuthModal) {
      btnCloseAuthModal.addEventListener('click', () => {
        if (this.modalAuth) this.modalAuth.classList.remove('active');
        window.location.hash = '#math';
      });
    }

    // Click to Enter Overlay trigger
    if (this.clickOverlay) {
      this.clickOverlay.addEventListener('click', () => {
        this.clickOverlay.classList.add('hidden');
        profileRenderer.startAudioOnEnter();
      });
    }

    // Share Button
    const shareBtn = document.getElementById('btnShareProfile');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        const url = `${window.location.origin}/#math`;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(() => alert(`Link copiado: ${url}`));
        } else {
          prompt('Copie o link do seu perfil:', url);
        }
      });
    }

    // Mute/Unmute toggle
    const muteBtn = document.getElementById('btnMuteToggle');
    const iconUnmuted = document.getElementById('iconUnmuted');
    const iconMuted = document.getElementById('iconMuted');

    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        if (profileRenderer.audioElement) {
          profileRenderer.audioElement.muted = !profileRenderer.audioElement.muted;
          const isMuted = profileRenderer.audioElement.muted;
          if (iconUnmuted) iconUnmuted.style.display = isMuted ? 'none' : 'block';
          if (iconMuted) iconMuted.style.display = isMuted ? 'block' : 'none';
        }
      });
    }
  }

  initClickSparks() {
    document.addEventListener('click', (e) => {
      // Don't create sparks if clicking inside form controls
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(e.target.tagName)) return;

      const themeColor = stateManager.getState().appearance.themeColor || '#ef4444';
      const spark = document.createElement('div');
      spark.className = 'click-spark-particle';
      spark.style.left = `${e.clientX}px`;
      spark.style.top = `${e.clientY}px`;
      spark.style.borderColor = themeColor;
      document.body.appendChild(spark);

      setTimeout(() => spark.remove(), 600);
    });
  }
}

// Instantiate App
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
