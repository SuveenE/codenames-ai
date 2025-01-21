const ENCRYPTION_KEY = "codenames-ai-key"; // This is just for basic obfuscation

export function encryptApiKey(apiKey: string): string {
  const encodedKey = btoa(apiKey);
  return encodedKey;
}

export function decryptApiKey(encryptedKey: string): string {
  const decodedKey = atob(encryptedKey);
  return decodedKey;
}

export function getStoredApiKey(): string | null {
  const encryptedKey = localStorage.getItem(ENCRYPTION_KEY);
  if (!encryptedKey) return null;
  return decryptApiKey(encryptedKey);
}

export function storeApiKey(apiKey: string): void {
  const encryptedKey = encryptApiKey(apiKey);
  localStorage.setItem(ENCRYPTION_KEY, encryptedKey);
}

export function deleteApiKey(): void {
  localStorage.removeItem(ENCRYPTION_KEY);
}
