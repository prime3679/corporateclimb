import type { CapacitorConfig } from '@capacitor/cli'

// Portrait orientation is Xcode-only (UISupportedInterfaceOrientations on the
// iOS target). Capacitor config cannot lock it; set it after `npx cap add ios`.
const config: CapacitorConfig = {
  appId: 'com.corporateclimb.app',
  appName: 'Corporate Climb',
  webDir: 'dist',
  backgroundColor: '#263238',
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#263238',
      showSpinner: false,
    },
    StatusBar: {
      // Style.Dark = light text on a dark bar, matching theme-color #263238.
      style: 'DARK',
      backgroundColor: '#263238',
    },
  },
}

export default config
