import {
  CosmosDatasourceKind,
  CosmosHandlerKind,
  CosmosProject,
} from "@subql/types-cosmos";

// These defaults are the testnet values
const HUB_CONTRACT_CODE_ID = process.env.HUB_CONTRACT_CODE_ID || "7";
const SMART_ACCOUNT_CONTRACT_CODE_ID =
  process.env.SMART_ACCOUNT_CONTRACT_CODE_ID || "21";

const CHAIN_ID = process.env.CHAIN_ID || "xion-testnet-1";
const ENDPOINT_URL =
  process.env.ENDPOINT_URL || "https://rpc.xion-testnet-1.burnt.com:443";
const START_BLOCK = Number(process.env.START_BLOCK || "3371922");

const project: CosmosProject = {
  specVersion: "1.0.0",
  version: "1.0.0",
  name: "xion-indexer",
  description:
    "Xion SubQuery project for account abstraction and hub/seat contracts.",
  runner: {
    node: {
      name: "@subql/node-cosmos",
      version: ">=3.0.0",
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
    chainId: CHAIN_ID,
    /**
     *
     * These endpoint(s) should be non-pruned archive nodes
     * Public nodes may be rate limited, which can affect indexing speed
     * When developing your project we suggest getting a private API key
     * We suggest providing an array of endpoints for increased speed and reliability
     */
    endpoint: [ENDPOINT_URL],
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
  },
  dataSources: [
    {
      kind: CosmosDatasourceKind.Runtime,
      startBlock: START_BLOCK,
      mapping: {
        file: "./dist/index.js",
        handlers: [
          // Hub contract handlers
          {
            handler: "handleHubContractInstantiate",
            kind: CosmosHandlerKind.Event,
            filter: {
              type: "instantiate",
              messageFilter: {
                type: "/cosmwasm.wasm.v1.MsgInstantiateContract",
                values: {
                  codeId: HUB_CONTRACT_CODE_ID,
                },
              },
            },
          },
          {
            handler: "handleHubContractInstantiateMetadata",
            kind: CosmosHandlerKind.Event,
            filter: {
              type: "wasm-metadata-instantiate",
              messageFilter: {
                type: "/cosmwasm.wasm.v1.MsgInstantiateContract",
              },
            },
          },
          // Seat contract handlers
          {
            handler: "handleSeatContractInstantiateMetadata",
            kind: CosmosHandlerKind.Event,
            filter: {
              type: "wasm-metadata-instantiate",
              messageFilter: {
                type: "/cosmwasm.wasm.v1.MsgInstantiateContract",
              },
            },
          },
          {
            handler: "handleSeatContractPrimarySaleCreated",
            kind: CosmosHandlerKind.Event,
            filter: {
              type: "wasm-sales-add_primary_sale",
              messageFilter: {
                type: "/cosmwasm.wasm.v1.MsgExecuteContract",
              },
            },
          },
          {
            handler: "handleSeatContractPrimarySaleHalted",
            kind: CosmosHandlerKind.Event,
            filter: {
              type: "wasm-sales-halt_sale",
              messageFilter: {
                type: "/cosmwasm.wasm.v1.MsgExecuteContract",
              },
            },
          },
          {
            handler: "handleSmartAccountContractInstantiateMetadata",
            kind: CosmosHandlerKind.Event,
            filter: {
              type: "wasm-create_abstract_account",
              messageFilter: {
                type: "/abstractaccount.v1.MsgRegisterAccount",
                values: {
                  codeId: SMART_ACCOUNT_CONTRACT_CODE_ID,
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
        ],
      },
    },
  ],
};

// Must set default to the project instance
export default project;
