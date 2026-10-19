# Android app (Capacitor shell)

The APK is a thin native shell. It opens the hosted family desk (`SAATHI_APP_URL`) full screen. The Next.js app is not bundled as static files.

**Android only.** iPhone testers use the website. Do not publish to Play Store. Do not create a Play Console listing. Mocks stay on.

## Hindi summary / हिंदी में संक्षेप

<<<<<<< HEAD
- Node (same as the family app) and this repo.
- **JDK 21** for CI (`actions/setup-java`). Locally 17 or 21 both work with this Gradle.
- **Android SDK**: cmdline-tools, platform 35 (Capacitor 8 also compiles against 36), build-tools.
- `ANDROID_HOME` / `ANDROID_SDK_ROOT` pointed at that SDK.
- `SAATHI_APP_URL` — `https://…` hosted family origin. `npm run android:apk` refuses localhost or plain http unless you pass `--dev` (sets `CAP_DEV=1`; `npx cap sync --dev` is rejected by the CLI). That allows `http://10.0.2.2:43147` for the emulator.
=======
- प्रियंश APK बनाते हैं (`npm run android:apk`) या GitHub Actions से डाउनलोड करते हैं। Play Store नहीं है।
- टेस्टर: फ़ाइल खोलें → “इस स्रोत से इंस्टॉल” अनुमति दें → साक्षी खुलता है।
- साइन-इन: ईमेल में **6 अंकों का कोड** ऐप में टाइप करें। लिंक फ़ोन का ब्राउज़र खोलता है — ऐप में साइन-इन नहीं होता। मॉक स्टेजिंग (`MOCK_WHATSAPP=1`) पर कोड नहीं आता; ऐप तुरंत साइन-इन कर लेता है। `MOCK_EMAIL=1` हो और व्हाट्सऐप मॉक बंद हो तो `/ops` पर कोड दिखता है (केवल OPS_EMAILS)।
- हटाने के लिए: सेटिंग → ऐप्स → साक्षी → अनइंस्टॉल।
- वेबसाइट से फ़र्क़: इंस्टॉल और साइन-इन कोड के अलावा कुछ नहीं। कॉल या मैसेज अभी भी मॉक हैं।
- iPhone पर यही परिवार ऐप ब्राउज़र में खोलें।

## How Priyansh builds or downloads the APK

Needs: Node, **JDK 17**, Android SDK (cmdline-tools, platform 35; Capacitor 8 also compiles against 36, plus build-tools), `ANDROID_HOME`, and `SAATHI_APP_URL` as `https://…`. The script refuses localhost or plain http unless you pass `--dev` (`http://10.0.2.2:43147` for the emulator).
>>>>>>> 64b760e (Write the Android tester install guide in English with a Hindi summary.)

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

Email links open the **phone browser**, not the app. Testers who tap the link look signed in in Chrome and still logged out in Saathi.

1. In the app, type the allowed email and continue.
2. Open the mail **only to copy the 6-digit code**. Type it in the app. Ten minutes, five tries.
3. Skip the link while testing the APK.

While staging keeps `MOCK_WHATSAPP=1`, the app issues a local session and does not send mail — testers stay inside the app. If `MOCK_WHATSAPP=0` and `MOCK_EMAIL=1`, mail is not delivered; signed-in `OPS_EMAILS` can read pending codes for `ALLOWED_EMAILS` only on `/ops` (see `deploy.md`). Live mail still goes through `gateOutbound`.

## How to uninstall

Settings → Apps → Saathi → Uninstall. Or long-press the home icon → App info → Uninstall. Allowing “install unknown apps” for Files can be turned off afterwards.

## What is different from the website

Nothing except install and this sign-in path. Same hosted family desk, same mocks, same kill switch. WhatsApp, `tel:112`, and other hosts open outside the app (dialer for `tel:`). iPhone testers keep using the website.

## Signed release (not for testers)

Never commit a keystore or a password. `*.jks` and `*.keystore` are gitignored.

Create a keystore once, **back it up off this laptop**. Losing it means you can never update the same app id.

```bash
keytool -genkeypair -v -keystore saathi-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias saathi
```

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
