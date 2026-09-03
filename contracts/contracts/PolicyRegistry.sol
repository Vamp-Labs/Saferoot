// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ActionInput} from "./types/ActionInput.sol";

contract PolicyRegistry {
    address public immutable authoritySafe;

    mapping(bytes32 => uint256) public latestVersion;

    error NotAuthoritySafe();
    error VersionNotIncreasing();
    error ZeroAuthoritySafe();

    event PolicyApproved(
        bytes32 indexed policyId,
        uint256 version,
        address indexed safe,
        uint256 destinationChainId,
        address executor,
        uint256 activation,
        uint256 expiry,
        bytes encodedActions
    );

    constructor(address authoritySafe_) {
        if (authoritySafe_ == address(0)) revert ZeroAuthoritySafe();
        authoritySafe = authoritySafe_;
    }

    function registerPolicy(
        bytes32 policyId,
        uint256 version,
        uint256 destinationChainId,
        address executor,
        uint256 activation,
        uint256 expiry,
        ActionInput[] calldata actions
    ) external {
        if (msg.sender != authoritySafe) revert NotAuthoritySafe();
        if (version <= latestVersion[policyId]) revert VersionNotIncreasing();

        latestVersion[policyId] = version;

        emit PolicyApproved(
            policyId,
            version,
            authoritySafe,
            destinationChainId,
            executor,
            activation,
            expiry,
            abi.encode(actions)
        );
    }
}
