// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

library PolicyApprovedEvent {
    bytes32 internal constant SIGNATURE =
        keccak256("PolicyApproved(bytes32,uint256,address,uint256,address,uint256,uint256,bytes)");
}
