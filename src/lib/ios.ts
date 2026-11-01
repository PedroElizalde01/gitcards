/**
 * iOS major version from a User-Agent, or null when it isn't an iPhone/iPad (unknown device).
 * Safari's "Version/N" equals the iOS major; since iOS 26 the "iPhone OS 18_6" part is frozen,
 * so it can't be trusted for 26+. Other iOS browsers (Chrome, Firefox, in-app views) only have
 * that frozen part, so they read as 18 and get the conservative answer.
 */
export function iosMajor(ua: string | null): number | null {
  if (!ua || !/iPhone|iPad|iPod/.test(ua)) return null;
  const safari = !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua) && /Version\/(\d+)/.exec(ua);
  if (safari) return Number(safari[1]);
  const os = /OS (\d+)_/.exec(ua);
  return os ? Number(os[1]) : 0;
}
