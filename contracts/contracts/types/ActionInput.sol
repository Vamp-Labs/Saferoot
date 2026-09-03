// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

struct ActionInput {
    bytes32 actionId;
    address target;
    bytes4 selector;
    bytes params;
    uint256 nativeValue;
    uint256 earliestExecution;
    uint256 expiry;
}
