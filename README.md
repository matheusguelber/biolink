# 🚀 Math &bull; Slat.cc / Feds.lol BioLink Platform (com Firebase Cloud Sync)

Plataforma completa de Link-in-Bio personalizada inspirada no **slat.cc** e **feds.lol**, com suporte a mais de 200 molduras animadas oficiais do Discord, efeitos 3D tilt, visualizador de áudio, insígnias/badges oficiais, **persistência em nuvem com Firebase Firestore** e painel de controle protegido por senha.

---

## ✨ Funcionalidades

- **🔥 Firebase Firestore Cloud Sync**: Todas as alterações feitas no Dashboard são salvas na nuvem em tempo real e sincronizadas em qualquer dispositivo, computador ou celular!
- **🎭 +200 Molduras Oficiais do Discord**: Kitsune, Phoenix, Valorant, Arcane (Vi, Jinx, Hexcore), Street Fighter, Palworld, SpongeBob, Lofi Girl, Space, etc.
- **🎨 Customização Total de Cores e Vidro**: Fundo do cartão unificado (topo e base), slider de opacidade e efeito blur (*frosted glass*).
- **🅰️ Tipografia Avançada**: Fontes customizadas (Inter, Cinzel Gothic, JetBrains Mono, Montserrat, Outfit).
- **✨ Efeitos Especiais (Enhancements)**: Glow neon, Rainbow gradient, Glitch, Smoke/Blur, Retro CRT Scanlines, Vignette, Noise.
- **🔄 Cartão 3D Parallax Tilt**: Inclinação interativa realista seguindo o cursor do mouse.
- **💡 Glowing Icons**: Ícones das redes sociais brilhantes na cor do seu tema.
- **🎵 Player de Música & Visualizador Sonoro**: Autoplay com tela de entrada suave e barras de áudio animadas.
- **🏆 Sistema Completo de Badges**: Todas as insígnias oficiais (Staff, Verified, Donator, Booster, Early, Custom, OG, Event Winner, etc.).
- **🔒 Painel de Controle Protegido por Senha**: Visitantes acessam apenas a página pública (`/#math`); o painel de edição (`/#dashboard`) exige senha mestre.

---

## 🚀 Como Rodar o Servidor (Node.js + Firebase)

### 1. Instalar as dependências:
```bash
npm install
```

### 2. Iniciar o servidor:
```bash
npm start
```
O servidor iniciará em `http://localhost:3000` conectado ao Firebase Firestore (`biolink-f7521`).

---

## 🐧 Como Hospedar no Ubuntu Server com Nginx e PM2

### 1. Clonar e Instalar:
```bash
sudo mkdir -p /var/www/biolink
cd /var/www/biolink
sudo git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git .
npm install
```

### 2. Rodar com PM2 em Segundo Plano:
```bash
sudo npm install -g pm2
pm2 start server.js --name "biolink"
pm2 save
pm2 startup
```

### 3. Configurar o Nginx:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/biolink
sudo ln -s /etc/nginx/sites-available/biolink /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. (Opcional) Certificado SSL HTTPS Grátis:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d seudominio.com -d www.seudominio.com
```

---

## 🔐 Acesso e Senha do Painel

- **Rota do Perfil Público**: `https://seudominio.com/` ou `https://seudominio.com/#math`
- **Rota do Dashboard**: `https://seudominio.com/#dashboard`
- **Senha Padrão Inicial**: `math123`
