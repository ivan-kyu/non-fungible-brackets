# Non Fungible Brackets Protocol
## Setup The Project
- `npm install`
- `cp .env.example .env` and populate the missing variables
- `npx hardhat compile` compile the contracts

## Setup & Deploy A Subgraph
- Make sure `subgraph/subgraph.yaml` has the proper config (networks, addresses, startBlocks)
### Production
  - `yarn graph-deploy-production`
### Testnet
  - `yarn graph-deploy-dev`
### Locally
`NOTE:` If there's an update in the contracts, the ABI in `nfb-diamond-graph/abis` should be updated as well. Also, make sure the network in subgraph.yaml is `local` and not `mumbai` or `mainnet`

- Step 1: Install Graph Dependencies:
```bash
  yarn graph-install
```

- Step 2: Generate graph code:
```bash
yarn graph-codegen
```
- Step 3: Run a local hardhat node:
```bash
  yarn hardhat-local
```

- Step 4: In another terminal tab, run a local graph instance:
```bash
yarn graph-local
```
- Step 5: In a third tab, deploy the contracts locally:
```bash
yarn contracts:migrate:local
```
- Step 6: Copy the local address of the locally deployed diamond contract (all addresses are in `./contracts.json`) under source/address of `nfb-diamond-graph/subgraph.yaml`

- Step 7: Create the local subgraph:
```bash
yarn create-local
```
- Step 8: Lastly, Deploy the local subgraph:
```bash
yarn deploy-local
```
`Query the graph at` http://127.0.0.1:8000/subgraphs/name/nfb-diamond-graph

- To clean the graph: `yarn graph-local-clean`
## To Interact With The Smart Contracts
- The following tasks are exposed and adjusted to work with the testnet contracts:
  - `yarn setupTournament`
    - Adds the following config to the diamond:
      - Tournament Format: PlayoffBrackets (type 0)
      - Sports League: NFL (number 0)
    - NOTE: This config can be reused every time when creating a new tournament (no need to be added again) 
  - `yarn addTournament`
    - Adds a tournament with the following the args:
      - League id: 1 (the one added in the last step)
      - Format id: 1 (added in the last step)
      - Name: MarchMadness
      - Season: 2023
  - `yarn initializeTournament`
    - Uses default args:
      - TournamentId: 1
      - RoundsCount: 6
      - WinnersPerRound: [32, 16, 8, 4, 2, 1]
      - Start of 1st round: now() + 4 hours ahead
      - End of 1st round: startOfFirstRound + 4 hours ahead
      - Bracket Length: 63
      - Reward Distribution Model: Top 5
      - Reward Distribution Percentage: [3700, 2500, 1500, 1200, 1100, 0]
      - Reward Distribution Ranges: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
      - Round Indices: [0, 32, 48, 56, 60, 62]
      - Tournament Stage: 32
    - To have control over the main arguments, execute:
      - `npx hardhat initializeTournament --diamond <diamondAddress> --id <tournamentId> --rounds <RoundsCount> --bracketlen <LenBracket> --stage <tournamentStage>`
  - `yarn signAddPool`
    - Signs an AddPool transaction on behalf of a user's private key (EXAMPLE_USER_PRIVATE_KEY variable in .env) and executes the autotask directly.
  -  `yarn signEnterPool`
    - Signs an EnterPool transaction on behalf of a user's private key (EXAMPLE_USER_PRIVATE_KEY variable in .env)and executes the autotask directly.
    - Uses default args:
      - poolId: 1
      - tokenId: 0 (this means new token will be minted when entering the pool)
      - uses a predefined bracket from constants.ts
      - bracket is editable by default
    - To have control over the args
      - `npx hardhat signEnterPool --diamond <diamondAddress> --forwarder <forwarderAddress> --poolid <poolId> --tokenid <tokenId> --iseditable <true|false>`
  - `yarn signUpdateBracket`
    - Signs an UpdateBracket transaction on behalf of a user's private key (EXAMPLE_USER_PRIVATE_KEY variable in .env) and executes the autotask directly.
    - Uses default args:
      - poolId: 1
      - tokenid: 1
      - uses predefined newBracket from constants.ts that is to be updated

### Example Interaction
- To see what arguments are passed to each contract call, see how tasks are triggered in `package.json`. We currently have set-up, created and initialized a tournament, so calling some functions with the same arguments may fail.
#### Admin Part
1) `yarn setupTournament`
2) `yarn addTournament`
3) `yarn initializeTournament`
#### User Part
1) `yarn signAddPool`

2) `yarn signEnterPool`

3) `yarn signUpdateBracket`

## Deploy The Contracts
### Polygon Mumbai
- `yarn contracts:migrate:mumbai`

### Locally
- `yarn contracts:migrate:local`

## Tournaments contract schema
https://lucid.app/lucidchart/538311fb-34e4-403d-ba0a-e484b42b2a7d/view

<!-- 
## Intro old version

Are you a sports fan? If by a chance you like sports in which there is a competition where the winner is decided by a knock-out stage, then this should be your game over the web3 ecosystem. As per wikipedia's description here is what the tournament knock-out stage represents: `A single-elimination, knockout, or sudden death tournament is a type of elimination tournament where the loser of each match-up is immediately eliminated from the tournament. Each winner will play another in the next round, until the final match-up, whose winner becomes the tournament champion`.
This is exactly what the main purpose of the protocol is. At the initial stage of the tournament event before its start all users are invited to mint a bracket. The bracket is a representation of their predictions from the very first match of the tournament up to the final bit - the grand finale.

