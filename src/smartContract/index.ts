import { CosmosEvent } from "@subql/types-cosmos";
import { SmartAccount, SmartAccountAuthenticator } from "../types";
import { IAuthenticator } from "../interfaces";
import { v4 as uuidv4 } from "uuid";

export async function handleSmartAccountContractInstantiateHelper(
  event: CosmosEvent
): Promise<void> {
  if (event.event.type === "instantiate") {
    let codeId = event.event.attributes.find(
      (attr) => attr.key === "code_id"
    )?.value;
    if (codeId !== "15") {
      // This event is not for our codeId
      return;
    }
    logger.info("Smart Account Instantiate event detected");
    let contractAddress = event.event.attributes.find(
      (attr) => attr.key === "_contract_address"
    )?.value;
    if (contractAddress) {
      const smartAccount = new SmartAccount(contractAddress, 1);
      logger.info("New smart wallet detected ", contractAddress);
      await smartAccount.save();
    }
  }
}

export async function handleSmartAccountContractInstantiateMetadataHelper(
  event: CosmosEvent
): Promise<void> {
  if (event.event.type === "wasm-create_abstract_account") {
    logger.info("Smart Account Data Instantiate event detected");
    let contractAddress = event.event.attributes.find(
      (attr) => attr.key === "_contract_address"
    )?.value;
    if (contractAddress) {
      let smartAccount = await SmartAccount.get(contractAddress);
      if (!smartAccount) {
        logger.info("No smart account found for the contract");
        return;
      } else {
        let authenticatorData = event.event.attributes.find(
          (attr) => attr.key === "authenticator"
        )?.value;
        if (authenticatorData) {
          let authData: IAuthenticator = JSON.parse(authenticatorData);
          let authType = Object.keys(authData)[0];
          let authPubKey = authData[authType].pubkey;
          // In order to make the authenticator id unique, we will use the sha256 hash of the contract address
          // and append the auth id to it with a xion prefix to easily split it later.
          // This will ensure that the authenticator id is unique and
          let authId = smartAccount.id + "xion1";
          let authMethodExists =
            await SmartAccountAuthenticator.getByAuthenticatorId(authId);
          if (authMethodExists) {
            logger.info("Auth method already exists");
            return;
          }
          let smartWalletAuth = new SmartAccountAuthenticator(
            uuidv4(),
            contractAddress,
            authType,
            authPubKey,
            authId,
            "v1"
          );
          await smartWalletAuth.save();
        }
      }
    }
  }
}

export async function handleSmartAccountContractAddAuthenticatorHelper(
  event: CosmosEvent
): Promise<void> {
  if (event.event.type === "wasm-add_auth_method") {
    logger.info("Smart Account Add Auth event detected");
    let contractAddress = event.event.attributes.find(
      (attr) => attr.key === "_contract_address"
    )?.value;
    if (contractAddress) {
      let smartAccount = await SmartAccount.get(contractAddress);
      if (!smartAccount) {
        logger.info("No smart account found for the contract");
        return;
      } else {
        let authenticatorData = event.event.attributes.find(
          (attr) => attr.key === "authenticator"
        )?.value;
        if (authenticatorData) {
          let authData: IAuthenticator = JSON.parse(authenticatorData);
          let authType = Object.keys(authData)[0];
          let authPubKey = authData[authType].pubkey;
          let authId = authData[authType].id;
          if (!authId) {
            logger.info("No auth id found for the authenticator");
            return;
          } else if (!Number(authId)) {
            logger.info("Auth id is not a number");
            return;
          }
          // set the latest authenticator id if the current one is greater than the latest
          // this will ensure that the latest authenticator id is always the highest
          if (Number(authId) > smartAccount.latestAuthenticatorId) {
            smartAccount.latestAuthenticatorId = Number(authId);
          }
          authId = smartAccount.id + "xion" + authId;
          let smartWalletAuth = new SmartAccountAuthenticator(
            uuidv4(),
            contractAddress,
            authType,
            authPubKey,
            authId,
            "v1"
          );
          await smartAccount.save();
          await smartWalletAuth.save();
        }
      }
    }
  }
}

export async function handleSmartAccountContractRemoveAuthenticatorHelper(
  event: CosmosEvent
): Promise<void> {
  if (event.event.type === "wasm-remove_auth_method") {
    logger.info("Smart Account Remove Auth event detected");
    const contractAddress = event.event.attributes.find(
      (attr) => attr.key === "_contract_address"
    )?.value;
    if (contractAddress) {
      const smartAccount = await SmartAccount.get(contractAddress);
      if (!smartAccount) {
        logger.info("No smart account found for the contract");
        return;
      } else {
        const authenticatorId = event.event.attributes.find(
          (attr) => attr.key === "authenticator_id"
        )?.value;
        if (authenticatorId && Number(authenticatorId)) {
          const authId = smartAccount.id + "xion" + authenticatorId;
          const smartWallet =
            await SmartAccountAuthenticator.getByAuthenticatorId(authId);
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
