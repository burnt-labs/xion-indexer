import { CosmosEvent } from "@subql/types-cosmos";
import { AllHub, Hub, HubSeat, SocialLink } from "../types";
import { HubMetadata } from "../interfaces";

export async function handleHubContractInstantiateHelper(
  event: CosmosEvent
): Promise<void> {
  if (event.event.type === "instantiate") {
    let codeId = event.event.attributes.find((attr) => attr.key === "code_id")?.value;
    if (codeId !== "19") {
      // This event is not for our codeId
      return;
    }
    logger.info("HUB Instantiate event detected");
    let hubs: AllHub | undefined;
    hubs = await AllHub.get("all_hubs");
    if (!hubs) {
      hubs = new AllHub("all_hubs", []);
    }
    let contractAddress = event.event.attributes.find(
      (attr) => attr.key === "_contract_address"
    )?.value;
    if (contractAddress) {
      const exists = hubs.allHub.find((hub) => hub === contractAddress);
      if (!exists) {
        logger.info("New hub detected ", contractAddress);
        let hubSeat = new HubSeat(contractAddress, []);
        hubs.allHub.push(contractAddress);
        // Remove duplication from the arrays which can occur
        // when the function is called more than once for a single event
        hubs.allHub = Array.from(new Set(hubs.allHub));
        await hubs.save();
        await hubSeat.save();
      }
    }
  }
}

export async function handleHubContractInstantiateMetadataHelper(
  event: CosmosEvent
): Promise<void> {
  if (event.event.type === "wasm-metadata-instantiate") {
    logger.info("Hub Metadata Instantiate event detected");
    let contractAddress = event.event.attributes.find(
      (attr) => attr.key === "_contract_address"
    )?.value;
    if (contractAddress) {
      let hubs = await AllHub.get("all_hubs");
      if (!hubs) {
        return;
      }
      let hubExists = hubs.allHub.find((hub) => hub === contractAddress);
      if (!hubExists) {
        // This hub isn't instantiated from our codeId
        return;
      } else {
        let oldHub = await Hub.get(contractAddress);
        if (!oldHub) {
          let hubJsonMetadata = event.event.attributes.find(
            (attr) => attr.key === "metadata"
          )?.value;
          if (hubJsonMetadata) {
            let hubMetadata: HubMetadata = JSON.parse(hubJsonMetadata);
            // we use this check to confirm that this event is for a hub
            if (!hubMetadata.hub_url) {
              return;
            }
            let hub = new Hub(
              contractAddress,
              "all_hubs",
              hubMetadata.name,
              hubMetadata.hub_url,
              hubMetadata.description,
              hubMetadata.tags,
              hubMetadata.creator,
              hubMetadata.creator, // creator is owner at instantiate
              hubMetadata.thumbnail_image_url,
              hubMetadata.banner_image_url
            );

            let OldSocialLink = await SocialLink.get(contractAddress);
            if (!OldSocialLink) {
              let socialLink = new SocialLink(
                contractAddress,
                contractAddress,
                hubMetadata.name,
                hubMetadata.hub_url
              );
              await socialLink.save();
            }
            await hub.save();
            hubs.allHub.push(contractAddress);
            await hubs?.save();
          }
        }
      }
    }
  }
}
