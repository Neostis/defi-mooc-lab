const { expect } = require("chai");
const { network, ethers } = require("hardhat");
const { BigNumber, utils } = require("ethers");

describe("Liquidation New Account", function () {
  console.log("Jeerapat Somsri 6210450504");

  it("operate 7000 USDC", async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.ALCHE_API,
            blockNumber: 11946807,
          },
        },
      ],
    });

    const gasPrice = 0;
    const accounts = await ethers.getSigners();
    const liquidator = accounts[0].address;

    const liquidatedAddress =
      "0x00000000000000000000000063f6037d3e9d51ad865056BF7792029803b6eEfD".toLowerCase();

    const beforeLiquidationBalance = BigNumber.from(
      await hre.network.provider.request({
        method: "eth_getBalance",
        params: [liquidator],
      })
    );

    const LiquidationOperator = await ethers.getContractFactory(
      "LiquidationOperator_3"
    );
    const liquidationOperator = await LiquidationOperator.deploy(
      (overrides = { gasPrice: gasPrice })
    );
    await liquidationOperator.deployed();

    //change to uint256
    //Ans 0.41509082489397497
    const liquidationTx = await liquidationOperator.operate(
      ethers.utils.parseUnits("8556", 6),
      (overrides = { gasPrice: gasPrice })
    );

    const liquidationReceipt = await liquidationTx.wait();

    const liquidationEvents = liquidationReceipt.logs.filter(
      (v) =>
        v &&
        v.topics &&
        v.address === "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9" &&
        Array.isArray(v.topics) &&
        v.topics.length > 3 &&
        v.topics[0] ===
          "0xe413a321e8681d831f4dbccbca790d2952b56f977908e45be37335533e005286"
    );

    const expectedLiquidationEvents = liquidationReceipt.logs.filter(
      (v) => v.topics[3] === liquidatedAddress
    );

    expect(
      expectedLiquidationEvents.length,
      "no expected liquidation"
    ).to.be.above(0);
    expect(liquidationEvents.length, "unexpected liquidation").to.be.equal(
      expectedLiquidationEvents.length
    );

    const afterLiquidationBalance = BigNumber.from(
      await hre.network.provider.request({
        method: "eth_getBalance",
        params: [liquidator],
      })
    );

    const profit = afterLiquidationBalance.sub(beforeLiquidationBalance);
    console.log(`Profit of 7000 USDC is ${utils.formatEther(profit)} ETH`);


    expect(profit.gt(BigNumber.from(0)), "not profitable").to.be.true;
  });

});
