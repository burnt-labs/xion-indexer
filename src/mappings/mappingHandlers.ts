import { CosmosEvent } from "@subql/types-cosmos";
import { handleHubContractInstantiateHelper, handleHubContractInstantiateMetadataHelper } from "../hubs";

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
