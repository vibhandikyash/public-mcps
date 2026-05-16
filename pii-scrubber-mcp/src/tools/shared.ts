import { z } from "zod";
import type { PiiType, RedactionStrategy } from "../core/types.js";

export const piiTypeEnum = z.enum([
  "email",
  "phone",
  "credit_card",
  "ssn",
  "iban",
  "ipv4",
  "ipv6",
  "aws_access_key",
  "github_token",
  "openai_key",
  "generic_secret",
  "jwt",
  "private_key",
  "address",
  "dob",
  "mac_address",
]);

export const strategyEnum = z.enum(["mask", "replace", "hash", "fake", "remove"]);

export type PiiTypeIn = z.infer<typeof piiTypeEnum>;
export type StrategyIn = z.infer<typeof strategyEnum>;

// Helpers ensure the enums and the source-of-truth types stay aligned at compile time.
const _check1: PiiTypeIn extends PiiType ? true : false = true;
const _check2: PiiType extends PiiTypeIn ? true : false = true;
const _check3: StrategyIn extends RedactionStrategy ? true : false = true;
const _check4: RedactionStrategy extends StrategyIn ? true : false = true;
void _check1; void _check2; void _check3; void _check4;
