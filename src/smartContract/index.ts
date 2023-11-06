import { CosmosEvent } from "@subql/types-cosmos";
import { SmartAccount, SmartAccountAuthenticator } from "../types";
import { IAddAuthenticator, IAuthenticator } from "../interfaces";

export async function handleSmartAccountContractInstantiateHelper(
  event: CosmosEvent,
): Promise<void> {
  let contractAddress = event.event.attributes.find(
    (attr) => attr.key === "_contract_address",
  )?.value;

  let authenticatorId =
    event.event.attributes.find((attr) => attr.key === "authenticator_id")
      ?.value || "0";

  logger.info(`Smart Account Instantiate event detected - ${contractAddress}`);
  if (contractAddress) {
    logger.info(
      `Smart Account Instantiate contract address - ${contractAddress}`,
    );
    const smartAccount = SmartAccount.create({
      id: contractAddress,
      latestAuthenticatorId: Number(authenticatorId),
    });
    logger.info(`New smart wallet detected - ${contractAddress}`);
    await smartAccount.save();
  }
}

export async function handleSmartAccountContractInstantiateMetadataHelper(
  event: CosmosEvent,
): Promise<void> {
  logger.info(
    `Smart Account Data Instantiate event detected - ${event.event.type}`,
  );
  let contractAddress = event.event.attributes.find(
    (attr) => attr.key === "_contract_address",
  )?.value;

  let authenticatorIndex = Number(
    event.event.attributes.find((attr) => attr.key === "authenticator_id")
      ?.value || "0",
  );

  if (contractAddress) {
    const smartAccount = SmartAccount.create({
      id: contractAddress,
      latestAuthenticatorId: authenticatorIndex,
    });
    await smartAccount.save();

    let authenticatorData = event.event.attributes.find(
      (attr) => attr.key === "authenticator",
    )?.value;
    if (authenticatorData) {
      let authData: IAuthenticator = JSON.parse(authenticatorData);
      for (const authType of Object.keys(authData)) {
        let authenticator: string | undefined;
        switch (authType) {
          case "Secp256K1":
            authenticator = authData[authType]?.pubkey;
            break;
          case "Ed25519":
            authenticator = authData[authType]?.pubkey;
            break;
          case "EthWallet":
            authenticator = authData[authType]?.address;
            break;
          case "Jwt":
            authenticator = `${authData[authType]?.aud}.${authData[authType]?.sub}`;
            break;
          default:
            logger.info(`Unknown authenticator type - ${authType}`);
            return;
        }

        if (!authenticator) {
          logger.info(`No authenticator found for the type - ${authType}`);
          return;
        }

        let authId = `${contractAddress}-${authenticatorIndex}`;
        let smartWalletAuth = SmartAccountAuthenticator.create({
          id: authId,
          accountId: contractAddress,
          type: authType,
          authenticator,
          authenticatorIndex,
          version: "v1",
        });
        await smartWalletAuth.save();
      }
    }
  }
}

export async function handleSmartAccountContractAddAuthenticatorHelper(
  event: CosmosEvent,
): Promise<void> {
  logger.info("Smart Account Add Auth event detected");
  let contractAddress = event.event.attributes.find(
    (attr) => attr.key === "_contract_address",
  )?.value;
  if (contractAddress) {
    let smartAccount = await SmartAccount.get(contractAddress);
    if (!smartAccount) {
      logger.info("No smart account found for the contract");
      return;
    } else {
      let authenticatorData = event.event.attributes.find(
        (attr) => attr.key === "authenticator",
      )?.value;
      if (authenticatorData) {
        let authData: IAddAuthenticator = JSON.parse(authenticatorData);
        for (const authType of Object.keys(authData)) {
          let authenticator: string | undefined;
          let authenticatorIndex: number | undefined;
          switch (authType) {
            case "Secp256K1":
              authenticatorIndex = authData[authType]?.id;
              authenticator = authData[authType]?.pubkey;
              break;
            case "Ed25519":
              authenticatorIndex = authData[authType]?.id;
              authenticator = authData[authType]?.pubkey;
              break;
            case "EthWallet":
              authenticatorIndex = authData[authType]?.id;
              authenticator = authData[authType]?.address;
              break;
            case "Jwt":
              authenticatorIndex = authData[authType]?.id;
              authenticator = `${authData[authType]?.aud}.${authData[authType]?.sub}`;
              break;
            default:
              logger.info(`Unknown authenticator type - ${authType}`);
              return;
          }

          if (!authenticator) {
            logger.info(`No authenticator found for the type - ${authType}`);
            return;
          }

          if (!authenticatorIndex) {
            logger.info(
              `No authenticator index found for the type - ${authType}`,
            );
            return;
          }

          // set the latest authenticator id if the current one is greater than the latest
          // this will ensure that the latest authenticator id is always the highest
          if (Number(authenticatorIndex) > smartAccount.latestAuthenticatorId) {
            smartAccount.latestAuthenticatorId = Number(authenticatorIndex);
          }

          let smartWalletAuth = SmartAccountAuthenticator.create({
            // This is a unique id for the authenticator.
            id: `${contractAddress}-${authenticatorIndex}`,
            accountId: contractAddress,
            type: authType,
            authenticator,
            authenticatorIndex,
            version: "v1",
          });
          await smartWalletAuth.save();
        }
        await smartAccount.save();
      }
    }
  }
}

export async function handleSmartAccountContractRemoveAuthenticatorHelper(
  event: CosmosEvent,
): Promise<void> {
  if (event.event.type === "wasm-remove_auth_method") {
    logger.info("Smart Account Remove Auth event detected");
    const contractAddress = event.event.attributes.find(
      (attr) => attr.key === "_contract_address",
    )?.value;
    if (contractAddress) {
      const smartAccount = await SmartAccount.get(contractAddress);
      if (!smartAccount) {
        logger.info("No smart account found for the contract");
        return;
      } else {
        const authenticatorId = event.event.attributes.find(
          (attr) => attr.key === "authenticator_id",
        )?.value;
        if (authenticatorId && Number(authenticatorId)) {
          const authId = `${contractAddress}-${authenticatorId}`;
          const smartWallet = await SmartAccountAuthenticator.get(authId);
          if (!smartWallet) {
            logger.info("No smart wallet found for the authenticator id");
            return;
          } else {
            await SmartAccountAuthenticator.remove(smartWallet.id);
          }
        }
      }
    }
  }
}
