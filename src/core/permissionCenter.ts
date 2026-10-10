/** Browser/WebView permission adapter. Native Android runtime prompts still depend on the host app. */
export class PermissionCenter {
  async requestMicrophone(): Promise<MediaStream> {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("unsupported");
    }
    return navigator.mediaDevices.getUserMedia({ audio: true });
  }

  async requestCamera(): Promise<MediaStream> {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("unsupported");
    }
    return navigator.mediaDevices.getUserMedia({ video: true });
  }

  async getLocation(): Promise<GeolocationPosition> {
    if (!navigator.geolocation) throw new Error("unsupported");
    return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true, timeout: 12000, maximumAge: 30000,
    }));
  }

  describeMicrophoneError(error: unknown): string {
    const e = error as { name?: string; message?: string };
    if (e?.name === "NotAllowedError" || e?.name === "SecurityError") {
      return "Microphone blocked. In Android Settings, allow JARVIS OS microphone access. Then open the website in Chrome, tap the site controls beside the address, and allow Microphone if prompted. Reload JARVIS and tap the orb again.";
    }
    if (e?.name === "NotFoundError") return "No microphone was found on this device.";
    if (e?.name === "NotReadableError") return "The microphone is busy in another app. Close other apps using the mic and retry.";
    if (e?.message === "unsupported") return "This WebView does not expose microphone capture. Update Android System WebView and Chrome, then retry.";
    return e?.message || "Microphone could not be opened. Check app and website permissions.";
  }
}

export const permissionCenter = new PermissionCenter();
