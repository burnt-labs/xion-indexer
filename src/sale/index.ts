import { CosmosEvent } from "@subql/types-cosmos";
import { ISale } from "../interfaces";
import { Seat, Sale, Coin } from "../types";

export async function handleSeatContractPrimarySaleCreatedHelper(
  event: CosmosEvent
): Promise<void> {
  if (event.event.type === "wasm-sales-add_primary_sale") {
    logger.info("Seat Sale Created event detected");
    let seatContractAddress = event.event.attributes.find(
      (attr) => attr.key === "contract_address"
    )?.value;
    if (!seatContractAddress) {
      logger.info(
        "Seat Sale Created event detected but no seat contract address"
      );
      return;
    }
    let seat = await Seat.get(seatContractAddress);
    if (!seat) {
      logger.info(
        "Seat Sale Created event detected but no seat attached to seat contract address"
      );
      return;
    }
    let saleMetaJson = event.event.attributes.find(
      (attr) => attr.key === "sale_object"
    )?.value;
    if (saleMetaJson) {
      let saleMeta: ISale = JSON.parse(saleMetaJson);
      let sale = new Sale(
        seatContractAddress,
        seatContractAddress,
        BigInt(saleMeta.total_supply),
        BigInt(saleMeta.tokens_minted),
        BigInt(saleMeta.start_time),
        BigInt(saleMeta.end_time),
        saleMeta.disabled
      );
      for (let coin of saleMeta.price) {
        await new Coin(
          seatContractAddress,
          seatContractAddress + saleMeta.start_time,
          coin.denom,
          BigInt(coin.amount)
        ).save();
      }
      await sale.save();
    } else {
      logger.info("Seat Sale Created event detected but no sale meta");
    }
  }
}

export async function handleSeatContractPrimarySaleHalted(event: CosmosEvent) {
  if (event.event.type === "wasm-sales-halt_sale") {
    logger.info("Seat Sale Halted event detected");
    let seatContractAddress = event.event.attributes.find(
      (attr) => attr.key === "contract_address"
    )?.value;
    if (!seatContractAddress) {
      logger.info(
        "Seat Sale Halted event detected but no seat contract address"
      );
      return;
    }
    let seat = await Seat.get(seatContractAddress);
    if (!seat) {
      logger.info(
        "Seat Sale Halted event detected but no seat attached to seat contract address"
      );
      return;
    }
    let sale = await Sale.get(seatContractAddress);
    if (!sale) {
      logger.info(
        "Seat Sale Halted event detected but no sale attached to seat contract address"
      );
      return;
    }
    let saleMetaJson = event.event.attributes.find(
      (attr) => attr.key === "sale_object"
    )?.value;
    if (saleMetaJson) {
      let saleMeta: ISale = JSON.parse(saleMetaJson);
      sale.totalSupply = BigInt(saleMeta.total_supply);
      sale.tokensMinted = BigInt(saleMeta.tokens_minted);
      sale.startTime = BigInt(saleMeta.start_time);
      sale.endTime = BigInt(saleMeta.end_time);
      sale.disabled = true;
    }
    sale.save();
  }
}
