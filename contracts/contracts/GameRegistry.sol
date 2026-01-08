// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title GameRegistry
/// @notice Records on-chain metadata for each hand for auditability.
contract GameRegistry is AccessControl {
    bytes32 public constant ORCHESTRATOR_ROLE = keccak256("ORCHESTRATOR_ROLE");

    struct HandRecord {
        uint64 startTime;
        uint64 endTime;
        bytes32 vrfRequestId;
        bytes32 deckHash;
        uint256[3] startStacks;
        uint256[3] endStacks;
        bool finalized;
    }

    mapping(uint256 => HandRecord) public hands;

    event HandStarted(
        uint256 indexed handId,
        bytes32 vrfRequestId,
        uint256[3] startStacks,
        uint64 startTime
    );
    event HandFinalized(uint256 indexed handId, bytes32 deckHash, uint256[3] endStacks, uint64 endTime);

    constructor(address admin) {
        require(admin != address(0), "admin required");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORCHESTRATOR_ROLE, admin);
    }

    function startHand(uint256 handId, bytes32 vrfRequestId, uint256[3] calldata startStacks) external onlyRole(ORCHESTRATOR_ROLE) {
        HandRecord storage record = hands[handId];
        require(record.startTime == 0, "hand exists");
        record.startTime = uint64(block.timestamp);
        record.vrfRequestId = vrfRequestId;
        record.startStacks = startStacks;
        emit HandStarted(handId, vrfRequestId, startStacks, record.startTime);
    }

    function finalizeHand(uint256 handId, bytes32 deckHash, uint256[3] calldata endStacks) external onlyRole(ORCHESTRATOR_ROLE) {
        HandRecord storage record = hands[handId];
        require(record.startTime != 0, "hand missing");
        require(!record.finalized, "finalized");
        record.endTime = uint64(block.timestamp);
        record.deckHash = deckHash;
        record.endStacks = endStacks;
        record.finalized = true;
        emit HandFinalized(handId, deckHash, endStacks, record.endTime);
    }
}
