// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {SafeRootPolicyExecutor} from "../SafeRootPolicyExecutor.sol";

contract MaliciousReentrantTarget {
    SafeRootPolicyExecutor public immutable executor;
    bytes32 public reentryPolicyId;
    bytes32 public reentryActionId;
    bytes public reentryParams;
    bool public attempted;
    bool public reentrySucceeded;

    constructor(SafeRootPolicyExecutor executor_) {
        executor = executor_;
    }

    function arm(bytes32 policyId, bytes32 actionId, bytes calldata params) external {
        reentryPolicyId = policyId;
        reentryActionId = actionId;
        reentryParams = params;
    }

    function trigger() external {
        attempted = true;
        (bool ok, ) = address(executor).call(
            abi.encodeWithSelector(
                SafeRootPolicyExecutor.executeAction.selector,
                reentryPolicyId,
                reentryActionId,
                address(this),
                this.trigger.selector,
                reentryParams,
                uint256(0)
            )
        );
        reentrySucceeded = ok;
    }
}
