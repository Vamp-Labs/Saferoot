// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {INativeQueryVerifier} from "@gluwa/asc-contracts/contracts/write-ability/common/INativeQueryVerifier.sol";

contract MockNativeQueryVerifier is INativeQueryVerifier {
    bool public shouldVerify = true;

    function setShouldVerify(bool value) external {
        shouldVerify = value;
    }

    function verifyAndEmit(
        uint64,
        uint64,
        bytes calldata,
        MerkleProof calldata,
        ContinuityProof calldata
    ) external view override returns (bool) {
        return shouldVerify;
    }

    function verifyAndEmit(
        uint64,
        uint64[] calldata,
        bytes[] calldata,
        MerkleProof[] calldata,
        ContinuityProof calldata
    ) external view override returns (bool) {
        return shouldVerify;
    }

    function verify(
        uint64,
        uint64,
        bytes calldata,
        MerkleProof calldata,
        ContinuityProof calldata
    ) external view override returns (bool) {
        return shouldVerify;
    }

    function verify(
        uint64,
        uint64[] calldata,
        bytes[] calldata,
        MerkleProof[] calldata,
        ContinuityProof calldata
    ) external view override returns (bool) {
        return shouldVerify;
    }

    function calculateTxIndex(MerkleProof calldata) external pure override returns (uint64) {
        return 0;
    }
}
