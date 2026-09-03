// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IAttestcoinVerifier} from "../interfaces/IAttestcoinVerifier.sol";

contract MockAttestcoinVerifier is IAttestcoinVerifier {
    struct MockProof {
        uint256 claimedSourceChainId;
        uint8 receiptStatus;
        address logEmitter;
        bytes32[] logTopics;
        bytes logData;
    }

    function verifyEventInclusion(
        bytes calldata proof,
        address emitter,
        uint256 sourceChainId,
        bytes32[] calldata expectedTopics,
        bytes calldata expectedData
    ) external pure override returns (bool verified) {
        MockProof memory decodedProof = abi.decode(proof, (MockProof));

        if (decodedProof.claimedSourceChainId != sourceChainId) {
            revert UnsupportedSourceChain(decodedProof.claimedSourceChainId);
        }
        if (decodedProof.receiptStatus != 1) revert SourceTransactionFailed();

        if (decodedProof.logEmitter != emitter) return false;
        if (decodedProof.logTopics.length != expectedTopics.length) return false;

        for (uint256 i = 0; i < expectedTopics.length; i++) {
            if (decodedProof.logTopics[i] != expectedTopics[i]) return false;
        }

        return keccak256(decodedProof.logData) == keccak256(expectedData);
    }

    function encodeProof(MockProof calldata proofInput) external pure returns (bytes memory) {
        return abi.encode(proofInput);
    }
}
