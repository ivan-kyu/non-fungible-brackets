import { Signer } from "ethers";

export type Account = {
  address: string;
  signer: Signer;
};

const userIndices = {
  deployer: 0,
  user1: 1,
  user2: 2,
  user3: 3,
  user4: 4,
  user5: 5,
  user6: 6,
  user7: 7,
  user8: 8,
  user9: 9,
  user10: 10,
  user11: 11,
  user12: 12,
};

class Users {
  addresses;
  signers;
  as;

  constructor(signers: Array<any>) {
    this.addresses = signers ? signers.map((e) => e.address) : null;

    this.signers = signers
      ? Object.fromEntries(
          this.addresses!.map((address) => [
            address,
            signers.find((signer) => signer.address === address),
          ])
        )
      : null;

    this.as = this;
  }

  getAccountAtIndex(index: number): Account {
    const address = this.addresses![index];
    const signer = this.signers[address];

    return { address, signer };
  }

  get deployer(): Account {
    return this.getAccountAtIndex(userIndices.deployer);
  }

  get user1(): Account {
    return this.getAccountAtIndex(userIndices.user1);
  }

  get user2(): Account {
    return this.getAccountAtIndex(userIndices.user2);
  }

  get user3(): Account {
    return this.getAccountAtIndex(userIndices.user3);
  }

  get user4(): Account {
    return this.getAccountAtIndex(userIndices.user4);
  }

  get user5(): Account {
    return this.getAccountAtIndex(userIndices.user5);
  }

  get user6(): Account {
    return this.getAccountAtIndex(userIndices.user6);
  }

  get user7(): Account {
    return this.getAccountAtIndex(userIndices.user7);
  }

  get user8(): Account {
    return this.getAccountAtIndex(userIndices.user8);
  }

  get user9(): Account {
    return this.getAccountAtIndex(userIndices.user9);
  }

  get user10(): Account {
    return this.getAccountAtIndex(userIndices.user10);
  }

  get user11(): Account {
    return this.getAccountAtIndex(userIndices.user11);
  }

  get user12(): Account {
    return this.getAccountAtIndex(userIndices.user12);
  }

  arrayOf(slice: number): Array<string> {
    return this.addresses!.slice(1, slice + 1);
  }
}

export default Users;
