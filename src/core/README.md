# JARVIS OS core architecture

This folder begins the modular architecture requested for JARVIS OS.

- **JarvisCoordinator / IntentEngine / CommandRouter / ContextManager**: basic intent parsing, policy checks, and recent-memory access.
- **MemoryManager**: local browser storage for the last 100 conversation turns; users can clear it.
- **AiProviderManager**: provider configuration registry for Gemini, OpenAI-compatible endpoints, and local endpoints. It does not silently create a local AI server or supply API keys.
- **PermissionCenter**: WebView/browser permission requests for microphone, camera, and geolocation with actionable microphone error messages.
- **CommandPolicy**: identifies potentially sensitive commands and requires explicit confirmation before the caller executes them.

The existing React apps provide the UI layer (dashboard/desktop, liquid-glass styling, voice orb, settings, and Dev Studio). Native-only functions such as persistent wake-word listening, Android accessibility control, notification access, overlay windows, and app launching require a native Android bridge/service and explicit Android user consent. They are not enabled by this web-layer scaffold alone.
