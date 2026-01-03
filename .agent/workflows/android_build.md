---
description: Build and Run SmartRent Pro on Android
---

# Android Setup & Build Guide

Since we are using **Capacitor**, your existing web code is wrapped into a native Android app.

## Prerequisites
- **Android Studio** must be installed on your machine.
- **Java/JDK** (usually comes with Android Studio).

## 1. Initial Setup (One Time)
(The Agent has already performed these steps for you)
- Installed Capacitor: `npm install @capacitor/core @capacitor/cli @capacitor/android`
- Initialized Config: `npx cap init`
- Added Android Platform: `npx cap add android`

## 2. Syncing Changes
Whenever you make changes to your JavaScript/HTML/CSS code:

1.  **Rebuild the Web App**:
    ```powershell
    npm run build
    ```
2.  **Sync to Android**:
    ```powershell
    npx cap sync
    ```

## 3. Running on Android
1.  **Open Android Studio**:
    ```powershell
    npx cap open android
    ```
2.  Wait for Gradle sync to finish (bottom bar).
3.  **Run**:
    - Connect your Android phone via USB (ensure USB Debugging is on).
    - OR use the Android Emulator.
    - Click the **Play (Run)** button (green triangle) in the top toolbar.

## 4. Important: Supabase Auth
If you use Social Login or Magic Links, you need to add the app wrapper URL to your Supabase "Redirect URLs":
- URL: `capacitor://localhost` (or `http://localhost`)

For Email/Password login (which we use), it should work out of the box!
