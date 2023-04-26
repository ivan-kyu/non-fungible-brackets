import hre, { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

// Funds the relayer (EOA) from an external EOA
async function fundRelayer() {
  const provider = new ethers.providers.InfuraProvider("matic");
  const polygonRelayerAddress = "0xb388c9500f70eba73b9282253e6a23982d443b90";
  const maticToFund = "19";

  const wallet = new ethers.Wallet(process.env.OWNER!, provider);

  const tx = {
    to: polygonRelayerAddress,
    value: ethers.utils.parseEther(maticToFund),
    data: "0x",
    gasLimit: ethers.utils.hexlify(30000),
    gasPrice: ethers.utils.hexlify(parseInt(await provider.getGasPrice())),
  };

  const transaction = await wallet.sendTransaction(tx);
  transaction.wait();
  console.log("Txhash: ", transaction.hash);
}

fundRelayer();
