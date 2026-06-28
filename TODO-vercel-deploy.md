# TODO - Vercel’de yeni web+api linkini almak için

## Problem
- Vercel build sırasında `package.json` bulunamadı: `/vercel/path0/package.json` (root yanlış).

## Yapılacaklar
- [ ] Vercel’de doğru Project root seç:
  - Frontend için: `web/`
  - Backend için: monorepo tek projede yapılacaksa ya da ayrı projede `api/`.
- [ ] Build/Install komutlarını doğru ayarla:
  - `Install: npm install`
  - `Build: npm run build`
- [ ] Output directory: `dist`

## Tek URL hedefi (web+api)
- [ ] Monorepo tek proje (en kolay):
  - Vercel’de tek proje olarak ayarla (Project root repo root).
  - Root’ta install+build+api serverless için gerekli ayarlar gerekir.
- [ ] En kolayı çoğu zaman: web’i Vercel’de, api’yi ayrı (Railway/Render) tut.

## Sonuç
- [ ] Yeni oluşan linki burada paylaş.

