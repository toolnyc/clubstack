/**
 * Generate a URL-safe slug from a name.
 * "DJ Shadow" → "dj-shadow"
 * "Âme" → "ame"
 */
function generateSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export { generateSlug };
