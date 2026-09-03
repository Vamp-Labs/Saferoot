// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ActionInput} from "./types/ActionInput.sol";
import {IAttestcoinVerifier} from "./interfaces/IAttestcoinVerifier.sol";
import {PolicyApprovedEvent} from "./libraries/PolicyApprovedEvent.sol";

contract SafeRootPolicyExecutor is ReentrancyGuard, Ownable {
    struct ActionRecord {
        bytes32 actionId;
        address target;
        bytes4 selector;
        bytes params;
        uint256 nativeValue;
        uint256 earliestExecution;
        uint256 expiry;
        bool executed;
    }

    struct PolicyRecord {
        bytes32 policyId;
        uint256 version;
        address safe;
        uint256 activation;
        uint256 expiry;
        bool active;
        bool paused;
    }

    uint256 public constant SUPPORTED_SOURCE_CHAIN_ID = 11155111;

    address public immutable authoritySafe;
    address public immutable policyRegistry;
    address public immutable guardian;
    IAttestcoinVerifier public immutable verifier;

    mapping(bytes32 => PolicyRecord) private _policies;
    mapping(bytes32 => mapping(bytes32 => ActionRecord)) private _actions;
    mapping(bytes32 => mapping(bytes32 => bool)) private _actionExists;
    mapping(bytes32 => mapping(bytes32 => uint256)) private _actionVersion;
    mapping(address => mapping(bytes4 => bool)) public allowedCalls;
    mapping(bytes32 => bool) public usedProofHash;

    error ZeroAddressConfig();
    error GuardianMustDifferFromAuthoritySafe();
    error NotGuardian();
    error UnknownPolicy();

    error SafeMismatch();
    error WrongDestinationChain();
    error WrongExecutor();
    error StalePolicyVersion();
    error PolicyAlreadyExpired();
    error ProofAlreadyUsed();
    error EmitterNotApproved();

    error PolicyNotActive();
    error PolicyNotYetValid();
    error PolicyExpired();
    error ExecutorPaused();
    error ActionNotFound();
    error ActionAlreadyExecuted();
    error TargetMismatch();
    error FunctionNotAllowed();
    error CalldataMismatch();
    error AmountExceedsApproval();
    error NotYetEligible();
    error ActionExpired();

    event PolicyActivated(
        bytes32 indexed policyId,
        uint256 version,
        address safe,
        uint256 activation,
        uint256 expiry
    );
    event ActionExecuted(
        bytes32 indexed policyId,
        bytes32 indexed actionId,
        address target,
        bool success
    );
    event GuardianPaused(
        bytes32 indexed policyId,
        address guardian,
        string reason,
        uint256 timestamp
    );
    event AllowedCallUpdated(address indexed target, bytes4 indexed selector, bool allowed);

    modifier onlyGuardian() {
        if (msg.sender != guardian) revert NotGuardian();
        _;
    }

    constructor(
        address authoritySafe_,
        address policyRegistry_,
        address guardian_,
        IAttestcoinVerifier verifier_,
        address owner_
    ) Ownable(owner_) {
        if (
            authoritySafe_ == address(0) ||
            policyRegistry_ == address(0) ||
            guardian_ == address(0) ||
            address(verifier_) == address(0) ||
            owner_ == address(0)
        ) revert ZeroAddressConfig();
        if (guardian_ == authoritySafe_) revert GuardianMustDifferFromAuthoritySafe();

        authoritySafe = authoritySafe_;
        policyRegistry = policyRegistry_;
        guardian = guardian_;
        verifier = verifier_;
    }

    function setAllowedCall(address target, bytes4 selector, bool allowed) external onlyOwner {
        allowedCalls[target][selector] = allowed;
        emit AllowedCallUpdated(target, selector, allowed);
    }

    function activatePolicy(
        bytes calldata attestcoinProof,
        bytes32 policyId,
        uint256 version,
        address safe,
        uint256 destinationChainId,
        address executor,
        uint256 activation,
        uint256 expiry,
        ActionInput[] calldata actions
    ) external {
        bytes32 proofHash = keccak256(attestcoinProof);
        if (usedProofHash[proofHash]) revert ProofAlreadyUsed();

        bytes32[] memory expectedTopics = new bytes32[](3);
        expectedTopics[0] = PolicyApprovedEvent.SIGNATURE;
        expectedTopics[1] = policyId;
        expectedTopics[2] = bytes32(uint256(uint160(safe)));

        bytes memory expectedData = abi.encode(
            version,
            destinationChainId,
            executor,
            activation,
            expiry,
            abi.encode(actions)
        );

        bool verified = verifier.verifyEventInclusion(
            attestcoinProof,
            policyRegistry,
            SUPPORTED_SOURCE_CHAIN_ID,
            expectedTopics,
            expectedData
        );
        if (!verified) revert EmitterNotApproved();

        if (safe != authoritySafe) revert SafeMismatch();
        if (destinationChainId != block.chainid) revert WrongDestinationChain();
        if (executor != address(this)) revert WrongExecutor();

        uint256 storedVersion = _policies[policyId].version;
        if (storedVersion != 0 && version <= storedVersion) revert StalePolicyVersion();

        usedProofHash[proofHash] = true;

        if (block.timestamp > expiry) revert PolicyAlreadyExpired();

        PolicyRecord storage record = _policies[policyId];
        record.policyId = policyId;
        record.version = version;
        record.safe = safe;
        record.activation = activation;
        record.expiry = expiry;
        record.active = true;
        record.paused = false;

        uint256 actionCount = actions.length;
        for (uint256 i = 0; i < actionCount; i++) {
            ActionInput calldata action = actions[i];
            _actions[policyId][action.actionId] = ActionRecord({
                actionId: action.actionId,
                target: action.target,
                selector: action.selector,
                params: action.params,
                nativeValue: action.nativeValue,
                earliestExecution: action.earliestExecution,
                expiry: action.expiry,
                executed: false
            });
            _actionExists[policyId][action.actionId] = true;
            _actionVersion[policyId][action.actionId] = version;
        }

        emit PolicyActivated(policyId, version, safe, activation, expiry);
    }

    function executeAction(
        bytes32 policyId,
        bytes32 actionId,
        address target,
        bytes4 selector,
        bytes calldata params,
        uint256 nativeValue
    ) external payable nonReentrant {
        PolicyRecord storage policy = _policies[policyId];
        if (!policy.active) revert PolicyNotActive();
        if (block.timestamp < policy.activation) revert PolicyNotYetValid();
        if (block.timestamp > policy.expiry) revert PolicyExpired();
        if (policy.paused) revert ExecutorPaused();

        if (!_actionExists[policyId][actionId] || _actionVersion[policyId][actionId] != policy.version) {
            revert ActionNotFound();
        }

        ActionRecord storage record = _actions[policyId][actionId];
        if (record.executed) revert ActionAlreadyExecuted();
        if (target != record.target) revert TargetMismatch();
        if (selector != record.selector) revert FunctionNotAllowed();
        if (!allowedCalls[target][selector]) revert FunctionNotAllowed();
        if (keccak256(params) != keccak256(record.params)) revert CalldataMismatch();
        if (nativeValue != record.nativeValue) revert AmountExceedsApproval();
        if (block.timestamp < record.earliestExecution) revert NotYetEligible();
        if (block.timestamp > record.expiry) revert ActionExpired();

        record.executed = true;

        (bool success, ) = target.call{value: nativeValue}(abi.encodePacked(selector, params));

        emit ActionExecuted(policyId, actionId, target, success);
    }

    function guardianPause(bytes32 policyId, string calldata reason) external onlyGuardian {
        PolicyRecord storage policy = _policies[policyId];
        if (!policy.active) revert UnknownPolicy();

        policy.paused = true;

        emit GuardianPaused(policyId, msg.sender, reason, block.timestamp);
    }

    function getPolicy(bytes32 policyId) external view returns (PolicyRecord memory) {
        return _policies[policyId];
    }

    function getAction(bytes32 policyId, bytes32 actionId) external view returns (ActionRecord memory) {
        return _actions[policyId][actionId];
    }
}
