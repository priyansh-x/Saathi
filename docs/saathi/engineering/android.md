# Android app (Capacitor shell)

The APK is a thin native shell. It opens the hosted family desk (`SAATHI_APP_URL`) full screen. The Next.js app is not bundled as static files.

Do not publish to Play Store. Do not create a Play Console listing. Mocks stay on.

## What you need to build

- Node (same as the family app) and this repo.
- **JDK 21** for CI (`actions/setup-java`). Locally 17 or 21 both work with this Gradle.
- **Android SDK**: cmdline-tools, platform 35 (Capacitor 8 also compiles against 36), build-tools.
- `ANDROID_HOME` / `ANDROID_SDK_ROOT` pointed at that SDK.
- `SAATHI_APP_URL` — `https://…` hosted family origin. `npm run android:apk` refuses localhost or plain http unless you pass `--dev` (sets `CAP_DEV=1`; `npx cap sync --dev` is rejected by the CLI). That allows `http://10.0.2.2:43147` for the emulator.

```bash
export SAATHI_APP_URL=https://your-family-host.example
npm run android:apk
# prints: APK: …/android/app/build/outputs/apk/debug/app-debug.apk
```

That runs `npx cap sync android` then `./gradlew assembleDebug`.

Emulator against local Next:

```bash
npm run android:apk -- --dev
```

## Signed release (APK or AAB)

Never commit a keystore or a password. `*.jks` and `*.keystore` are gitignored.

Create a keystore once, **back it up off this laptop**. Losing it means you can never update the same app id.

```bash
keytool -genkeypair -v -keystore saathi-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias saathi
```

Then:

```bash
export ANDROID_KEYSTORE_PATH=/absolute/path/to/saathi-upload.jks
export ANDROID_KEYSTORE_PASSWORD=   # not in git
export ANDROID_KEY_ALIAS=saathi
export ANDROID_KEY_PASSWORD=
export SAATHI_APP_URL=https://your-family-host.example
npm run android:release            # APK
npm run android:release -- --aab   # AAB
```

`appId` is `app.saathi.family` (Priyansh to confirm before any store upload).

## GitHub Actions (ready to paste)

This token cannot push workflow files. Paste `.github/workflows/android.yml` in GitHub yourself. Manual trigger only. Uses repository variable `SAATHI_APP_URL`. Uploads the debug APK as an artifact.

```yaml
name: Android debug APK
on:
  workflow_dispatch:

jobs:
  apk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: "21"
      - uses: android-actions/setup-android@v3
      - name: SDK platforms
        run: sdkmanager "platforms;android-35" "platforms;android-36" "build-tools;35.0.0"
      - run: npm ci
      - name: Build debug APK
        env:
          SAATHI_APP_URL: ${{ vars.SAATHI_APP_URL }}
        run: npm run android:apk
      - uses: actions/upload-artifact@v4
        with:
          name: saathi-debug-apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
```
