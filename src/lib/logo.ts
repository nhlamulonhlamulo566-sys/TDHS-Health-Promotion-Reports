// Centralized logo path. The user pasted the provincial logo at `public/Provincial health logo.jpeg`.
// If you prefer the logo to live under `public/icons/`, move/rename the file there and
// update PROVINCIAL_LOGO_PATH accordingly.
export const PROVINCIAL_LOGO_PATH = "/Provincial health logo.jpeg";
// Fallback (existing) logo shipped with the app
export const DEFAULT_LOGO_PATH = "/icons/SA-Department-of-Health-Logo.jpg";

export const getLogoPath = () => PROVINCIAL_LOGO_PATH || DEFAULT_LOGO_PATH;