For each minted bracket (non fungible token), the user would pay a certain amount of DAI tokens which will be collected in a contract called `NFBRewardPool`. While the tournament is in progress, the users are allowed to update their predictions if certain conditions are met. The most important one is that, the users are allowed to do so only between the end of the current round, and before the start of the next one. Updates of the predictions are allowed to happen only for matches in future. If some of the teams the user has predicted had lost already, there is no turning back.

Updates are also not for free. The'll cost small bit of percentage based on the regular fee for the actual creation. Funds are also collected in the `NFBRewardPool`. After each round that has been player, we update our `NFBOracle` contract with the actual results from the respective tournament. For that purpose we rely on [sportsdata.io](https://sportsdata.io/). The oracle contract keeps track for the start and the end of each and every round, which our tournament will have. Once the oracle has been updated, then an external service would call an update for each minted bracket in the contract in order to emit an event with all their crucial bits for the round as the current score gathered from that round, along with their total score up to that moment, who is the owner of that particular NFT and the round. Another external service listens for that events in order for us to easily represent the data in a user friendly manner in a web app fully developed to satisfy these requirements. Along with that we calculate based on the results so far, what could be the best possible score, if there are no more mistakes in the predictions for a specific bracket. All the users are also eligible to call those functions themselves if the'd like so as well.

At the end of the tournament, all funds collected in the `NFB Reward Pool` will be distributed back to the users in a specific schema. The top 400 people with best scores will be distributed with a reward as follows:

1. 20.51%
2. 10.26%
3. 5.13%
4. 4.10%
5. 3.59%
6. 3.08%
7. 2.56%
8. 2.05%
9. 1.54%
10. 1.03%
11-25. 0.615%
26- 50. 0.41%
51-100. 0.205%
101-200. 0.103%
201-400. 0.0308%

## Prerequisites

- Fill in your `.env` file as per the example provided in `env.example`
- NFBBracket contact address which will be used for minting the non fungible brackets. Will store hash to the actual metadata, so that the bracket could be easily seen in secondary markets.
- NFBOracle contract, based on which all the calculations are being made
- NFBRewardPool - contacts where the funds will be stored. At the end of the tournament all funds will be spread as per the aforementioned methodology
- nfbPrice - price which a user has to pay in order to mint a bracket.
- maximumWinnersCount - winners which will spread the rewards. Current tournament will be for 400, but it's set so, in order that we can achieve the calculation in a dynamic way for an upcoming events or re-modelling the award distribution.

## Install Dependencies

It's as simple as running

```javascript
npm install
```

## Testing

The Non Fungible Brackets protocol contracts are thoroughly unit tested using
[Hardhat's testing framework](https://hardhat.org/tutorial/testing-contracts.html#_5-testing-contracts)
support.
To run the unit tests:

```javascript
npx hardhat test
```

The unit tests encompass all contracts while trying to cover all possible scenarios that might occur. Each contract unit test are separated in their own file and every function has its own context where all the requirements for the happy and unhappy path are tested
By default, the build system automates starting and stopping
[Hardhat Network](https://hardhat.org/hardhat-network/#hardhat-network) on port `http://localhost:8545` in
the background ready for each test run.

## Coverage

We use [solidity-coverage](https://github.com/sc-forks/solidity-coverage) to
provide test coverage reports.
In order to have our contract fully tested and prepared for `Matic Mainnet` we made sure that our line of the contract is covered with a test and lays on 100% coverage. In order this to be verified run:

```javascript
npx hardhat coverage
```

## Deployment

Deployment should be done in the following manner:

### - NFBOracle.sol

- Initializes the contract with the following params
  - uint8 \_tournamentStage
  - uint8 \_bracketLength
  - uint8[] \_roundIndexes

### - NFBBracket.sol

- Initializes the contract with the following params

### - NFBRewardPool.sol

- Initializes the contract with the following params
  - uint256[] \_rewardDistribution
  - uint256[] \_rewardRanges
  - uint16 \_maxWinnersCount

### - NFBRouter.sol

- Initializes the contract with the following params
  - NFBBracket \_nfbBracket
  - NFBOracle \_nfbOracle
  - NFBRewardPool \_nfbRewardPool
  - uint256 \_nftPrice
  - uint16 \_maxWinnersCount

The default network this will be deployed on is `Mumbai Testnet`. Once the below command is run, the contract address will be stored in `./contracts.json`

```javascript
npm run contracts:migrate:mumbai
```

## Setting Up A Subgraph
### Locally
- Generate graph code
```bash
yarn graph-codegen
```
- Run a local hardhat node
```bash
  yarn hardhat-local
```
- In another terminal tab, run a local graph instance
```bash
yarn graph-local
```
- Deploy the contracts locally:
```bash
yarn contracts:migrate:local
```
- Copy the the address of the deployed Diamond and NFBBracket contracts from last step and insert them inside `nfb-subgraph/subgraph.yaml` under the `address` of `source`
- Create the local subgraph:
```bash
yarn create-local
```
- Deploy the local subgraph:
```bash
yarn deploy-local
```
`Query the graph at` http://127.0.0.1:8000/subgraphs/name/nfb

- To clean the graph: `yarn graph-local-clean`

## Verify

The below command will take the contracts from `./contracts.json` and will try to verify them on the default network.

```javascript
npm run contracts:verify:mumbai
```

## License

This project is licensed under the [MIT](./LICENCE) license. -->
