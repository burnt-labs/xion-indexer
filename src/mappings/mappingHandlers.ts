import { CosmosEvent } from "@subql/types-cosmos";
import {
  handleHubContractInstantiateHelper,
  handleHubContractInstantiateMetadataHelper,
} from "../hubs";
import { handleSeatContractInstantiateMetadataHelper } from "../seat";
import { handleSeatContractPrimarySaleCreatedHelper } from "../sale";
import {
  handleSmartAccountContractAddAuthenticatorHelper,
  handleSmartAccountContractInstantiateHelper,
  handleSmartAccountContractInstantiateMetadataHelper,
  handleSmartAccountContractRemoveAuthenticatorHelper,
} from "../smartContract";

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

export async function handleSmartAccountContractInstantiate(
  event: CosmosEvent
): Promise<void> {
  await handleSmartAccountContractInstantiateHelper(event);
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
