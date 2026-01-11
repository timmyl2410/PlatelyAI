export type RecipeImageInput = {
  title: string;
  keyIngredients: string[];
};

export const normalizeRecipeText = (value: string): string => {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const buildRecipeSignature = (input: RecipeImageInput): {
  signature: string;
  normalizedTitle: string;
  topIngredients: string;
} => {
  const normalizedTitle = normalizeRecipeText(input.title);
  const normalizedIngredients = (Array.isArray(input.keyIngredients) ? input.keyIngredients : [])
    .map(normalizeRecipeText)
    .filter(Boolean)
    .sort();

  const topIngredients = normalizedIngredients.slice(0, 6).join(',');
  const signature = `${normalizedTitle}|${topIngredients}`;

  return { signature, normalizedTitle, topIngredients };
};

const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

export const sha256Hex = async (text: string): Promise<string> => {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto is not available in this environment.');
  }

  const data = new TextEncoder().encode(text);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(hashBuffer));
};

export const computeRecipeImageId = async (input: RecipeImageInput): Promise<{ recipeImageId: string; signature: string }> => {
  const { signature } = buildRecipeSignature(input);
  const recipeImageId = await sha256Hex(signature);
  return { recipeImageId, signature };
};
