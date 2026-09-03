// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {
    INativeQueryVerifier,
    NativeQueryVerifierLib
} from "@gluwa/asc-contracts/contracts/write-ability/common/INativeQueryVerifier.sol";
import {EvmV1Decoder} from "@gluwa/asc-contracts/contracts/common/EvmV1Decoder.sol";
import {IAttestcoinVerifier} from "../interfaces/IAttestcoinVerifier.sol";

contract AttestcoinVerifierAdapter is IAttestcoinVerifier {
    struct EncodedProof {
        uint64 chainKey;
        uint64 blockHeight;
        bytes encodedTransaction;
        bytes32 merkleRoot;
        INativeQueryVerifier.MerkleProofEntry[] siblings;
        bytes32 lowerEndpointDigest;
        bytes32[] continuityRoots;
    }

    INativeQueryVerifier public immutable nativeQueryVerifier;
    uint64 public immutable sepoliaChainKey;

    constructor(uint64 sepoliaChainKey_) {
        nativeQueryVerifier = NativeQueryVerifierLib.getVerifier();
        sepoliaChainKey = sepoliaChainKey_;
    }

    function verifyEventInclusion(
        bytes calldata proof,
        address emitter,
        uint256 sourceChainId,
        bytes32[] calldata expectedTopics,
        bytes calldata expectedData
    ) external view override returns (bool verified) {
        EncodedProof memory decodedProof = abi.decode(proof, (EncodedProof));

        if (decodedProof.chainKey != sepoliaChainKey) revert UnsupportedSourceChain(sourceChainId);

        INativeQueryVerifier.MerkleProof memory merkleProof = INativeQueryVerifier.MerkleProof({
            root: decodedProof.merkleRoot,
            siblings: decodedProof.siblings
        });
        INativeQueryVerifier.ContinuityProof memory continuityProof = INativeQueryVerifier.ContinuityProof({
            lowerEndpointDigest: decodedProof.lowerEndpointDigest,
            roots: decodedProof.continuityRoots
        });

        bool included = nativeQueryVerifier.verify(
            decodedProof.chainKey,
            decodedProof.blockHeight,
            decodedProof.encodedTransaction,
            merkleProof,
            continuityProof
        );
        if (!included) revert SourceTransactionFailed();

        EvmV1Decoder.ReceiptFields memory receipt = EvmV1Decoder.decodeReceiptFields(
            decodedProof.encodedTransaction
        );
        if (receipt.receiptStatus != 1) revert SourceTransactionFailed();

        EvmV1Decoder.LogEntry[] memory matchingLogs = EvmV1Decoder.getLogsByEventSignature(
            receipt,
            expectedTopics[0]
        );

        return _findMatchingLog(matchingLogs, emitter, expectedTopics, expectedData);
    }

    function _findMatchingLog(
        EvmV1Decoder.LogEntry[] memory logs,
        address emitter,
        bytes32[] calldata expectedTopics,
        bytes calldata expectedData
    ) private pure returns (bool) {
        uint256 length = logs.length;
        for (uint256 i = 0; i < length; i++) {
            EvmV1Decoder.LogEntry memory log = logs[i];
            if (log.address_ != emitter) continue;
            if (log.topics.length != expectedTopics.length) continue;

            bool topicsMatch = true;
            for (uint256 j = 0; j < expectedTopics.length; j++) {
                if (log.topics[j] != expectedTopics[j]) {
                    topicsMatch = false;
                    break;
                }
            }
            if (!topicsMatch) continue;

            if (keccak256(log.data) == keccak256(expectedData)) {
                return true;
            }
        }
        return false;
    }
}
