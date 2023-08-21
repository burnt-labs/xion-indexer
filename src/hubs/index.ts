import { CosmosEvent } from "@subql/types-cosmos";
import { AllHub, Hub, SocialLink } from "../types";
import { HubMetadata } from "../interfaces";

export async function handleHubContractInstantiateHelper(
  event: CosmosEvent
): Promise<void> {
  if (event.event.type === "instantiate") {
    logger.info("Instantiate event detected");
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
        hubs.allHub.push(contractAddress);
        // Remove duplication from the arrays which can occur
        // when the function is called more than once for a single event
        hubs.allHub = Array.from(new Set(hubs.allHub));
        await hubs.save();
      }
    }
  }
}

export async function handleHubContractInstantiateMetadataHelper(
  event: CosmosEvent
): Promise<void> {
  if (event.event.type === "wasm") {
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
            let hub = new Hub(
              contractAddress,
              "all_hubs",
              hubMetadata.name,
              hubMetadata.hub_url,
              hubMetadata.description,
              hubMetadata.tags,
              hubMetadata.creator,
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
            // Remove duplication from the arrays which can occur
            // when the function is called more than once for a single event
            hubs.allHub = Array.from(new Set(hubs.allHub));
            await hubs?.save();
          }
        }
      }
    }
  }
}
