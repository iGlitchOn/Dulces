```markdown
# Dulces — Frontend + Backend + Scrapers

Estructura propuesta:
- frontend/ (Vite + React)
- backend/ (Express + Puppeteer scrapers)

Resumen
- Frontend: Vite, React, componente PriceTable.
- Backend: Express con endpoint GET /api/prices que ejecuta scrapers en paralelo (Dicoha y Mundo Dulces).
- Scrapers: Puppeteer con selectores heurísticos (NECESITAN ajuste según las páginas reales).

Requisitos
- Node.js 18+ (recomendado).
- Para Puppeteer: si ejecutas en Linux, instala dependencias de Chromium (por ejemplo, en Debian/Ubuntu: apt-get install -y gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libcups2 libxss1 libnspr4 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libgtk-3-0).
- (Opcional) GitHub CLI `gh` si quieres crear PRs desde terminal.

Instalación local
1. Clona el repo:
   git clone https://github.com/iGlitchOn/Dulces
   cd Dulces
2. Crea la rama:
   git checkout -b feature/frontend-and-scrapers
3. Instala dependencias backend:
   cd backend
   npm install
4. Instala dependencias frontend:
   cd ../frontend
   npm install
5. Ejecutar en desarrollo:
   - Backend: desde backend/: npm start
   - Frontend: desde frontend/: npm run dev
   Nota: frontend usa proxy relativo '/api/prices' — si necesitas CORS en distinto host, configura proxy o ajusta URL.

Precauciones legales / técnicas
- Revisa robots.txt y términos de uso de cada sitio antes de scraping:
  - dicoha: Disallow: /wp-admin/  Allow: /wp-admin/admin-ajax.php
  - mundodulces17: Disallow: /wp-content/uploads/... , Disallow: /wp-admin/ , Allow: /wp-admin/admin-ajax.php
- Añade caching y rate-limiting si vas a ejecutar scrapers frecuentemente.
- Considera usar solicitudes HTTP+cheerio si la página no requiere JS.
- Puppeteer requiere Chromium — en servidores sin GUI añade dependencias o usa puppeteer-core con chrome en el sistema.

Abrir Pull Request (local)
- Usando GitHub CLI:
  gh pr create --base main --head feature/frontend-and-scrapers --title "Add React frontend and Express backend + scrapers for Dicoha and Mundo Dulces" --body "PEGA_AQUI_EL_TEXTO_DEL_PR"
- O empuja la rama y abre el PR desde la UI de GitHub.

Workflow Opcional
- Incluyo un workflow que puede crear el PR automáticamente si lo prefieres (ver .github/workflows/open-pr.yml en el repo).

Notas finales
- Seleccionadores en backend/scrapers/*.js son heurísticos. Para resultados estables pásame URLs de productos específicos y los ajusto.
- No ejecutes scrapers a alta frecuencia hasta que añadas rate-limiting y caching.
```