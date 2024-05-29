function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
    .replace(/(^-|-$)/g, ''); // Remove leading and trailing hyphens
}

async function generateUniqueSlug(Model, title, field, maxLength = 25) {

  title = title.substring(0, maxLength);

  if(title.lastIndexOf(" ") > 0) {
    title = title.substr(0, Math.min(title.length, title.lastIndexOf(" ")))
  }

  let baseSlug = slugify(title);
  let slug = baseSlug;

  // Check if the slug already exists in the database
  let count = 1;
  let existingEntry = await Model.findBy(field, slug);

  while (existingEntry) {
    // If it exists, append a unique identifier
    const suffix = `-${count}`;
    const suffixLength = suffix.length;
    slug = baseSlug.substring(0, maxLength - suffixLength) + suffix;
    existingEntry = await Model.findBy(field, slug);
    count++;
  }

  return slug;
}

module.exports = {
  generateUniqueSlug,
};
