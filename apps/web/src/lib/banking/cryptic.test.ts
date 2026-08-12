import { beforeEach, describe, expect, it, vi } from "vitest";

const mockEnv = {
	SECRET_ENCRYPTION_KEY: Buffer.alloc(32, 9).toString("base64"),
};

vi.mock("@/env", () => ({ env: mockEnv }));

const { decrypt, decryptBankingDetails, encrypt, encryptBankingDetails } =
	await import("./cryptic");

beforeEach(() => {
	mockEnv.SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString("base64");
});

describe("encrypt/decrypt", () => {
	it("round-trips plaintext", () => {
		const ciphertext = encrypt("secret-value");

		expect(ciphertext).not.toBe("secret-value");
		expect(decrypt(ciphertext)).toBe("secret-value");
	});

	it("produces different ciphertext for the same plaintext (random IV)", () => {
		expect(encrypt("secret-value")).not.toBe(encrypt("secret-value"));
	});
});

describe("encryptBankingDetails/decryptBankingDetails", () => {
	it("round-trips both fields", () => {
		const data = { iban: "DE89370400440532013000", fullName: "Ada Lovelace" };

		const encrypted = encryptBankingDetails(data);

		expect(encrypted.iban).not.toBe(data.iban);
		expect(encrypted.fullName).not.toBe(data.fullName);
		expect(decryptBankingDetails(encrypted)).toEqual(data);
	});
});

describe("key validation", () => {
	it("throws when SECRET_ENCRYPTION_KEY decodes to fewer than 32 bytes", () => {
		mockEnv.SECRET_ENCRYPTION_KEY = Buffer.alloc(16, 1).toString("base64");

		expect(() => encrypt("x")).toThrow(/32 bytes/);
	});

	it("accepts a key that decodes to exactly 32 bytes", () => {
		mockEnv.SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 1).toString("base64");

		expect(() => encrypt("x")).not.toThrow();
	});
});
