# بناء APK لتطبيق MrTik

## الطريقة السريعة: GitHub Actions (مجاني، لا يحتاج جهاز قوي)

### 1. إنشاء مستودع GitHub
```bash
# على جهازك، في PowerShell:
cd "C:\Users\pc 240gb\Desktop\mr-tik"
git init
git add .
git commit -m "Initial commit: MrTik offline video app"
```

### 2. إنشاء Repository على GitHub
- اذهب إلى: https://github.com/new
- اسم المستودع: `mr-tik`
- اجعله **Public** (مجاني) أو Private
- لا تضيف README أو .gitignore (لدينا بالفعل)

### 3. ربط المستودع المحلي بـ GitHub
```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mr-tik.git
git push -u origin main
```

### 4. إضافة EXPO_TOKEN في GitHub Secrets
1. احصل على توكن من: https://expo.dev/accounts/[username]/settings/access-tokens
2. اذهب إلى: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`
3. الاسم: `EXPO_TOKEN`
4. القيمة: التوكن الذي نسخته

### 5. تشغيل البناء
- اذهب لتبويب **Actions** في المستودع
- اختر **EAS Build APK**
- اضغط **Run workflow**
- اختر `preview` (للاختبار) أو `production` (للنشر)
- انتظر 5-15 دقيقة
- حمل الـ APK من **Artifacts**

---

## الطريقة المحلية (إذا كان لديك Android Studio)

```bash
cd "C:\Users\pc 240gb\Desktop\mr-tik"
npm install
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
# APK في: android/app/build/outputs/apk/release/app-release.apk
```

---

## متطلبات البناء المحلي
- Node.js 18+
- JDK 17
- Android SDK (API 34)
- Android NDK
- متغيرات بيئة: `ANDROID_HOME`، `JAVA_HOME`

---

## الملفات المضافة للبناء التلقائي

| الملف | الوصف |
|--------|-------|
| `.github/workflows/eas-build.yml` | GitHub Action الرئيسي لبناء APK |
| `.github/workflows/build-apk.yml` | Workflow بديل |
| `eas.json` | إعدادات EAS Build (preview = APK، production = AAB) |

---

## استكشاف الأخطاء

**خطأ: EXPO_TOKEN غير صالح**
- تأكد من إضافة التوكن في Secrets
- تأكد من أن الحساب لديه صلاحية بناء المشاريع

**خطأ: Gradle failed**
- تحقق من `eas.json` - profile `preview` يستخدم `apk` وليس `aab`
- راجع logs في GitHub Actions للتفاصيل

**البناء يعلق**
- المهلة الافتراضية: 45 دقيقة
- يمكن زيادتها في workflow إذا لزم الأمر