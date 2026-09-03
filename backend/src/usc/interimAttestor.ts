import { AbiCoder, Signature, SigningKey, Wallet, keccak256 } from "ethers";
import { env } from "../env";

export const INTERIM_ATTESTATION_DOMAIN = "SAFEROOT_INTERIM_ATTESTATION_V1";

export interface InterimAttestationInput {
  sourceChainId: number;
  ethereumTxHash: string;
  policyId: string;
  version: bigint;
  safe: string;
  destinationChainId: bigint;
  executor: string;
  activation: bigint;
  expiry: bigint;
  encodedActions: string;
}

function digestFor(input: InterimAttestationInput): string {
  const abiCoder = AbiCoder.defaultAbiCoder();
  const encoded = abiCoder.encode(
    ["string", "uint256", "bytes32", "bytes32", "uint256", "address", "uint256", "address", "uint256", "uint256", "bytes"],
    [
      INTERIM_ATTESTATION_DOMAIN,
      input.sourceChainId,
      input.ethereumTxHash,
      input.policyId,
      input.version,
      input.safe,
      input.destinationChainId,
      input.executor,
      input.activation,
      input.expiry,
      input.encodedActions,
    ],
  );
  return keccak256(encoded);
}

export function interimAttestorAddress(): string {
  if (!env.ATTESTCOIN_INTERIM_ATTESTOR_PRIVATE_KEY) {
    throw new Error("ATTESTCOIN_INTERIM_ATTESTOR_PRIVATE_KEY is required when ATTESTCOIN_MODE=interim");
  }
  return new Wallet(env.ATTESTCOIN_INTERIM_ATTESTOR_PRIVATE_KEY).address;
}

export function signInterimAttestation(input: InterimAttestationInput): string {
  if (!env.ATTESTCOIN_INTERIM_ATTESTOR_PRIVATE_KEY) {
    throw new Error("ATTESTCOIN_INTERIM_ATTESTOR_PRIVATE_KEY is required when ATTESTCOIN_MODE=interim");
  }
  const digest = digestFor(input);
  const signingKey = new SigningKey(env.ATTESTCOIN_INTERIM_ATTESTOR_PRIVATE_KEY);
  const signature = signingKey.sign(digest);
  const abiCoder = AbiCoder.defaultAbiCoder();
  return abiCoder.encode(
    ["bytes", "bytes32", "uint256"],
    [Signature.from(signature).serialized, input.ethereumTxHash, 0n],
  );
}
