import hre from "hardhat";
import fs from "fs";
const contracts = JSON.parse(fs.readFileSync(`./contracts.json`, "utf-8"));

export async function verifyContracts(): Promise<void> {
  if (contracts.network !== hre.network.name) {
    throw new Error(
      "Contracts are not deployed on the same network, that you are trying to verify!"
    );
  }

  const facetsKeys = Object.keys(contracts.facets);

  for (let i = 0; i < facetsKeys.length; i++) {
    try {
      await hre.run("verify:verify", {
        address: contracts.facets[facetsKeys[i]],
        constructorArguments: [],
      });
    } catch (error: any) {
      logError(facetsKeys[i], error.message);
    }
  }
}

function logError(contractName: string, msg: string) {
  console.log(
    `\x1b[31mError while trying to verify contract: ${contractName}!`
  );
  console.log(`Error message: ${msg}`);
  resetConsoleColor();
}

function resetConsoleColor() {
  console.log("\x1b[0m");
}
