import { describe, it, expect } from "vitest";
import { emailDetector } from "../src/detectors/email.js";
import { phoneDetector } from "../src/detectors/phone.js";
import { creditCardDetector, luhn } from "../src/detectors/creditCard.js";
import { ssnDetector } from "../src/detectors/ssn.js";
import { ibanDetector, ibanCheck } from "../src/detectors/iban.js";
import { ipv4Detector, ipv6Detector } from "../src/detectors/ip.js";
import {
  awsKeyDetector,
  githubTokenDetector,
  openaiKeyDetector,
  genericSecretDetector,
} from "../src/detectors/apiKey.js";
import { jwtDetector } from "../src/detectors/jwt.js";
import { privateKeyDetector } from "../src/detectors/privateKey.js";
import { addressDetector } from "../src/detectors/address.js";
import { dobDetector } from "../src/detectors/dob.js";
import { macDetector } from "../src/detectors/mac.js";

describe("emailDetector", () => {
  it("finds emails with offsets", () => {
    const text = "Contact me at alice.doe@example.com or bob+work@sub.example.co.uk.";
    const hits = emailDetector.detect(text);
    expect(hits).toHaveLength(2);
    expect(hits[0].value).toBe("alice.doe@example.com");
    expect(text.slice(hits[0].start, hits[0].end)).toBe(hits[0].value);
  });
});

describe("phoneDetector", () => {
  it("finds international phones, ignores too-short digits", () => {
    const text = "Call +91 98765 43210 or +1 (415) 555-2671. Order #12345.";
    const hits = phoneDetector.detect(text);
    expect(hits.length).toBeGreaterThanOrEqual(2);
    expect(hits.every((h) => h.value.replace(/\D/g, "").length >= 7)).toBe(true);
  });
});

describe("creditCardDetector + luhn", () => {
  it("luhn accepts Stripe test PAN, rejects random 16 digits", () => {
    expect(luhn("4242424242424242")).toBe(true);
    expect(luhn("4111111111111111")).toBe(true);
    expect(luhn("1234567812345678")).toBe(false);
  });

  it("finds Luhn-valid PANs only", () => {
    const text = "Card 4242 4242 4242 4242 used; phantom 1234 5678 9012 3456 not.";
    const hits = creditCardDetector.detect(text);
    expect(hits).toHaveLength(1);
    expect(hits[0].value.replace(/\s/g, "")).toBe("4242424242424242");
  });
});

describe("ssnDetector", () => {
  it("accepts valid SSN shapes, rejects 000 / 666 area codes", () => {
    expect(ssnDetector.detect("SSN: 123-45-6789").length).toBe(1);
    expect(ssnDetector.detect("SSN: 000-12-3456").length).toBe(0);
    expect(ssnDetector.detect("SSN: 666-12-3456").length).toBe(0);
  });
});

describe("ibanDetector + ibanCheck", () => {
  it("validates the canonical German example IBAN", () => {
    expect(ibanCheck("DE89370400440532013000")).toBe(true);
    expect(ibanCheck("DE00000000000000000000")).toBe(false);
  });

  it("finds IBANs in text", () => {
    const hits = ibanDetector.detect("Send to DE89370400440532013000 today.");
    expect(hits.length).toBe(1);
  });
});

describe("ipv4 / ipv6 detectors", () => {
  it("finds v4 addresses", () => {
    const hits = ipv4Detector.detect("Server at 192.168.1.1 connected from 10.0.0.255.");
    expect(hits.map((h) => h.value)).toEqual(expect.arrayContaining(["192.168.1.1", "10.0.0.255"]));
  });

  it("rejects out-of-range octets", () => {
    const hits = ipv4Detector.detect("999.999.999.999 is not valid");
    expect(hits.length).toBe(0);
  });

  it("finds compressed and full v6 forms", () => {
    const hits = ipv6Detector.detect("addresses 2001:db8::1 and fe80::1ff:fe23:4567:890a are flagged");
    expect(hits.length).toBeGreaterThanOrEqual(2);
  });
});

describe("apiKeyDetector family", () => {
  it("AWS access key id", () => {
    const hits = awsKeyDetector.detect("AKIAIOSFODNN7EXAMPLE leaked");
    expect(hits[0].value).toBe("AKIAIOSFODNN7EXAMPLE");
  });

  it("GitHub PAT", () => {
    const text = "token=ghp_abcdefghijklmnopqrstuvwxyz0123456789 done";
    const hits = githubTokenDetector.detect(text);
    expect(hits.length).toBe(1);
  });

  it("OpenAI key", () => {
    const text = "key=sk-proj-abcdefghijklmnopqrstuvwxyz0123456789";
    const hits = openaiKeyDetector.detect(text);
    expect(hits.length).toBe(1);
  });

  it("generic high-entropy secret", () => {
    const text = "TOKEN=" + "Ab3Ks9PqXr7TmZjLn5Wd2Vc8Eg4Hf1Bv6Yu0Qx9";
    const hits = genericSecretDetector.detect(text);
    expect(hits.length).toBe(1);
  });

  it("does NOT flag a low-entropy id", () => {
    const hits = genericSecretDetector.detect("id=00000000000000000000000000000000");
    expect(hits.length).toBe(0);
  });
});

describe("jwtDetector", () => {
  it("finds three-segment JWTs", () => {
    const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    expect(jwtDetector.detect("token=" + jwt + " ok").length).toBe(1);
  });
});

describe("privateKeyDetector", () => {
  it("finds PEM private key blocks", () => {
    const block = "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIB...\n-----END RSA PRIVATE KEY-----";
    expect(privateKeyDetector.detect(block).length).toBe(1);
  });
});

describe("addressDetector", () => {
  it("finds common US street addresses", () => {
    const text = "Mail to 1600 Pennsylvania Avenue NW or 221B Baker Street.";
    const hits = addressDetector.detect(text);
    expect(hits.length).toBeGreaterThanOrEqual(2);
  });
});

describe("dobDetector", () => {
  it("finds labelled DOB lines", () => {
    expect(dobDetector.detect("DOB: 01/02/1990").length).toBe(1);
    expect(dobDetector.detect("Date of birth: 1990-02-01").length).toBe(1);
    expect(dobDetector.detect("Born March 4, 1985").length).toBe(1);
  });

  it("does not flag a random date", () => {
    expect(dobDetector.detect("Meeting on 2024-01-15.").length).toBe(0);
  });
});

describe("macDetector", () => {
  it("finds MAC addresses with colons and dashes", () => {
    const hits = macDetector.detect("AA:BB:CC:DD:EE:FF connected; 11-22-33-44-55-66 too");
    expect(hits.length).toBe(2);
  });
});
