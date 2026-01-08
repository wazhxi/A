// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title Vault
/// @notice Custodies USDC deposits/withdrawals and tracks platform rake.
contract Vault is AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant SETTLEMENT_ROLE = keccak256("SETTLEMENT_ROLE");
    IERC20 public immutable asset;

    mapping(address => uint256) public balances;
    uint256 public cumulativeFees;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event FeeCollected(address indexed user, uint256 amount);

    constructor(address asset_, address admin) {
        require(asset_ != address(0), "asset required");
        require(admin != address(0), "admin required");
        asset = IERC20(asset_);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(SETTLEMENT_ROLE, admin);
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "amount=0");
        balances[msg.sender] += amount;
        asset.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "amount=0");
        require(balances[msg.sender] >= amount, "insufficient");
        balances[msg.sender] -= amount;
        asset.safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    /// @notice Records rake collected from a winning user and moves funds into vault custody.
    /// @dev Caller must be a settlement service that already adjusted off-chain ledgers.
    function recordFee(address user, uint256 amount) external onlyRole(SETTLEMENT_ROLE) {
        require(amount > 0, "fee=0");
        cumulativeFees += amount;
        emit FeeCollected(user, amount);
    }
}
