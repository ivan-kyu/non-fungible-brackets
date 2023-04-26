import { ethers } from "hardhat";
import "@nomiclabs/hardhat-waffle";
import { expect } from "chai";
import { IDiamond } from "../typechain/IDiamond";
import Users from "../test/helpers/users";
import { incorrectParam } from "../test/helpers/utils";
import { init } from "../test/helpers/initContracts";
let users: Users;

describe("Access Control", () => {
  let snapshotId: any;
  let defaultAdminRole: string;
  let updaterRole: string;

  // Diamond
  let nfbDiamond: IDiamond;

  before(async function () {
    const signers = await ethers.getSigners();
    users = new Users(signers);

    [nfbDiamond] = await init(users);

    defaultAdminRole = await nfbDiamond.getDefaultAdmin();
    updaterRole = await nfbDiamond.getUpdaterRole();
    console.log("updaterRole", updaterRole);
  });

  beforeEach(async function () {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async function () {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  context("for Access Control", async () => {
    it("admin role should be successfully initialized", async () => {
      expect(defaultAdminRole).to.eq(ethers.constants.HashZero);
    });

    it("roles should have correct roleAdmin", async () => {
      expect(
        await nfbDiamond.getRoleAdmin(defaultAdminRole),
        incorrectParam("admin not correctly set")
      ).to.eq(defaultAdminRole);

      expect(
        await nfbDiamond.getRoleAdmin(updaterRole),
        incorrectParam("admin not correctly set")
      ).to.eq(defaultAdminRole);
    });
    it("Should set roles correctly on deployment", async () => {
      const isDeployerAdmin = await nfbDiamond.hasRole(
        defaultAdminRole,
        users.deployer.address
      );
      const isAnotherAdmin = await nfbDiamond.hasRole(
        defaultAdminRole,
        users.user1.address
      );

      const isDeployerExecutor = await nfbDiamond.hasRole(
        updaterRole,
        users.deployer.address
      );
      const isAnotherExecutor = await nfbDiamond.hasRole(
        updaterRole,
        users.user1.address
      );

      expect(isDeployerAdmin, "default admin role not set to admin").to.eq(
        true
      );
      expect(isDeployerExecutor, "updater role not set to admin").to.eq(true);
      expect(isAnotherAdmin, "default admin role was set to another").to.eq(
        false
      );
      expect(isAnotherExecutor, "updater role was set to another").to.eq(false);
    });

    it("should set admin role role by admin", async () => {
      const newAdmin = users.user10.address;

      let hasRole = await nfbDiamond.hasRole(defaultAdminRole, newAdmin);
      expect(hasRole, "admin role must be negative").to.eq(false);

      await nfbDiamond.grantRole(defaultAdminRole, newAdmin);

      hasRole = await nfbDiamond.hasRole(defaultAdminRole, newAdmin);
      expect(hasRole, "admin role must be positive").to.eq(true);
    });

    it("should set updater role by admin", async () => {
      const newUpdater = users.user10.address;

      let hasRole = await nfbDiamond.hasRole(updaterRole, newUpdater);
      expect(hasRole, "updater role must be negative").to.eq(false);

      await nfbDiamond.grantUpdaterRole(newUpdater);

      hasRole = await nfbDiamond.hasRole(updaterRole, newUpdater);
      expect(hasRole, "updater role must be positive").to.eq(true);
    });

    it("must fail to set admin role by non admin", async () => {
      await expect(
        nfbDiamond
          .connect(users.user10.signer)
          .grantRole(defaultAdminRole, users.user10.address)
      ).to.revertedWith(
        `AccessControl: account ${users.user10.address.toLocaleLowerCase()} is missing role ${defaultAdminRole}`
      );
    });
    it("must fail to set updater role by non admin", async () => {
      await expect(
        nfbDiamond
          .connect(users.user10.signer)
          .grantUpdaterRole(users.user10.address)
      ).to.be.revertedWith(
        `AccessControl: account ${users.user10.address.toLocaleLowerCase()} is missing role ${defaultAdminRole}`
      );
    });

    it("must revoke admin role by admin", async () => {
      const account = users.user10.address;
      await nfbDiamond.grantRole(defaultAdminRole, account);

      let hasRole = await nfbDiamond.hasRole(defaultAdminRole, account);
      expect(hasRole, "admin role must be positive").to.eq(true);

      await nfbDiamond.revokeRole(defaultAdminRole, account);

      hasRole = await nfbDiamond.hasRole(defaultAdminRole, account);
      expect(hasRole, "admin role must be negative").to.eq(false);
    });

    it("must revoke updater role by admin", async () => {
      const account = users.user10.address;
      await nfbDiamond.grantUpdaterRole(account);

      let hasRole = await nfbDiamond.hasRole(updaterRole, account);
      expect(hasRole, "updater role must be positive").to.eq(true);

      await nfbDiamond.revokeRole(updaterRole, account);

      hasRole = await nfbDiamond.hasRole(updaterRole, account);
      expect(hasRole, "updater role must be negative").to.eq(false);
    });
    it("must fail to revoke admin role by non admin", async () => {
      await expect(
        nfbDiamond
          .connect(users.user10.signer)
          .revokeRole(defaultAdminRole, users.deployer.address)
      ).to.be.revertedWith(
        `AccessControl: account ${users.user10.address.toLowerCase()} is missing role ${defaultAdminRole}`
      );
    });
    it("should setup new role by admin", async () => {
      const newRole = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("newRole")
      );

      await nfbDiamond.grantRole(newRole, users.deployer.address);

      const hasNewRole = await nfbDiamond.hasRole(
        newRole,
        users.deployer.address
      );

      expect(hasNewRole, "new role has not been correctly setup").to.eq(true);
    });

    it("must fail to setup new role by non-admin", async () => {
      const newRole = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("newRole")
      );

      await expect(
        nfbDiamond
          .connect(users.user10.signer)
          .grantRole(newRole, users.deployer.address)
      ).to.be.revertedWith(
        `AccessControl: account ${users.user10.address.toLowerCase()} is missing role ${defaultAdminRole}`
      );
    });
  });
});
