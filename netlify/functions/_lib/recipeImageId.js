// Recipe image ID computation for Netlify Functions
import crypto from 'crypto';

export const normalizeRecipeText = (value) => {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const buildRecipeSignature = ({ title, keyIngredients }) => {
  const normalizedTitle = normalizeRecipeText(title);
  const normalizedIngredients = (Array.isArray(keyIngredients) ? keyIngredients : [])
    .map(normalizeRecipeText)
    .filter(Boolean)
    .sort();

  const topIngredients = normalizedIngredients.slice(0, 6).join(',');
  const signature = `${normalizedTitle}|${topIngredients}`;

  return { signature, normalizedTitle, topIngredients };
};

export const sha256Hex = (text) => {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
};

export const computeRecipeImageId = ({ title, keyIngredients }) => {
  const { signature } = buildRecipeSignature({ title, keyIngredients });
  const hash = sha256Hex(signature);
  const recipeImageId = hash.substring(0, 24);
  return { recipeImageId, signature };
};
