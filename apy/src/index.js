/*
  APY Calculator for OUSD. This grabs balances of all assets at a block and
  compares the balance to a previous block discount all transfers in/out of the
  OUSD Vault. It then compares the two block times and estimates an APY.

  Usage:
    - Setup environment:
      export PROVIDER_URL=<url>

  Run with node index.js
*/
const ethers = require("ethers");
const { BigNumber, utils } = ethers;
const BigNumberJS = require("bignumber.js");

const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);

// Random VoidSigner
const address = "0x8ba1f109551bD432803012645Ac136ddd64DBA72";
const signer = new ethers.VoidSigner(address, provider);
// Vault
const VaultArtifact = require("../../contracts/deployments/mainnet/Vault.json");
const contractInterface = new ethers.utils.Interface(VaultArtifact.abi);
const vaultAddress = ethers.utils.getAddress(
  "0x277e80f3e14e7fb3fc40a9d6184088e0241034bd"
);
const vault = new ethers.Contract(vaultAddress, VaultArtifact.abi, signer);

// Useful constants
const secondsInDay = BigNumber.from("24").mul("60").mul("60");
const secondsInYear = BigNumber.from("365").mul(secondsInDay);
// Days to run over, e.g. for the default of 7 days this will grab a block
// 7 days ago, and compare every block that included a mint or redeem until the
// present
const numberOfDays = 7;

const assets = {
  // Value is address, decimals, mint/redeem total over period
  DAI: [
    ethers.utils.getAddress("0x6b175474e89094c44da98b954eedeac495271d0f"),
    18,
  ],
  USDC: [
    ethers.utils.getAddress("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
    6,
  ],
  USDT: [
    ethers.utils.getAddress("0xdac17f958d2ee523a2206206994597c13d831ec7"),
    6,
  ],
};
const strategyAddresses = [
  ethers.utils.getAddress("0x47211B1D1F6Da45aaEE06f877266E072Cf8BaA74"),
];
// Lookup asset name by address
const addressAssetMap = Object.entries(assets).reduce(
  (obj, item) => ({ ...obj, [item[1][0]]: item[0] }),
  {}
);
// Map of asset symbol to a running mint/redeem tally, this will be initialised
// from the first event after the fromBlock
let transferTotals = Object.entries(assets).reduce(
  (obj, item) => ({ ...obj, [item[0]]: BigNumber.from(0) }),
  {}
);
// Map of block number to asset balances
const blockBalances = {};

/**
 * Returns a log filter to filter Vault mint and redeems.
 */
const getLogFilter = (fromBlock) => {
  return {
    // Vault
    address: vaultAddress,
    topics: [
      // OR
      [
        // Mint(address addr, uint256 amount) emitted by calls to mint() and
        // mintMultiple()
        "0x0f6798a560793a54c3bcfe86a93cde1e73087d944c0ea20544137d4121396885",
        // Redeem(uint256 amount)
        "0x222838db2794d11532d940e8dec38ae307ed0b63cd97c233322e221f998767a6",
      ],
    ],
    fromBlock,
  };
};

const fullScale = (amount, assetSymbol) => {
  return ethers.utils.parseUnits(
    ethers.utils.formatUnits(amount, assets[assetSymbol][1]),
    18
  );
};

const displayCurrency = (amount) => {
  return `$${Number(ethers.utils.formatUnits(amount, 18)).toFixed(2)}`;
};

const main = async () => {
  const currentBlock = (await provider.getBlock()).number;
  // Calculate block that was 24 hours ago
  const fromBlock = Math.floor(
    currentBlock - (secondsInDay * numberOfDays) / 13
  );
  const logs = await provider.getLogs(getLogFilter(fromBlock));

  let firstBlockTime;
  // Maintain a running tally of mints and redeems so they can be removed to
  // calculate the actual change in assets
  for (log of logs) {
    // Parse the log for event type
    const parsedLog = contractInterface.parseLog(log);
    // Parse the transaction to get out the asset that was minted/redeemed and
    // the amount
    const transaction = await provider.getTransaction(log.transactionHash);
    const parsedTransaction = contractInterface.parseTransaction(transaction);

    for ([assetSymbol, [assetAddress, assetDecimals]] of Object.entries(
      assets
    )) {
      const balanceAtBlock = await vault["checkBalance(address)"](
        assetAddress,
        {
          blockTag: log.blockNumber,
        }
      );
      if (!blockBalances[log.blockNumber]) blockBalances[log.blockNumber] = {};
      blockBalances[log.blockNumber][assetSymbol] = balanceAtBlock;
    }

    // Get all ERC20 transfers from the transaction unless this is the first
    // seen block
    if (firstBlockTime) {
      const receipt = await provider.getTransactionReceipt(transaction.hash);
      for (log of receipt.logs) {
        if (log.topics[0] === utils.id("Transfer(address,address,uint256)")) {
          const assetSymbol = addressAssetMap[log.address];
          if (assetSymbol) {
            const toAddress = utils.defaultAbiCoder.decode(
              ["address"],
              log.topics[1]
            )[0];
            const fromAddress = utils.defaultAbiCoder.decode(
              ["address"],
              log.topics[2]
            )[0];
            // Not interested in transfers to/from our own strategies
            if (
              !strategyAddresses.includes(fromAddress) &&
              !strategyAddresses.includes(toAddress)
            ) {
              const amount = utils.defaultAbiCoder.decode(
                ["uint256"],
                log.data
              )[0];
              if (fromAddress === vaultAddress) {
                console.debug("Transfer in for", Number(amount), assetSymbol);
                transferTotals[assetSymbol] = transferTotals[assetSymbol].add(
                  amount
                );
              } else if (toAddress === vaultAddress) {
                console.debug("Transfer out for", Number(amount), assetSymbol);
                transferTotals[assetSymbol] = transferTotals[assetSymbol].sub(
                  amount
                );
              }
            }
          }
        }
      }
    }

    blockTimestamp = BigNumber.from(
      (await provider.getBlock(log.blockNumber)).timestamp
    );

    if (!firstBlockTime) {
      console.log("First block", log.blockNumber);
      // First seen block, record the timestamp
      firstBlockTime = blockTimestamp;
      // All ready to start calculating, but we need another event
      continue;
    }

    const blocks = Object.keys(blockBalances);
    const firstBlockBalances = blockBalances[blocks[0]];
    const lastBlockBalances = blockBalances[blocks[blocks.length - 1]];

    const yields = {};
    for (symbol of Object.keys(firstBlockBalances)) {
      yields[symbol] = lastBlockBalances[symbol]
        .sub(firstBlockBalances[symbol])
        .sub(transferTotals[symbol]);
    }

    const firstBlockTotal = Object.entries(firstBlockBalances).reduce(
      (total, x) => total.add(fullScale(x[1], x[0])),
      BigNumber.from("0")
    );

    // Calculate total yield in 1e18
    const yieldTotal = Object.entries(yields).reduce(
      (total, x) => total.add(fullScale(x[1], x[0])),
      BigNumber.from("0")
    );

    // Block time difference in seconds to extrapolate out
    const timeDelta = blockTimestamp.sub(firstBlockTime);
    const timeProportion = secondsInYear.div(timeDelta);

    const yield = (yieldTotal / firstBlockTotal) * timeProportion * 100;

    console.log("Block number", log.blockNumber);
    console.log("First seen block total:", displayCurrency(firstBlockTotal));
    console.log("Yield since first seen block:", displayCurrency(yieldTotal));
    console.log(`APY ${yield.toFixed(2)}%`);
  }
};

main();
