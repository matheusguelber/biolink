# 🚀 Math &bull; Slat.cc / Feds.lol BioLink Platform

Plataforma completa de Link-in-Bio personalizada inspirada no **slat.cc** e **feds.lol**, com suporte a mais de 200 molduras animadas oficiais do Discord, efeitos 3D tilt, visualizador de áudio, insígnias/badges oficiais e painel de controle protegido por senha.

---

## ✨ Funcionalidades

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

## 🐧 Como Hospedar no seu Servidor Ubuntu (Passo a Passo)

### Opção 1: Usando Nginx (Recomendado - Ultra Rápido)

1. **Clone o repositório no seu servidor**:
   ```bash
   sudo mkdir -p /var/www/biolink
   cd /var/www/biolink
   sudo git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git .
   ```

2. **Copie a configuração do Nginx**:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/biolink
   sudo ln -s /etc/nginx/sites-available/biolink /etc/nginx/sites-enabled/
   ```

3. **Teste e reinicie o Nginx**:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **(Opcional) Instale certificado SSL HTTPS grátis com Certbot**:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d seudominio.com -d www.seudominio.com
   ```

---

### Opção 2: Usando Docker (1 Comando)

Se você usa Docker no Ubuntu:
```bash
docker run -d -p 80:80 -v $(pwd):/usr/share/nginx/html --name biolink-math nginx:alpine
```

---

### Opção 3: Usando Python / PM2 em Segundo Plano

```bash
# Rodando direto na porta 80 ou 3000
python3 -m http.server 3000
```

---

## 🔐 Senha do Painel

- **Rota do Perfil Público**: `https://seudominio.com/` ou `https://seudominio.com/#math`
- **Rota do Dashboard**: `https://seudominio.com/#dashboard`
- **Senha Padrão Inicial**: `math123`
