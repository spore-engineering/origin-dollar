const {
  isMainnet,
  isRinkeby,
  isMainnetOrRinkebyOrFork,
  isGanache,
  getAssetAddresses,
} = require("../test/helpers.js");
const addresses = require("../utils/addresses");
const { getTxOpts } = require("../utils/tx");

let totalDeployGasUsed = 0;

// Wait for 3 blocks confirmation on Mainnet/Rinkeby.
const NUM_CONFIRMATIONS = isMainnet || isRinkeby ? 3 : 0;

function log(msg, deployResult = null) {
  if (isMainnet || isRinkeby || process.env.VERBOSE) {
    if (deployResult) {
      const gasUsed = Number(deployResult.receipt.gasUsed.toString());
      totalDeployGasUsed += gasUsed;
      msg += ` Address: ${deployResult.address} Gas Used: ${gasUsed}`;
    }
    console.log("INFO:", msg);
  }
}

const threePoolStrategyDeploy = async ({ getNamedAccounts, deployments }) => {
  let transaction;

  const { deploy } = deployments;
  const { governorAddr, deployerAddr } = await getNamedAccounts();

  console.log("Running 10_vault_split deployment...");

  const sGovernor = ethers.provider.getSigner(governorAddr);
  const sDeployer = ethers.provider.getSigner(deployerAddr);
  const assetAddresses = await getAssetAddresses(deployments);

  // Deploy a new vault.
  await deploy("ThreePoolStrategy", {
    from: governorAddr, // TODO: CHANGE
    ...(await getTxOpts()),
  });

  const tokenAddresses = [
    assetAddresses.DAI,
    assetAddresses.USDC,
    assetAddresses.USDT,
  ];
  const threePoolStrategy = await ethers.getContract("ThreePoolStrategy");
  const cVaultProxy = await ethers.getContract("VaultProxy");
  await threePoolStrategy
    .connect(sGovernor)
    .initialize(
      addresses.dead,
      cVaultProxy.address,
      assetAddresses.ThreePoolToken,
      [assetAddresses.USDC, assetAddresses.USDT],
      [assetAddresses.ThreePool, assetAddresses.ThreePool],
      await getTxOpts()
    );
  await threePoolStrategy
    .connect(sGovernor)
    .setup(
      assetAddresses.ThreePool,
      assetAddresses.ThreePoolToken,
      [assetAddresses.DAI, assetAddresses.USDC, assetAddresses.USDT],
      [0, 50000, 50000]
    );

  return true;
};

threePoolStrategyDeploy.dependencies = ["core"];

module.exports = threePoolStrategyDeploy;