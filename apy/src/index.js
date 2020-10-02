const ethers = require("ethers");
const { BigNumber } = ethers;

const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);

const VaultArtifact = require("../../contracts/deployments/mainnet/Vault.json");
const contractInterface = new ethers.utils.Interface(VaultArtifact.abi);
const address = "0x8ba1f109551bD432803012645Ac136ddd64DBA72";
const signer = new ethers.VoidSigner(address, provider);
const vault = new ethers.Contract(
  "0x277e80f3e14e7fb3fc40a9d6184088e0241034bd",
  VaultArtifact.abi,
  signer
);

const secondsInDay = BigNumber.from("24").mul("60").mul("60");
const secondsInYear = BigNumber.from("365").mul(secondsInDay);

const assets = {
  // Value is address, decimals, mint/redeem total over period
  DAI: ["0x6b175474e89094c44da98b954eedeac495271d0f", 18],
  USDC: ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", 6],
  USDT: ["0xdac17f958d2ee523a2206206994597c13d831ec7", 6],
};
// Lookup asset name by address
const addressAssetMap = Object.entries(assets).reduce(
  (obj, item) => ({ ...obj, [item[1][0]]: item[0] }),
  {}
);
// Map of asset symbol to a running mint/redeem tally, this will be initialised
// from the first event after the fromBlock
let mintRedeemTally = Object.entries(assets).reduce(
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
    address: "0x277e80f3e14e7fb3fc40a9d6184088e0241034bd",
    topics: [
      // OR
      [
        // Mint(address addr, uint256 amount)
        "0x0f6798a560793a54c3bcfe86a93cde1e73087d944c0ea20544137d4121396885",
        // Redeem(uint256 amount) (amount is denominated in OUSD)
        "0x222838db2794d11532d940e8dec38ae307ed0b63cd97c233322e221f998767a6",
      ],
    ],
    fromBlock,
  };
};

const main = async () => {
  const currentBlock = (await provider.getBlock()).number;
  // Calculate block that was 24 hours ago
  const fromBlock = Math.floor(currentBlock - secondsInDay / 13);
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

      if (parsedLog.name === "Mint") {
        // Check if asset address matches the one from the transaction
        // Note transaction asset address is checksummed
        if (assetAddress === parsedTransaction.args["_asset"].toLowerCase()) {
          // Matches, record the mint or redeem for this asset
          const amount = parsedTransaction.args["_amount"];
          mintRedeemTally[assetSymbol] = mintRedeemTally[assetSymbol].add(
            amount
          );
        }
      } else if (parsedLog.name === "Redeem") {
        // TODO how to handle redeems? We don't have a way to get the amount of
        // each that was transferred?
        console.log(parsedTransaction);
      }
    }

    blockTimestamp = BigNumber.from(
      (await provider.getBlock(log.blockNumber)).timestamp
    );

    if (!firstBlockTime) {
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
        .sub(mintRedeemTally[symbol]);
    }
    console.log(yields);

    // TODO extrapolate the APR from the increase
    // Block time difference in seconds to extrapolate out
    const timeDelta = blockTimestamp.sub(firstBlockTime);
  }
};

main();
