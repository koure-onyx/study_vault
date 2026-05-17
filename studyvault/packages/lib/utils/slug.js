// packages/lib/utils/slug.js

export function generateSlug(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')           // Remove non-word chars
    .replace(/[\s_-]+/g, '-')           // Replace spaces/underscores with single dash
    .replace(/^-+|-+$/g, '');           // Trim dashes from ends
}

export function generateUniqueSlug(baseText, existingSlugs = []) {
  let slug = generateSlug(baseText);
  let counter = 1;
  const originalSlug = slug;
  
  while (existingSlugs.includes(slug)) {
    slug = `${originalSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

export function slugToTitle(slug) {
  if (!slug) return '';
  
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function validateSlug(slug) {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}
