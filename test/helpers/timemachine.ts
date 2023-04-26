import { ethers } from "hardhat";

export async function advanceTimeSeconds(
  _seconds: number | string
): Promise<void> {
  await ethers.provider.send("evm_increaseTime", [_seconds]);
  await ethers.provider.send("evm_mine", []);
}

export async function getCurrBlockTs() {
  const blockNumber = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNumber!);
  return block?.timestamp;
}
