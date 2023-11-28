import { CosmosEvent } from "@subql/types-cosmos";
import { AllHub, Hub, HubSeat, SocialLink } from "../types";
import { HubMetadata } from "../interfaces";

export async function handleHubContractInstantiateHelper(
  event: CosmosEvent,
): Promise<void> {
  if (event.event.type === "instantiate") {
    logger.info("HUB Instantiate event detected");
    let contractAddress = event.event.attributes.find(
      (attr) => attr.key === "_contract_address",
    )?.value;
    if (contractAddress) {
      let allHub: AllHub | undefined;
      allHub = await AllHub.get(contractAddress);
      if (!allHub) {
        allHub = new AllHub(contractAddress);
        logger.info("New hub detected ", contractAddress);
        let hubSeat = new HubSeat(contractAddress, []);
        await hubSeat.save();
        await allHub.save();

        let hubJsonMetadata = event.event.attributes.find(
          (attr) => attr.key === "metadata",
        )?.value;
        logger.info(`hubJsonMetadata: ${hubJsonMetadata}`);
        if (hubJsonMetadata) {
          let hubMetadata: HubMetadata = JSON.parse(hubJsonMetadata);
          // we use this check to confirm that this event is for a hub
          if (!hubMetadata.hub_url) {
            logger.info("No hub url.");
            return;
          }
          let hub = new Hub(
            contractAddress,
            contractAddress,
            hubMetadata.name,
            hubMetadata.hub_url,
            hubMetadata.description,
            hubMetadata.tags,
            hubMetadata.creator,
            hubMetadata.creator, // creator is owner at instantiate
            hubMetadata.thumbnail_image_url,
            hubMetadata.banner_image_url,
          );

          let OldSocialLink = await SocialLink.get(contractAddress);
          if (!OldSocialLink) {
            let socialLink = new SocialLink(
              contractAddress,
              contractAddress,
              hubMetadata.name,
              hubMetadata.hub_url,
            );
            await socialLink.save();
            allHub;
          }
          await hub.save();
        }
      }
    }
  }
}

export async function handleHubContractInstantiateMetadataHelper(
  event: CosmosEvent,
): Promise<void> {
  if (event.event.type === "wasm-metadata-instantiate") {
    logger.info("Hub Metadata Instantiate event detected");
    let contractAddress = event.event.attributes.find(
      (attr) => attr.key === "_contract_address",
    )?.value;
    if (contractAddress) {
      let hub = await AllHub.get(contractAddress);
      if (!hub) {
        logger.info("Xion Hub not found for the seat contract");
        return;
      } else {
        let oldHub = await Hub.get(contractAddress);
        if (!oldHub) {
          let hubJsonMetadata = event.event.attributes.find(
            (attr) => attr.key === "metadata",
          )?.value;
          logger.info("hubJsonMetadata", hubJsonMetadata);
          if (hubJsonMetadata) {
            let hubMetadata: HubMetadata = JSON.parse(hubJsonMetadata);
            // we use this check to confirm that this event is for a hub
            if (!hubMetadata.hub_url) {
              return;
            }
            let hub = new Hub(
              contractAddress,
              contractAddress,
              hubMetadata.name,
              hubMetadata.hub_url,
              hubMetadata.description,
              hubMetadata.tags,
              hubMetadata.creator,
              hubMetadata.creator, // creator is owner at instantiate
              hubMetadata.thumbnail_image_url,
              hubMetadata.banner_image_url,
            );

            let OldSocialLink = await SocialLink.get(contractAddress);
            if (!OldSocialLink) {
              let socialLink = new SocialLink(
                contractAddress,
                contractAddress,
                hubMetadata.name,
                hubMetadata.hub_url,
              );
              await socialLink.save();
            }
            await hub.save();
          }
        }
      }
    }
  }
}
