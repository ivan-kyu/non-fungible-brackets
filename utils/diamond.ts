import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";

/**
 * Utility library for interacting with Diamonds
 */
export namespace Diamond {
  export const FacetCutAction = {
    Add: 0,
    Replace: 1,
    Remove: 2,
  };

  /**
   * Computes the interface id for a given {@link Contract}
   * Includes inherited functions
   * @param contract the Contract
   * @returns The Contract interface id
   */
  export function getInterfaceId(contract: Contract): string {
    const selectors = getSelectorsFor(contract);

    const result = selectors.reduce((result, value) => {
      return result.xor(value);
    }, BigNumber.from(0));

    return ethers.utils.hexZeroPad(ethers.utils.hexValue(result), 4);
  }

  /**
   * Computes diamond selectors for a given {@link Contract}
   * @param contract the Contract to get selectors for
   */
  export function getSelectorsFor(contract: Contract) {
    const signatures: string[] = Object.keys(contract.interface.functions);

    return signatures.reduce((acc: string[], val) => {
      // c_0xe50f189a(bytes32) is added by coverage and it acts erroneously resulting in duplicated function
      // selectors
      if (val !== "init(bytes)" && val !== "c_0xe50f189a(bytes32)") {
        acc.push(contract.interface.getSighash(val));
      }
      return acc;
    }, []);
  }

  /**
   * Computes all selectors for the provided contracts and returns them as {@link FacetCutAction} Add selectors
   * @param facets
   */
  export function getAsAddCuts(facets: Array<Contract>) {
    const diamondCut = [];

    for (const facet of facets) {
      diamondCut.push([
        facet.address,
        Diamond.FacetCutAction.Add,
        Diamond.getSelectorsFor(facet),
      ]);
    }
    return diamondCut;
  }

  /**
   * Returns an instance of the Diamond contract with the provided facet ABI
   * @param diamond
   * @param facetName
   */
  export async function asFacet(
    diamond: Contract,
    facetName: string
  ): Promise<Contract> {
    return await ethers.getContractAt(facetName, diamond.address);
  }
}
