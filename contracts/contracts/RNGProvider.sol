// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title RNGProvider
/// @notice Integrates VRF for shuffle entropy; mocked locally via fulfillRandomness.
contract RNGProvider is AccessControl {
    bytes32 public constant ORCHESTRATOR_ROLE = keccak256("ORCHESTRATOR_ROLE");

    event ShuffleRequested(uint256 indexed handId, bytes32 requestId);
    event ShuffleReady(uint256 indexed handId, bytes32 requestId, uint256 randomness);

    uint64 private requestNonce;

    constructor(address admin) {
        require(admin != address(0), "admin required");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORCHESTRATOR_ROLE, admin);
    }

    /// @notice Requests randomness for a hand; in production bridged to Chainlink VRF.
    function requestShuffle(uint256 handId) external onlyRole(ORCHESTRATOR_ROLE) returns (bytes32 requestId) {
        requestId = keccak256(abi.encode(handId, blockhash(block.number - 1), requestNonce++));
        emit ShuffleRequested(handId, requestId);
    }

    /// @notice Local/test-only function to simulate VRF fulfillment.
    function fulfillRandomness(uint256 handId, bytes32 requestId, uint256 randomness) external onlyRole(ORCHESTRATOR_ROLE) {
        emit ShuffleReady(handId, requestId, randomness);
    }
}
