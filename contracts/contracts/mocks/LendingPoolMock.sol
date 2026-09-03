// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract LendingPoolMock {
    uint256 public maxLtvBps;
    bool public newDepositsPaused;

    event MaxLtvUpdated(uint256 newMaxLtvBps);
    event NewDepositsPaused();

    function setMaxLTV(uint256 newMaxLtvBps) external {
        maxLtvBps = newMaxLtvBps;
        emit MaxLtvUpdated(newMaxLtvBps);
    }

    function pauseNewDeposits() external {
        newDepositsPaused = true;
        emit NewDepositsPaused();
    }

    function noop() external pure {}
}
