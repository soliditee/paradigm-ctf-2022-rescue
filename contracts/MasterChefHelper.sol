// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.16;

import "./UniswapV2Like.sol";

interface ERC20Like {
    function transferFrom(
        address,
        address,
        uint256
    ) external;

    function transfer(address, uint256) external;

    function approve(address, uint256) external;

    function balanceOf(address) external view returns (uint256);
}

interface MasterChefLike {
    function poolInfo(uint256 id)
        external
        view
        returns (
            address lpToken,
            uint256 allocPoint,
            uint256 lastRewardBlock,
            uint256 accSushiPerShare
        );
}

contract MasterChefHelper {
    MasterChefLike public constant masterchef = MasterChefLike(0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd);
    UniswapV2RouterLike public constant router = UniswapV2RouterLike(0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F);

    function swapTokenForPoolToken(
        uint256 poolId,
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut
    ) external {
        (address lpToken, , , ) = masterchef.poolInfo(poolId);
        address tokenOut0 = UniswapV2PairLike(lpToken).token0();
        address tokenOut1 = UniswapV2PairLike(lpToken).token1();

        ERC20Like(tokenIn).approve(address(router), type(uint256).max);
        ERC20Like(tokenOut0).approve(address(router), type(uint256).max);
        ERC20Like(tokenOut1).approve(address(router), type(uint256).max);
        ERC20Like(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        // swap for both tokens of the lp pool
        _swap(tokenIn, tokenOut0, amountIn / 2);
        _swap(tokenIn, tokenOut1, amountIn / 2);

        // add liquidity and give lp tokens to msg.sender
        _addLiquidity(tokenOut0, tokenOut1, minAmountOut);
    }

    function _addLiquidity(
        address token0,
        address token1,
        uint256 minAmountOut
    ) internal {
        (, , uint256 amountOut) = router.addLiquidity(
            token0,
            token1,
            ERC20Like(token0).balanceOf(address(this)), // The amount of tokenA to add as liquidity if the B/A price is <= amountBDesired/amountADesired (A depreciates).
            ERC20Like(token1).balanceOf(address(this)), // The amount of tokenB to add as liquidity if the A/B price is <= amountADesired/amountBDesired (B depreciates). For poolId 21, this is WETH
            0,
            0,
            msg.sender,
            block.timestamp
        );
        require(amountOut >= minAmountOut);
    }

    function _swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        // Swaps an exact amount of input tokens for as many output tokens as possible
        router.swapExactTokensForTokens(
            amountIn, // The amount of input tokens to send.
            0, // The minimum amount of output tokens that must be received for the transaction not to revert.
            path,
            address(this), // Recipient of the output tokens.
            block.timestamp
        );
    }
}
