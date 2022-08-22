// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.16;

contract MasterChef {
    // Info of each pool.
    struct PoolInfo {
        address lpToken; // Address of LP token contract.
        uint256 allocPoint; // How many allocation points assigned to this pool. CAKEs to distribute per block.
        uint256 lastRewardBlock; // Last block number that CAKEs distribution occurs.
        uint256 accCakePerShare; // Accumulated CAKEs per share, times 1e12. See below.
    }

    // Info of each pool.
    PoolInfo[] public poolInfo;
}
