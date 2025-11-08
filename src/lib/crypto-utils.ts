import CryptoJS from "crypto-js";

const DEFAULT_ENCRYPTION_PIN = process.env.NODE_ENV === "production" ? process.env.ENCRYPTION_PIN || "default" : "default";

export interface EncryptedCredentials {
	encryptedPassword: string;
	encryptedUsername: string;
}

export interface DecryptedCredentials {
	password: string;
	username: string;
}

export function encryptCredentials(username: string, password: string, pin: string = DEFAULT_ENCRYPTION_PIN): EncryptedCredentials {
	try {
		const encryptedUsername = CryptoJS.AES.encrypt(username, pin).toString();
		const encryptedPassword = CryptoJS.AES.encrypt(password, pin).toString();

		return {
			encryptedUsername,
			encryptedPassword,
		};
	} catch {
		throw new Error("Failed to encrypt credentials");
	}
}

export function decryptCredentials(encryptedCredentials: EncryptedCredentials, pin: string = DEFAULT_ENCRYPTION_PIN): DecryptedCredentials {
	try {
		const { encryptedPassword, encryptedUsername } = encryptedCredentials;

		const decryptedUsernameBytes = CryptoJS.AES.decrypt(encryptedUsername, pin);
		const decryptedPasswordBytes = CryptoJS.AES.decrypt(encryptedPassword, pin);

		const username = decryptedUsernameBytes.toString(CryptoJS.enc.Utf8);
		const password = decryptedPasswordBytes.toString(CryptoJS.enc.Utf8);

		if (!username || !password) {
			throw new Error("Decryption resulted in empty credentials");
		}

		return {
			username,
			password,
		};
	} catch {
		throw new Error("Failed to decrypt credentials");
	}
}

export function encryptString(value: string, pin: string = DEFAULT_ENCRYPTION_PIN): string {
	try {
		return CryptoJS.AES.encrypt(value, pin).toString();
	} catch {
		throw new Error("Failed to encrypt string");
	}
}

export function decryptString(encryptedValue: string, pin: string = DEFAULT_ENCRYPTION_PIN): string {
	try {
		const decryptedBytes = CryptoJS.AES.decrypt(encryptedValue, pin);
		const decryptedValue = decryptedBytes.toString(CryptoJS.enc.Utf8);

		if (!decryptedValue) {
			throw new Error("Decryption resulted in empty value");
		}

		return decryptedValue;
	} catch {
		throw new Error("Failed to decrypt string");
	}
}

export function isValidEncryptedString(encryptedValue: string): boolean {
	try {
		CryptoJS.enc.Base64.parse(encryptedValue);
		return true;
	} catch {
		return false;
	}
}

export function generateRandomKey(length: number = 32): string {
	return CryptoJS.lib.WordArray.random(length).toString();
}

export function createHash(value: string): string {
	return CryptoJS.SHA256(value).toString();
}

export function verifyHash(plainText: string, hash: string): boolean {
	return createHash(plainText) === hash;
}
