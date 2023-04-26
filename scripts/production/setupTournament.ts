import { ethers } from "hardhat";
import { IDiamond } from "../typechain";
import * as dotenv from "dotenv";
import { assert } from "chai";
dotenv.config();

export async function setupTournament(
  tournamentName: string,
  tournamentType: number,
  sportsLeagueName: string,
  sport: number
) {
  const provider = new ethers.providers.InfuraProvider("matic");

  let wallet = new ethers.Wallet(process.env.OWNER!);
  wallet = wallet.connect(provider);

  assert(
    process.env.DIAMOND_CONTRACT !== undefined,
    "DIAMOND_CONTRACT is not set"
  );
  const diamondAddress = process.env.DIAMOND_CONTRACT!;

  const nfbDiamond = (await ethers.getContractAt(
    "IDiamond",
    diamondAddress
  )) as IDiamond;

  console.log("Adding a tournament format...");

  const addFormatTx = await nfbDiamond
    .connect(wallet)
    .addTournamentFormat(tournamentName, tournamentType, {
      gasLimit: 300000,
      gasPrice: 140000000000,
    });

  await addFormatTx.wait();

  console.log("Adding a sports league...");

  const addSportsLeagueTx = await nfbDiamond
    .connect(wallet)
    .addSportsLeague(sportsLeagueName, sport, {
      gasLimit: 300000,
      gasPrice: 140000000000,
    });

  await addSportsLeagueTx.wait();

  console.log(`Tournament set up!\n`);
}

module.exports = setupTournament;
