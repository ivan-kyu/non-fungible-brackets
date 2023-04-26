import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "ethers";
import { Diamond } from "../utils/diamond";
import FacetCutAction = Diamond.FacetCutAction;

import { Deployer } from "../utils/deployer";

import Users, { Account } from "./helpers/users";
import { IDiamond, Test1Facet, Test2Facet } from "../typechain";
import { defaults, times } from "./helpers/constants";
import { getCurrBlockTs } from "./helpers/timemachine";
let users: Users;

describe("NFB Diamond", () => {
  let snapshotId: any;

  let nfbDiamond: IDiamond;

  let loupe: Contract,
    cut: Contract,
    ownership: Contract,
    accessControl: Contract,
    oracle: Contract,
    rewardPool: Contract,
    core: Contract,
    diamond: Contract;

  let nonOwner: Account;

  before(async () => {
    const signers = await ethers.getSigners();
    users = new Users(signers);
    nonOwner = users.user10;

    cut = await Deployer.deployContract("DiamondCutFacet");
    loupe = await Deployer.deployContract("DiamondLoupeFacet");
    ownership = await Deployer.deployContract("OwnershipFacet");
    accessControl = await Deployer.deployContract("AccessControlFacet");
    oracle = await Deployer.deployContract("NFBOracleFacet");
    rewardPool = await Deployer.deployContract("NFBRewardPoolFacet");
    core = await Deployer.deployContract("NFBCoreFacet");

    diamond = await Deployer.deployDiamond(
      "Diamond",
      [cut, loupe, ownership, accessControl, oracle, rewardPool, core],
      users.deployer.address
    );

    nfbDiamond = (await ethers.getContractAt(
      "IDiamond",
      diamond.address
    )) as IDiamond;

    // add core params
    const ts = await getCurrBlockTs();
    // await nfbDiamond.setTournamentStartDate(ts + times.ONE_MIN);
    // await nfbDiamond.setMaxDivisionMembers(defaults.USERS_COUNT);
    // await nfbDiamond.setMaxRosterSize(defaults.ROSTER_SIZE);

    // await nfbDiamond.setTotalRounds(defaults.TOTAL_ROUNDS);
    // await nfbDiamond.setDraftStartDate(times.ONE_DAY);
    // await nfbDiamond.setReserveExpirationTime(ts + times.ONE_DAY);

    // await nfbDiamond.setStops(auctionStops.soft, auctionStops.hard);
    // await nfbDiamond.setMinAuctionAmount(defaults.ONE_TOKEN);
    // await nfbDiamond.setMinOutbidAmount(defaults.ONE_TOKEN);
  });

  beforeEach(async function () {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async function () {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  context("General Diamond Tests", async () => {
    it("should revert if owner is zero address", async () => {
      await expect(
        Deployer.deployDiamond("Diamond", [], ethers.constants.AddressZero)
      ).to.be.revertedWith("owner must not be 0x0");
    });

    it("should be deployed", async function () {
      expect(diamond.address).to.not.equal(ethers.constants.AddressZero);
    });

    it("should have 7 facets", async () => {
      const actualFacets = await nfbDiamond.facetAddresses();
      expect(actualFacets.length).to.be.equal(7);
      expect(actualFacets).to.eql([
        cut.address,
        loupe.address,
        ownership.address,
        accessControl.address,
        oracle.address,
        rewardPool.address,
        core.address,
      ]);
    });

    it("has correct function selectors linked to facet", async function () {
      const actualCutSelectors: Array<string> = Diamond.getSelectorsFor(cut);
      expect(
        await nfbDiamond.facetFunctionSelectors(cut.address)
      ).to.deep.equal(actualCutSelectors);

      const actualLoupeSelectors = Diamond.getSelectorsFor(loupe);
      expect(
        await nfbDiamond.facetFunctionSelectors(loupe.address)
      ).to.deep.equal(actualLoupeSelectors);

      const actualOwnerSelectors = Diamond.getSelectorsFor(ownership);
      expect(
        await nfbDiamond.facetFunctionSelectors(ownership.address)
      ).to.deep.equal(actualOwnerSelectors);

      const actualAccessControlSelectors =
        Diamond.getSelectorsFor(accessControl);
      expect(
        await nfbDiamond.facetFunctionSelectors(accessControl.address)
      ).to.deep.equal(actualAccessControlSelectors);

      const actualOracleSelectors = Diamond.getSelectorsFor(oracle);
      expect(
        await nfbDiamond.facetFunctionSelectors(oracle.address)
      ).to.deep.equal(actualOracleSelectors);

      const actualRewardPoolSelectors = Diamond.getSelectorsFor(rewardPool);
      expect(
        await nfbDiamond.facetFunctionSelectors(rewardPool.address)
      ).to.deep.equal(actualRewardPoolSelectors);

      const actualCoreSelectors = Diamond.getSelectorsFor(core);
      expect(
        await nfbDiamond.facetFunctionSelectors(core.address)
      ).to.deep.equal(actualCoreSelectors);
    });

    it("associates selectors correctly to facets", async function () {
      for (const sel of Diamond.getSelectorsFor(loupe)) {
        expect(await nfbDiamond.facetAddress(sel)).to.be.equal(loupe.address);
      }

      for (const sel of Diamond.getSelectorsFor(cut)) {
        expect(await nfbDiamond.facetAddress(sel)).to.be.equal(cut.address);
      }

      for (const sel of Diamond.getSelectorsFor(ownership)) {
        expect(await nfbDiamond.facetAddress(sel)).to.be.equal(
          ownership.address
        );
      }

      for (const sel of Diamond.getSelectorsFor(accessControl)) {
        expect(await nfbDiamond.facetAddress(sel)).to.be.equal(
          accessControl.address
        );
      }

      for (const sel of Diamond.getSelectorsFor(oracle)) {
        expect(await nfbDiamond.facetAddress(sel)).to.be.equal(oracle.address);
      }

      for (const sel of Diamond.getSelectorsFor(rewardPool)) {
        expect(await nfbDiamond.facetAddress(sel)).to.be.equal(
          rewardPool.address
        );
      }

      for (const sel of Diamond.getSelectorsFor(core)) {
        expect(await nfbDiamond.facetAddress(sel)).to.be.equal(core.address);
      }
    });

    it("returns correct response when facets() is called", async function () {
      const facets = await nfbDiamond.facets();

      expect(facets[0].facetAddress).to.equal(cut.address);
      expect(facets[0].functionSelectors).to.eql(Diamond.getSelectorsFor(cut));

      expect(facets[1].facetAddress).to.equal(loupe.address);
      expect(facets[1].functionSelectors).to.eql(
        Diamond.getSelectorsFor(loupe)
      );

      expect(facets[2].facetAddress).to.equal(ownership.address);
      expect(facets[2].functionSelectors).to.eql(
        Diamond.getSelectorsFor(ownership)
      );

      expect(facets[3].facetAddress).to.equal(accessControl.address);
      expect(facets[3].functionSelectors).to.eql(
        Diamond.getSelectorsFor(accessControl)
      );

      expect(facets[4].facetAddress).to.equal(oracle.address);
      expect(facets[4].functionSelectors).to.eql(
        Diamond.getSelectorsFor(oracle)
      );

      expect(facets[5].facetAddress).to.equal(rewardPool.address);
      expect(facets[5].functionSelectors).to.eql(
        Diamond.getSelectorsFor(rewardPool)
      );

      expect(facets[6].facetAddress).to.equal(core.address);
      expect(facets[6].functionSelectors).to.eql(Diamond.getSelectorsFor(core));
    });
  });

  context("DiamondCut Facet", async () => {
    let test1Facet: Contract, test2Facet: Contract;
    beforeEach(async () => {
      test1Facet = await Deployer.deployContract("Test1Facet");
      test2Facet = await Deployer.deployContract("Test2Facet");
    });
    it("should fail if not called by contract owner", async () => {
      const _diamondCut = [
        {
          facetAddress: test1Facet.address,
          action: FacetCutAction.Add,
          functionSelectors: Diamond.getSelectorsFor(test1Facet),
        },
      ];

      await expect(
        nfbDiamond
          .connect(nonOwner.signer)
          .diamondCut(_diamondCut, ethers.constants.AddressZero, "0x")
      ).to.be.revertedWith("Must be contract owner");
    });

    it("should allow adding new functions", async () => {
      const addTest1Facet = [
        {
          facetAddress: test1Facet.address,
          action: FacetCutAction.Add,
          functionSelectors: Diamond.getSelectorsFor(test1Facet),
        },
      ];

      await expect(
        nfbDiamond
          .connect(users.deployer.signer)
          .diamondCut(addTest1Facet, ethers.constants.AddressZero, "0x")
      ).to.not.be.reverted;

      const facets = await nfbDiamond.facets();

      expect(facets[7].facetAddress).to.eql(test1Facet.address);
      expect(facets[7].functionSelectors).to.eql(
        Diamond.getSelectorsFor(test1Facet)
      );

      const test1 = (await Diamond.asFacet(
        diamond,
        "Test1Facet"
      )) as Test1Facet;
      await expect(test1.test1Func1()).to.not.be.reverted;
    });

    it("should allow replacing functions", async function () {
      const addTest1Facet = [
        {
          facetAddress: test1Facet.address,
          action: FacetCutAction.Add,
          functionSelectors: Diamond.getSelectorsFor(test1Facet),
        },
      ];
      await nfbDiamond
        .connect(users.deployer.signer)
        .diamondCut(addTest1Facet, ethers.constants.AddressZero, "0x");

      const replaceTest1WithTest2Facet = [
        {
          facetAddress: test2Facet.address,
          action: FacetCutAction.Replace,
          functionSelectors: Diamond.getSelectorsFor(test2Facet),
        },
      ];

      await expect(
        nfbDiamond
          .connect(users.deployer.signer)
          .diamondCut(
            replaceTest1WithTest2Facet,
            ethers.constants.AddressZero,
            "0x"
          )
      ).to.not.be.reverted;

      const test2 = (await Diamond.asFacet(
        diamond,
        "Test2Facet"
      )) as Test2Facet;
      expect(await test2.test1Func1()).to.be.equal(2);
    });

    it("should allow removing functions", async function () {
      const addTest1Facet = [
        {
          facetAddress: test1Facet.address,
          action: FacetCutAction.Add,
          functionSelectors: Diamond.getSelectorsFor(test1Facet),
        },
      ];
      await nfbDiamond
        .connect(users.deployer.signer)
        .diamondCut(addTest1Facet, ethers.constants.AddressZero, "0x");

      const removeTest1Func = [
        {
          facetAddress: ethers.constants.AddressZero,
          action: FacetCutAction.Remove,
          functionSelectors: [test1Facet.interface.getSighash("test1Func1()")],
        },
      ];

      await expect(
        nfbDiamond
          .connect(users.deployer.signer)
          .diamondCut(removeTest1Func, ethers.constants.AddressZero, "0x")
      ).to.not.be.reverted;

      const test1 = (await Diamond.asFacet(
        diamond,
        "Test1Facet"
      )) as Test1Facet;
      await expect(test1.test1Func1()).to.be.revertedWith(
        "Diamond: Function does not exist"
      );
    });

    it("should support all declared interfaces", async () => {
      const IERC165 = await ethers.getContractAt(
        "IERC165",
        ethers.constants.AddressZero
      );
      expect(
        await nfbDiamond.supportsInterface(Diamond.getInterfaceId(IERC165))
      ).to.be.true;
      expect(await nfbDiamond.supportsInterface(Diamond.getInterfaceId(cut))).to
        .be.true;

      const IDiamondLoupe = await ethers.getContractAt(
        "IDiamondLoupe",
        ethers.constants.AddressZero
      );
      expect(
        await nfbDiamond.supportsInterface(
          Diamond.getInterfaceId(IDiamondLoupe)
        )
      ).to.be.true;

      expect(
        await nfbDiamond.supportsInterface(Diamond.getInterfaceId(ownership))
      ).to.be.true;

      // Calculating the interface id would require an ABI, consisting of all function selectors,
      // **excluding** the inherited ones.
      const IERC721InterfaceId = "0x80ac58cd";
      expect(await nfbDiamond.supportsInterface(IERC721InterfaceId)).to.be.true;

      const IERC721Metadata = "0x5b5e139f";
      expect(await nfbDiamond.supportsInterface(IERC721Metadata)).to.be.true;

      const IERC721Enumerable = "0x780e9d63";
      expect(await nfbDiamond.supportsInterface(IERC721Enumerable)).to.be.true;
    });
  });

  describe("Ownership Facet", async () => {
    it("should return owner", async function () {
      expect(await nfbDiamond.owner()).to.equal(users.deployer.address);
    });

    it("should revert if transferOwnership not called by owner", async function () {
      await expect(
        nfbDiamond.connect(nonOwner.signer).transferOwnership(nonOwner.address)
      ).to.be.revertedWith("Must be contract owner");
    });

    it("should revert if transferOwnership called with same address", async function () {
      await expect(
        nfbDiamond
          .connect(users.deployer.signer)
          .transferOwnership(users.deployer.address)
      ).to.be.revertedWith("Previous owner and new owner must be different");
    });

    it("should allow transferOwnership if called by owner", async function () {
      await expect(
        nfbDiamond
          .connect(users.deployer.signer)
          .transferOwnership(nonOwner.address)
      ).to.not.be.reverted;

      expect(await nfbDiamond.owner()).to.equal(nonOwner.address);
    });
  });

  describe("Cache Bug", async () => {
    const ownerSel = "0x8da5cb5b";

    const sel0 = "0x19e3b533"; // fills up slot 1
    const sel1 = "0x0716c2ae"; // fills up slot 1
    const sel2 = "0x11046047"; // fills up slot 1
    const sel3 = "0xcf3bbe18"; // fills up slot 1
    const sel4 = "0x24c1d5a7"; // fills up slot 1
    const sel5 = "0xcbb835f6"; // fills up slot 1
    const sel6 = "0xcbb835f7"; // fills up slot 1
    const sel7 = "0xcbb835f8"; // fills up slot 2
    const sel8 = "0xcbb835f9"; // fills up slot 2
    const sel9 = "0xcbb835fa"; // fills up slot 2
    const sel10 = "0xcbb835fb"; // fills up slot 2
    const selectors = [
      sel0,
      sel1,
      sel2,
      sel3,
      sel4,
      sel5,
      sel6,
      sel7,
      sel8,
      sel9,
      sel10,
    ];

    it("should not exhibit the cache bug", async () => {
      const test1Facet = await Deployer.deployContract("Test1Facet");
      const addTest1Facet = [
        {
          facetAddress: test1Facet.address,
          action: FacetCutAction.Add,
          functionSelectors: selectors,
        },
      ];

      await nfbDiamond
        .connect(users.deployer.signer)
        .diamondCut(addTest1Facet, ethers.constants.AddressZero, "0x");

      // Remove the function selectors
      const selectorsToRemove = [ownerSel, sel5, sel10];
      const removeSelectorsFacet = [
        {
          facetAddress: ethers.constants.AddressZero,
          action: FacetCutAction.Remove,
          functionSelectors: selectorsToRemove,
        },
      ];

      await nfbDiamond
        .connect(users.deployer.signer)
        .diamondCut(removeSelectorsFacet, ethers.constants.AddressZero, "0x");

      // Get the test1Facet's registered functions
      const actualSelectors = await nfbDiamond.facetFunctionSelectors(
        test1Facet.address
      );
      // Check individual correctness
      expect(actualSelectors).to.include(sel0, "Does not contain sel0");
      expect(actualSelectors).to.include(sel1, "Does not contain sel1");
      expect(actualSelectors).to.include(sel2, "Does not contain sel2");
      expect(actualSelectors).to.include(sel3, "Does not contain sel3");
      expect(actualSelectors).to.include(sel4, "Does not contain sel4");
      expect(actualSelectors).to.include(sel6, "Does not contain sel6");
      expect(actualSelectors).to.include(sel7, "Does not contain sel7");
      expect(actualSelectors).to.include(sel8, "Does not contain sel8");
      expect(actualSelectors).to.include(sel9, "Does not contain sel9");

      expect(actualSelectors).to.not.include(ownerSel, "Contains ownerSel");
      expect(actualSelectors).to.not.include(sel10, "Contains sel10");
      expect(actualSelectors).to.not.include(sel5, "Contains sel5");
    });
  });
});
