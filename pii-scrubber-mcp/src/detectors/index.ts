import type { Detector, PiiType } from "../core/types.js";
import { emailDetector } from "./email.js";
import { phoneDetector } from "./phone.js";
import { creditCardDetector } from "./creditCard.js";
import { ssnDetector } from "./ssn.js";
import { ibanDetector } from "./iban.js";
import { ipv4Detector, ipv6Detector } from "./ip.js";
import {
  awsKeyDetector,
  githubTokenDetector,
  openaiKeyDetector,
  genericSecretDetector,
} from "./apiKey.js";
import { jwtDetector } from "./jwt.js";
import { privateKeyDetector } from "./privateKey.js";
import { addressDetector } from "./address.js";
import { dobDetector } from "./dob.js";
import { macDetector } from "./mac.js";

export const ALL_DETECTORS: Detector[] = [
  emailDetector,
  phoneDetector,
  creditCardDetector,
  ssnDetector,
  ibanDetector,
  ipv4Detector,
  ipv6Detector,
  awsKeyDetector,
  githubTokenDetector,
  openaiKeyDetector,
  jwtDetector,
  privateKeyDetector,
  addressDetector,
  dobDetector,
  macDetector,
  // generic_secret last so that more-specific token detectors (AWS, GitHub, OpenAI, JWT)
  // claim their spans before this catch-all does.
  genericSecretDetector,
];

export function detectorsFor(types?: PiiType[]): Detector[] {
  if (!types || types.length === 0) return ALL_DETECTORS;
  const set = new Set(types);
  return ALL_DETECTORS.filter((d) => set.has(d.type));
}

export function describeDetectors(): { type: PiiType; token: string; confidence: number }[] {
  return ALL_DETECTORS.map((d) => ({ type: d.type, token: d.token, confidence: d.confidence }));
}
