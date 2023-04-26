import { ethers } from "hardhat";
import { IDiamond } from "../typechain";
import * as dotenv from "dotenv";
dotenv.config();

async function updateRound(diamondAddress: string, tournamentId: number) {
  const provider = new ethers.providers.AlchemyProvider(
    "maticmum",
    process.env.ALCHEMY_KEY
  );

  const wallet = new ethers.Wallet(process.env.OWNER!, provider);

  const nfbDiamond = (await ethers.getContractAt(
    "IDiamond",
    diamondAddress,
    wallet
  )) as IDiamond;

  console.log("Updating the round ...");

  const updateRoundTx = await nfbDiamond.updateRound(tournamentId, {
    gasLimit: 300000,
  });

  await updateRoundTx.wait();

  console.log(`Tournament round updated!\n`);
}

module.exports = updateRound;
