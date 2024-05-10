import { MsgGrant } from "../types/cosmos/authz/v1beta1/tx";
import { CosmosEvent, CosmosMessage } from "@subql/types-cosmos";
import {
  handleHubContractInstantiateHelper,
  handleHubContractInstantiateMetadataHelper,
} from "../hubs";
import { handleSeatContractInstantiateMetadataHelper } from "../seat";
import { handleSeatContractPrimarySaleCreatedHelper } from "../sale";
import {
  handleSmartAccountContractAddAuthenticatorHelper,
  handleSmartAccountContractInstantiateMetadataHelper,
  handleSmartAccountContractRemoveAuthenticatorHelper,
} from "../smartContract";
import { handleAuthzWasmMsgGrant } from "../grants/authz/handleAuthzWasmMsgGrant";
import { handleAuthzGenericMsgGrant } from "../grants/handleGenericGrant";

export async function handleHubContractInstantiate(
  event: CosmosEvent
): Promise<void> {
  await handleHubContractInstantiateHelper(event);
}

export async function handleHubContractInstantiateMetadata(
  event: CosmosEvent
): Promise<void> {
  await handleHubContractInstantiateMetadataHelper(event);
}

export async function handleSeatContractInstantiateMetadata(
  event: CosmosEvent
): Promise<void> {
  await handleSeatContractInstantiateMetadataHelper(event);
}

export async function handleSeatContractPrimarySaleCreated(
  event: CosmosEvent
): Promise<void> {
  await handleSeatContractPrimarySaleCreatedHelper(event);
}

export async function handleSeatContractPrimarySaleHalted(): Promise<void> {
  await handleSeatContractPrimarySaleHalted();
}

export async function handleSmartAccountContractInstantiateMetadata(
  event: CosmosEvent
): Promise<void> {
  await handleSmartAccountContractInstantiateMetadataHelper(event);
}

export async function handleSmartAccountContractAddAuthenticator(
  event: CosmosEvent
): Promise<void> {
  await handleSmartAccountContractAddAuthenticatorHelper(event);
}

export async function handleSmartAccountContractRemoveAuthenticator(
  event: CosmosEvent
): Promise<void> {
  await handleSmartAccountContractRemoveAuthenticatorHelper(event);
}

export async function handleAuthzMsgGrant(
  msg: CosmosMessage<MsgGrant>
): Promise<void> {
  logger.info(
    "Handling MsgGrant %s, %s ",
    msg.msg.decodedMsg.grant?.authorization?.typeUrl,
    msg.msg.typeUrl
  );
  switch (msg.msg.decodedMsg.grant?.authorization?.typeUrl) {
    case "/cosmwasm.wasm.v1.ContractExecutionAuthorization": {
      await handleAuthzWasmMsgGrant(msg);
      return;
    }
    case "/cosmos.authz.v1beta1.GenericAuthorization": {
      await handleAuthzGenericMsgGrant(msg);
      return;
    }
    default:
      logger.warn("Unknown authorization type");
  }
}
