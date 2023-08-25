import { CosmosEvent } from "@subql/types-cosmos";
import { Hub, HubSeat, Seat, SeatBenefit } from "../types";
import { SeatMetadata } from "../interfaces";

async function setupHubSeat(
  hubContractAddress: string | undefined,
  seatContractAddress: string | undefined
): Promise<void> {
  let hubSeat: HubSeat | undefined;
  if (hubContractAddress && seatContractAddress) {
    hubSeat = await HubSeat.get(hubContractAddress);
    if (!hubSeat) {
      hubSeat = new HubSeat(hubContractAddress, []);
    }
    hubSeat.seatContracts.push(seatContractAddress);
    await hubSeat.save();
  }
}

export async function handleSeatContractInstantiateMetadataHelper(
  event: CosmosEvent
): Promise<void> {
  if (event.event.type === "wasm-metadata-instantiate") {
    logger.info("Seat Metadata Instantiate event detected");
    let contractAddress = event.event.attributes.find(
      (attr) => attr.key === "_contract_address"
    )?.value;
    let seatJsonMetadata = event.event.attributes.find(
      (attr) => attr.key === "metadata"
    )?.value;
    if (seatJsonMetadata) {
      let seatMetadata: SeatMetadata = JSON.parse(seatJsonMetadata);
      let hubAddress = seatMetadata.hub_contract;
      if (!hubAddress) {
        logger.info("Seat Metadata Instantiate event detected but no hub address");
        return;
      }
      if (contractAddress) {
        let hub = await Hub.get(hubAddress);
        if (!hub) {
          logger.info("Seat Metadata Instantiate event detected but no hub attached to hub address");
          // we only care about hubs that must have been created from our codeId
          return;
        }
        // setup the hub seat
        await setupHubSeat(hubAddress, contractAddress);
        let seat = new Seat(
          contractAddress,
          hubAddress,
          hubAddress,
          seatMetadata.name,
          seatMetadata.image_uri,
          seatMetadata.description,
        )
        // we use this check to confirm that this event is for a seat
        if (!seatMetadata.benefits) {
          return;
        }

        for (let benefit of seatMetadata.benefits) {
          let seatBenefit = await SeatBenefit.get(
            contractAddress + benefit.name + benefit.status
          );
          if (!seatBenefit) {
            seatBenefit = new SeatBenefit(
              contractAddress,
              contractAddress,
              benefit.name,
              benefit.status
            );
            await seatBenefit.save();
          }
        }
        await seat.save();
      } else {
        logger.info("Seat Metadata Instantiate event detected but no contract address");
      }
    } else {
      logger.info("Seat Metadata Instantiate event detected but no metadata");
    }
  }
}
