function validateLuhn(num: string): boolean {
  let sum = 0;
  let shouldDouble = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0 && num.length >= 13 && num.length <= 16;
}

export function maskSensitiveData(value: any): any {
  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    // Look for 13-16 digit patterns that might be card numbers (allowing spaces or dashes)
    const cardRegex = /\b(?:\d[ -]*?){13,16}\b/g;
    return value.replace(cardRegex, (match) => {
      const clean = match.replace(/[\s-]/g, "");
      if (validateLuhn(clean)) {
        const last4 = clean.slice(-4);
        return "*".repeat(clean.length - 4) + last4;
      }
      return match;
    });
  }

  // Handle standard objects and arrays
  if (typeof value === "object") {
    try {
      const serialized = JSON.stringify(value);
      const masked = maskSensitiveData(serialized);
      return JSON.parse(masked);
    } catch {
      // Fallback if circular structures fail serialization
      return value;
    }
  }

  return value;
}

export function initializeLogger() {
  if ((globalThis as any).__LOGGER_INITIALIZED__) return;

  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;

  console.log = (...args: any[]) => {
    originalLog(...args.map(maskSensitiveData));
  };
  console.error = (...args: any[]) => {
    originalError(...args.map(maskSensitiveData));
  };
  console.warn = (...args: any[]) => {
    originalWarn(...args.map(maskSensitiveData));
  };
  console.info = (...args: any[]) => {
    originalInfo(...args.map(maskSensitiveData));
  };

  (globalThis as any).__LOGGER_INITIALIZED__ = true;
  console.log("[SECURITY] PAN-masking log middleware initialized successfully.");
}

// Automatically auto-initialize when this file is imported
initializeLogger();
