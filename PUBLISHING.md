# Publishing NO Button

Bundle ID / package: `com.eugeneproskuryn.nobutton`. Requires Node ≥ 22.13 locally (Expo SDK 58).

## 0. Prereqs
1. **Apple Developer Program** — $99/year: https://developer.apple.com/programs/enroll/ (Apple ID + 2FA; individual enrollment is usually approved in 24–48h).
2. **Google Play Console** — $25 one-time: https://play.google.com/console/signup (identity verification; new personal accounts must run a closed test with 12 testers for 14 days before production access).
3. Free Expo account: https://expo.dev/signup
4. `npm install -g eas-cli && eas login`

## 1. Link the project
```bash
cd no-button-app
npm install
eas init            # creates the EAS project and writes extra.eas.projectId into app.json
```

## 2. Build
```bash
eas build --platform ios --profile production       # .ipa; EAS will create certs + provisioning profile (log in with Apple ID)
eas build --platform android --profile production   # .aab; let EAS generate the upload keystore
```

## 3. Store setup
**App Store Connect** (https://appstoreconnect.apple.com): My Apps → + New App → iOS, name "NO Button", bundle ID `com.eugeneproskuryn.nobutton`, SKU `nobutton`. Fill in text from STORE_LISTING.md, privacy policy URL, App Privacy = Data Not Collected, age rating questionnaire (all None → 4+), price tier. Screenshots: 6.9" (1320×2868) and 6.5" (1284×2778) iPhone; 13" iPad if supportsTablet stays true (or set it to false).
Copy the numeric Apple ID of the app into `eas.json → submit.production.ios.ascAppId` and your Apple ID email into `appleId`.

**Play Console**: Create app → "NO Button", App, Free or Paid (note: a free app can never be switched to paid — decide first!). Complete App content: privacy policy, ads = No, content rating (IARC → Everyone), target audience, Data safety = no data collected. Store listing: short/full descriptions, 512×512 icon (resize assets/icon.png), 1024×500 feature graphic, ≥2 phone screenshots.
Create a Google Cloud service account with Play Console access, download its JSON key to `./google-service-account.json` (don't commit it). Note: the first AAB upload may have to be done manually in the Console.

## 4. Submit
```bash
eas submit --platform ios --profile production --latest
eas submit --platform android --profile production --latest
```
iOS: in App Store Connect pick the build, add it to the version → Submit for Review (typically 1–3 days). Android: promote from internal/closed testing to Production → Send for review.

## 5. Updates
Bump `version` in app.json, rebuild (`autoIncrement` handles build numbers), resubmit.

## Web / PWA (iPhone Home Screen) build
```bash
python3 scripts/build_web.py      # needs Pillow; makes dist/ (offline PWA) + NO-Button.html (single file)
```
To host dist/ permanently for free, you need a free account on one of these: GitHub Pages, Cloudflare Pages, or Netlify. For example:
`npx netlify-cli login && npx netlify-cli deploy --dir dist --prod`. It must be served from the root of a domain.

## iMessage app (Messages drawer)

The project includes an iMessage extension in `targets/messages/`, built with `@bacons/apple-targets` and
`plugins/withMessagesExtensionType.js`:
- Target `NOButtonMessages`, bundle id `com.eugeneproskuryn.nobutton.messages`, iOS 15.1+, Swift `MessagesViewController` (MSMessagesAppViewController).
- **Voices** tab: 12 buttons. Tapping one plays a preview and puts that voice's MP4 clip into the message field (`insertAttachment`), so the recipient hears the scream.
- **Stickers** tab: 12 animated APNG stickers (408×408, about 230 KB each). Tap to send, or peel one onto a bubble. Stickers are silent.
- Icons: `Assets.xcassets/iMessage App Icon.stickersiconset` (all Messages sizes, including 1024×768).
- Apple allows only one Messages extension per app, so the stickers and the voice picker share this one extension.

No Mac is needed. EAS Build compiles both targets in the cloud, and `ios/` is generated (`npx expo prebuild`), so it isn't committed.

### Steps
1. Apple Developer Program, $99/year.
2. `eas build -p ios --profile production`. The first run asks you to sign in with your Apple ID. EAS then registers both bundle ids
   (`com.eugeneproskuryn.nobutton` and `com.eugeneproskuryn.nobutton.messages`) and creates certificates and provisioning profiles for both
   targets (read from `extra.eas.build.experimental.ios.appExtensions`, which the plugin fills in).
3. `eas submit -p ios --latest` uploads the build to App Store Connect. Test it with **TestFlight** first: install it on your iPhone,
   open Messages, tap the apps (+) button, then **NO Button**.
4. In App Store Connect, add the iMessage screenshots (iPhone Messages screenshots are required for apps with an iMessage extension),
   then submit the app for review. Once approved, the iMessage app is **listed in the iMessage App Store automatically** as part of the same app.
   No separate submission.

### Regenerating assets
- `python3 scripts/make_clips.py`: MP4 clips (assets/clips). Copy them to `targets/messages/Resources/clips/` as well.
- `python3 scripts/make_stickers.py`: APNG stickers in `targets/messages/Resources/stickers/`.
- Swift syntax check without a Mac (Linux swiftc + stubs): see `scripts/swift-stubs/`.
