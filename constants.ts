import { LucideIcon, Upload, Music, Image as ImageIcon, Video, Cpu, Smartphone } from 'lucide-react';

export const APP_VERSION = "V1.0.0-NATIVE";

export const RESOLUTIONS = [
  { label: '480p (SD)', value: '480p' },
  { label: '720p (HD)', value: '720p' },
  { label: '1080p (FHD)', value: '1080p' },
];

export const MOCK_LOGS = [
  "Initializing Native Engine...",
  "Loading @capgo/capacitor-ffmpeg plugin...",
  "Allocating memory buffers...",
  "Checking Android Cache directory...",
  "Visual stream found: input_0.jpg",
  "Audio stream found: input_1.mp3",
  "Executing FFmpeg: -loop 1 -i ...",
  "Mapping streams...",
  "Encoding to H.264...",
  "Muxing MP4 container...",
  "Writing to /storage/emulated/0/Download/..."
];

export const CAPACITOR_CONFIG = `import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.trendmusic.videoengine',
  appName: 'Video Engine',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    FFmpeg: {
      enabled: true
    }
  }
};

export default config;`;

export const GITHUB_WORKFLOW = `name: Build Android APK
on:
  push:
    branches:
      - main
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node & Java
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install Dependencies
        run: npm install
      - name: Build Next.js App
        run: npm run build
      - name: Sync Capacitor
        run: npx cap sync android
      - name: Build APK (Gradle)
        run: cd android && ./gradlew assembleDebug
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: video-engine-v1.apk
          path: android/app/build/outputs/apk/debug/app-debug.apk`;