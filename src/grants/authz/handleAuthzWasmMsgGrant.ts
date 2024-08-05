import { Any } from "../../types/proto-interfaces/google/protobuf/any";
import { MsgGrant } from "../../proto_types/cosmos/authz/v1beta1/tx";
import { CosmosMessage } from "@subql/types-cosmos";
import {
  AuthzAuthorization,
  AuthzGrant,
  UserAddress,
} from "../../types/models";
import {
  MaxCallsLimit,
  MaxFundsLimit,
  CombinedLimit,
  AllowAllMessagesFilter,
  AcceptedMessagesFilter,
  AcceptedMessageKeysFilter,
  ContractExecutionAuthorization,
} from "../../proto_types/cosmwasm/wasm/v1/authz";

export async function handleAuthzWasmMsgGrant(msg: CosmosMessage<MsgGrant>) {
  const msgGrantee = msg.msg.decodedMsg.grantee;
  const msgGranter = msg.msg.decodedMsg.granter;

  const granter = await UserAddress.get(msgGranter);
  if (!granter) {
    UserAddress.create({
      id: msgGranter,
    }).save();
  }
  const grantee = await UserAddress.get(msgGrantee);
  if (!grantee) {
    UserAddress.create({
      id: msgGrantee,
    }).save();
  }

  const grant = msg.msg.decodedMsg.grant;
  if (!grant) {
    return;
  }

  const authorization = grant.authorization;
  if (!authorization) {
    return;
  }
  const expiration = grant.expiration;
  if (!expiration) {
    logger.info("No expiration found in grant");
  }

  const authzGrantId = msgGranter + msgGrantee + authorization.typeUrl;
  let authzGrant = await AuthzGrant.get(authzGrantId);
  if (authzGrant) {
    // A grant already exists, no need to create a new one
    return;
  }
  authzGrant = AuthzGrant.create({
    id: authzGrantId,
    granterId: msgGranter,
    granteeId: msgGrantee,
  });
  await authzGrant.save();

  let authzAuth = await AuthzAuthorization.get(authzGrantId);
  if (!authzAuth) {
    authzAuth = AuthzAuthorization.create({
      id: authzGrantId,
      type: authorization.typeUrl,
      expiration: BigInt(expiration ? expiration.seconds : 0),
      authData: "",
      grantId: authzGrantId,
    });
  }

  const authData: Record<string, any> = {};
  authData["grants"] = [];

  switch (authorization.typeUrl) {
    case "/cosmwasm.wasm.v1.ContractExecutionAuthorization": {
      const grants = ContractExecutionAuthorization.decode(
        Uint8Array.from(authorization.value)
      );
      for (const grant of grants.grants) {
        let limit,
          filter = {};
        if (grant.limit) {
          limit = deserializeLimit(grant.limit);
        }
        if (grant.filter) {
          filter = deserializeFilter(grant.filter);
        }
        authData["grants"].push({
          contract: grant.contract,
          limit: limit,
          filter: filter,
        });
      }
      break;
    }
  }
  authzAuth.authData = JSON.stringify(authData);
  await authzAuth.save();
}

type WasmLimit = MaxCallsLimit | MaxFundsLimit | CombinedLimit;
function deserializeLimit(limit: Any): {
  type: string;
  limit: WasmLimit | string;
} {
  switch (limit.typeUrl) {
    case "/cosmwasm.wasm.v1.MaxCallsLimit":
      return {
        type: "MaxCallsLimit",
        limit: MaxCallsLimit.decode(Uint8Array.from(limit.value)),
      };
    case "/cosmwasm.wasm.v1.MaxFundsLimit":
      return {
        type: "MaxCallsLimit",
        limit: MaxCallsLimit.decode(Uint8Array.from(limit.value)),
      };
    case "/cosmwasm.wasm.v1.CombinedLimit":
      return {
        type: "MaxCallsLimit",
        limit: MaxCallsLimit.decode(Uint8Array.from(limit.value)),
      };
    default:
      return { type: "unknown", limit: "Unknown limit type" };
  }
}

type WasmFilter =
  | AllowAllMessagesFilter
  | AcceptedMessageKeysFilter
  | AcceptedMessagesFilter;
function deserializeFilter(filter: Any): {
  type: string;
  filter?: WasmFilter | string;
} {
  switch (filter.typeUrl) {
    case "/cosmwasm.wasm.v1.AllowAllMessagesFilter":
      return {
        type: "AllowAllMessagesFilter",
        filter: AllowAllMessagesFilter.decode(Uint8Array.from(filter.value)),
      };
    case "/cosmwasm.wasm.v1.AcceptedMessageKeysFilter":
      return {
        type: "AcceptedMessageKeysFilter",
        filter: AcceptedMessageKeysFilter.decode(Uint8Array.from(filter.value)),
      };
    case "/cosmwasm.wasm.v1.AcceptedMessagesFilter":
      return {
        type: "AcceptedMessagesFilter",
        filter: AcceptedMessagesFilter.decode(Uint8Array.from(filter.value)),
      };
    default:
      return { type: "unknown", filter: "Unknown filter type" };
  }
}
