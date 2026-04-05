/**
 * Deterministic auto-generated icon from a string (name or id).
 * Returns an SVG data URL. Same input always produces the same output.
 */

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function getHue(hash: number): number {
  return hash % 360;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function generateAutoIcon(input: string, size = 40): string {
  const hash = hashString(input);
  const hue = getHue(hash);
  const lightness = 25 + (hash % 20);
  const bg = `hsl(${hue}, 50%, ${lightness}%)`;
  const initials = getInitials(input);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${size / 2}" fill="${bg}"/>
    <text x="50%" y="50%" dy=".1em" fill="white" font-family="ui-monospace,monospace" font-size="${size * 0.4}" font-weight="500" text-anchor="middle" dominant-baseline="central">${initials}</text>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export { generateAutoIcon, getInitials, hashString };
