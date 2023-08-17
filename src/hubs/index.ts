import { CosmosEvent } from "@subql/types-cosmos";
import { AllHub, Hub, SocialLink } from "../types";
import { HubMetadata } from "../interfaces";

export async function handleHubContractInstantiateHelper(
  event: CosmosEvent
): Promise<void> {
  if (event.event.type === "instantiate") {
    let hubs: AllHub | undefined;
    hubs = await AllHub.get("hubs");
    if (!hubs) {
      hubs = new AllHub("hubs", []);
      let contractAddress = event.event.attributes.find(
        (attr) => attr.key === "_contract_address"
      )?.value;
      hubs?.allHub.push(contractAddress || "No Contract");
      await hubs?.save();
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
      let hubs = await AllHub.get("hubs");
      let hubExists = hubs?.allHub.find((hub) => hub === contractAddress);
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
            hubs?.allHub.push(contractAddress);
            await hubs?.save();
          }
        }
      }
    }
  }
}
