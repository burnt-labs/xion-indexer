import {
  CosmosDatasourceKind,
  CosmosHandlerKind,
  CosmosProject,
  CosmosRuntimeHandler,
} from "@subql/types-cosmos";

type Network = {
  name: string;
  codeIds: string[];
  chainId: string;
  endpoint: string;
  startBlock: number;
  bypassBlocks: number[];
};

type Networks = {
  [key: string]: Network;
};

const networks: Networks = {
  "xion-testnet-1": {
    name: "xion-indexer",
    codeIds: ["21", "793"],
    chainId: "xion-testnet-1",
    endpoint: "https://rpc.xion-testnet-1.burnt.com:443",
    startBlock: 3371922,
    bypassBlocks: [4962232, 8247887],
  },
  "xion-mainnet-1": {
    name: "xion-mainnet-indexer",
    codeIds: ["1", "5"],
    chainId: "xion-mainnet-1",
    endpoint: "https://rpc.xion-api.com/",
    startBlock: 1825347,
    bypassBlocks: [],
  },
};

if (!process.env.CHAIN_ID) {
  throw new Error("CHAIN_ID is not set");
}

const selectedNetwork = networks[process.env.CHAIN_ID];

if (!selectedNetwork) {
  throw new Error(
    `Chain ID ${
      process.env.CHAIN_ID
    } is not supported. Supported networks are ${Object.keys(networks).join(
      ", ",
    )}`,
  );
}

const project: CosmosProject = {
  specVersion: "1.0.0",
  version: "1.0.0",
  name: selectedNetwork.name,
  description: "Xion SubQuery project for account abstraction",
  runner: {
    node: {
      name: "@subql/node-cosmos",
      version: ">=4.0.0",
    },
    query: {
      name: "@subql/query",
      version: "*",
    },
  },
  schema: {
    file: "./schema.graphql",
  },
  network: {
    chainId: selectedNetwork.chainId,
    /**
     *
     * These endpoint(s) should be non-pruned archive nodes
     * Public nodes may be rate limited, which can affect indexing speed
     * When developing your project we suggest getting a private API key
     * We suggest providing an array of endpoints for increased speed and reliability
     */
    endpoint: [selectedNetwork.endpoint],
    chaintypes: new Map([
      [
        "abstractaccount.v1",
        {
          file: "./proto/abstractaccount/v1/tx.proto",
          messages: ["MsgRegisterAccount"],
        },
      ],
      // Needs to be added since it is a dependency of MsgRegisterAccount
      [
        "cosmos.base.v1beta1",
        {
          // needed by MsgSwapExactAmountIn
          file: "./proto/cosmos/base/v1beta1/coin.proto",
          messages: ["Coin"],
        },
      ],
    ]),
    bypassBlocks: selectedNetwork.bypassBlocks,
  },
  dataSources: [
    {
      kind: CosmosDatasourceKind.Runtime,
      startBlock: selectedNetwork.startBlock,
      mapping: {
        file: "./dist/index.js",
        handlers: selectedNetwork.codeIds.reduce<Array<CosmosRuntimeHandler>>(
          (result, codeId) =>
            result.concat([
              {
                handler: "handleSmartAccountContractInstantiateMetadata",
                kind: CosmosHandlerKind.Event,
                filter: {
                  type: "wasm-create_abstract_account",
                  messageFilter: {
                    type: "/abstractaccount.v1.MsgRegisterAccount",
                    values: {
                      codeId: codeId,
                    },
                  },
                },
              },
              {
                handler: "handleSmartAccountContractAddAuthenticator",
                kind: CosmosHandlerKind.Event,
                filter: {
                  type: "wasm-add_auth_method",
                  messageFilter: {
                    type: "/cosmwasm.wasm.v1.MsgExecuteContract",
                  },
                },
              },
              {
                handler: "handleSmartAccountContractRemoveAuthenticator",
                kind: CosmosHandlerKind.Event,
                filter: {
                  type: "wasm-remove_auth_method",
                  messageFilter: {
                    type: "/cosmwasm.wasm.v1.MsgExecuteContract",
                  },
                },
              },
            ]),
          [],
        ),
      },
    },
  ],
};

// Must set default to the project instance
export default project;
