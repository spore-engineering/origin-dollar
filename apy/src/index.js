const ethers = require("ethers");
const BigNumber = require("bignumber.js");

const OUSDArtifact = require("../../contracts/deployments/mainnet/OUSD.json");
const contractInterface = new ethers.utils.Interface(OUSDArtifact.abi);
const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);

const logFilter = {
  address: "0x2A8e1E676Ec238d8A992307B495b45B3fEAa5e86",
  topics: [
    // TotalSupplyUpdated event
    "0x99e56f783b536ffacf422d59183ea321dd80dcd6d23daa13023e8afea38c3df1",
  ],
  // OUSD genesis block
  fromBlock: 10884563,
};

const secondsInDay = new BigNumber("24").times("60").times("60");
const secondsInYear = new BigNumber("365").times(secondsInDay);

const main = async () => {
  const logs = await provider.getLogs(logFilter);

  let creditsPerToken = new BigNumber("0"),
    prevCreditsPerToken = new BigNumber("0"),
    blockTimestamp = new BigNumber("0"),
    prevBlockTimestamp = new BigNumber("0");

  for (log of logs) {
    const parsedLog = contractInterface.parseLog(log);

    blockTimestamp = new BigNumber(
      (await provider.getBlock(log.blockNumber)).timestamp
    );

    // In seconds
    const timeDelta = blockTimestamp.minus(prevBlockTimestamp);

    if (timeDelta.gt(secondsInDay)) {
      prevBlockTimestamp = new BigNumber(blockTimestamp);
      prevCreditsPerToken = creditsPerToken;
      creditsPerToken = new BigNumber(
        parsedLog.args.creditsPerToken.toString()
      );
      const percentDelta = prevCreditsPerToken
        .minus(creditsPerToken)
        .div(creditsPerToken)
        .times(100);
      const estimatedAPR = percentDelta.times(secondsInYear.div(timeDelta));
      console.log(`${estimatedAPR.toFixed(2)}%`);
    }
  }
};

main();
