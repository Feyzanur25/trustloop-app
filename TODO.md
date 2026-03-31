# TrustLoop Level 6 Hazırlık TODO

## Plan Onaylandı - Adım Adım İlerleme

### 1. Doküman Güncellemeleri (Demo Verilerle) ✅
- [x] README.md güncelle (wallet listesi, link talimatları)
- [x] docs/onboarding-template.csv genişlet (30+ örnek satır)
- [x] docs/google-form-template.md cilala
- [x] docs/improvement-roadmap.md güncelle
- [x] docs/level6-submission.md işaretle

### 2. CI/CD Düzeltmeleri ✅
- [x] Web lint hataları düzeltildi (5 no-unused-vars)
- [x] npm run lint temiz (0 errors)
- [ ] Git push ile CI test et

### 3. Kullanıcı Manuel Adımları
- [ ] Gerçek Google Form oluştur (TALİMATLAR: https://forms.google.com > şablonu kopyala > link al > paylaş)
- [ ] 30+ kullanıcıdan yanıt topla (form paylaş)
- [ ] Responses'u CSV/Excel export et (Google Sheet otomatik)
- [ ] README.md'ye form/Excel linklerini ekle (link ver bana ekleyeyim)
- [ ] 30+ gerçek wallet adresi listele (Stellar Explorer doğrula)

### 4. Test & Demo
- [ ] `docker-compose up` - Onboarding sayfası test et (form doldur, CSV export)
- [ ] Metrics/Monitoring dashboard'ları kontrol et

### 5. Deployment & Kanıt
- [ ] Proje deploy et (DEPLOYMENT.md takip et)
- [ ] Deploy linklerini README ekle
- [ ] Screenshot'lar ekle (/metrics, /monitoring, /onboarding)

### 6. Community & Commit
- [ ] Community post yap (docs/community-post-template.md kullan)
- [ ] Post linkini README ekle
- [ ] Değişiklikleri `git add . && git commit -m "Level 6 docs & demo data"` 
- [ ] 15+ anlamlı commit sağla

### 7. Tamamlama
- [ ] Tüm yer tutucuları doldur
- [ ] Submission hazırla (docs/level6-submission.md)

**İlerleme: Lint fix ✅. Sonraki: docker-compose test → Google Form → Deploy**

