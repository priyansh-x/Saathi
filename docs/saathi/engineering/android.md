# Android app (Capacitor shell)

The APK is a thin native shell. It opens the hosted family desk (`SAATHI_APP_URL`) full screen. The Next.js app is not bundled as static files.

**Android only.** iPhone testers use the website. Do not publish to Play Store. Do not create a Play Console listing. Mocks stay on.

## Hindi summary / हिंदी में संक्षेप

- प्रियंश APK बनाते हैं (`npm run android:apk`) या GitHub Actions से डाउनलोड करते हैं। Play Store नहीं है।
- टेस्टर: फ़ाइल खोलें → “इस स्रोत से इंस्टॉल” अनुमति दें → साथी खुलता है।
- साइन-इन: `MOCK_WHATSAPP=1` किसी को साइन-इन नहीं करता। सार्वजनिक होस्ट (`NODE_ENV=production`) पर `MOCK_EMAIL=1` से “Email sign-in is not configured” आता है, सिवाय `OPS_EMAILS` के — उन्हें असली ईमेल लिंक या कोड चाहिए। बाकी टेस्टर `/d/<token>` खोलें।
- हटाने के लिए: सेटिंग → ऐप्स → साथी → अनइंस्टॉल।
- वेबसाइट से फ़र्क़: इंस्टॉल और साइन-इन कोड के अलावा कुछ नहीं। कॉल या मैसेज अभी भी मॉक हैं।
- iPhone पर यही परिवार ऐप ब्राउज़र में खोलें।

## How Priyansh builds or downloads the APK

Needs: Node 20 (same major as `.github/workflows/ci.yml`), **JDK 21**, Android SDK (cmdline-tools, platform 35; Capacitor 8 also compiles against 36, plus build-tools), `ANDROID_HOME`, and `SAATHI_APP_URL` as `https://…`. The script refuses localhost or plain http unless you pass `--dev` (sets `CAP_DEV=1`; `npx cap sync --dev` is rejected by the CLI). That allows `http://10.0.2.2:43147` for the emulator. Debug cleartext is on only for that `CAP_DEV=1` Gradle build.

```bash
export SAATHI_APP_URL=https://your-family-host.example
npm run android:apk
# prints: APK: …/android/app/build/outputs/apk/debug/app-debug.apk
```

That runs `npx cap sync android` then `./gradlew assembleDebug`. Send testers that APK (Drive, WhatsApp to yourself — not a store).

Or paste `.github/workflows/android.yml` (below) into GitHub, set repository variable `SAATHI_APP_URL`, run the workflow by hand, download the artifact.

Emulator against local Next: `npm run android:apk -- --dev`.

## How a tester installs it

1. Copy the APK onto the Android phone (Downloads is fine).
2. Open the file. Android will ask to **allow installs from this source** (Files / Drive / Chrome). Allow it for this one source.
3. Tap Install, then Open. Saathi should fill the screen (terracotta splash, then the hosted desk). If the host is unreachable you get the bundled offline page (Hindi and English) with Retry.
4. Back: in-app history. On Today, press back twice within two seconds to leave the app.

## How to sign in with the code

Email links open the **phone browser**, not the app.

`MOCK_WHATSAPP=1` never mints a session. On a public host (`NODE_ENV=production`) with `MOCK_EMAIL=1`, sign-in says “Email sign-in is not configured” for everyone except `OPS_EMAILS`, who still need a real emailed link or code. Testers use `/d/<token>` (for EXAMPLE: `/d/example-kamla`).

1. In the app, an allowlisted or ops address continues to a code field.
2. Copy the 6-digit code from mail. Ten minutes, five tries.
3. Skip the magic link while testing the APK.

## How to uninstall

Settings → Apps → Saathi → Uninstall. Or long-press the home icon → App info → Uninstall.

## What is different from the website

Nothing except install and this sign-in path. Same hosted family desk, same mocks, same kill switch. iPhone testers keep using the website.

## Signed release (not for testers)

Never commit a keystore or a password. `*.jks` and `*.keystore` are gitignored.

```bash
keytool -genkeypair -v -keystore saathi-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias saathi
```

**Back up the keystore.** Losing it means you can never update the same app id.

`appId` is `app.saathi.family` (Priyansh to confirm before any store upload).

```bash
export ANDROID_KEYSTORE_PATH=/absolute/path/to/saathi-upload.jks
export ANDROID_KEYSTORE_PASSWORD=
export ANDROID_KEY_ALIAS=saathi
export ANDROID_KEY_PASSWORD=
export SAATHI_APP_URL=https://your-family-host.example
npm run android:release
```

## GitHub Actions (ready to paste)

Manual trigger only. Node 20, JDK 21. `vars.SAATHI_APP_URL`. Debug APK only. No keystore secrets.

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
