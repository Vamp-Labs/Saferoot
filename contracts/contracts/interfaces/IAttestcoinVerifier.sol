// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IAttestcoinVerifier {
    error UnsupportedSourceChain(uint256 sourceChainId);
    error SourceTransactionFailed();

    function verifyEventInclusion(
        bytes calldata proof,
        address emitter,
        uint256 sourceChainId,
        bytes32[] calldata expectedTopics,
        bytes calldata expectedData
    ) external view returns (bool verified);
}
