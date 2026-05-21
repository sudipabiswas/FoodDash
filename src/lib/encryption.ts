import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
// Generate a 32-byte key from the environment variable via SHA-256
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(process.env.PAYMENT_ENCRYPTION_KEY || "default_food_dash_secure_payment_enc_key_32_bytes")
  .digest();

const IV_LENGTH = 16;

export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

export function decrypt(text: string): string {
  try {
    const textParts = text.split(":");
    const ivPart = textParts.shift();
    if (!ivPart) throw new Error("Invalid IV part");
    
    const iv = Buffer.from(ivPart, "hex");
    const encryptedText = textParts.join(":");
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}
