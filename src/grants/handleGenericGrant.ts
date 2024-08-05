import { CosmosMessage } from "@subql/types-cosmos";
import { MsgGrant } from "../proto_types/cosmos/authz/v1beta1/tx";
import { AuthzAuthorization, AuthzGrant, UserAddress } from "../types";
import { GenericAuthorization } from "../proto_types/cosmos/authz/authz";

export async function handleAuthzGenericMsgGrant(msg: CosmosMessage<MsgGrant>) {
  const msgGrantee = msg.msg.decodedMsg.grantee;
  const msgGranter = msg.msg.decodedMsg.granter;

  const granter = await UserAddress.get(msgGranter);
  if (!granter) {
    UserAddress.create({
      id: msgGranter,
    }).save();
  }
  const grantee = await UserAddress.get(msgGrantee);
  if (!grantee) {
    UserAddress.create({
      id: msgGrantee,
    }).save();
  }

  const grant = msg.msg.decodedMsg.grant;
  if (!grant) {
    return;
  }

  const authorization = grant.authorization;
  if (!authorization) {
    return;
  }
  const expiration = grant.expiration;
  if (!expiration) {
    logger.info("No expiration found in grant");
  }

  const authzGrantId = msgGranter + msgGrantee + authorization.typeUrl;
  let authzGrant = await AuthzGrant.get(authzGrantId);
  if (authzGrant) {
    // A grant already exists, no need to create a new one
    return;
  }
  authzGrant = AuthzGrant.create({
    id: authzGrantId,
    granterId: msgGranter,
    granteeId: msgGrantee,
  });
  await authzGrant.save();

  let authzAuth = await AuthzAuthorization.get(authzGrantId);
  if (!authzAuth) {
    authzAuth = AuthzAuthorization.create({
      id: authzGrantId,
      type: authorization.typeUrl,
      expiration: BigInt(expiration ? expiration.seconds : 0),
      authData: "",
      grantId: authzGrantId,
    });
  }

  const authData: Record<string, any> = {};
  const genericAuthzMsg = GenericAuthorization.decode(
    Uint8Array.from(authorization.value)
  );
  authData["msg"] = genericAuthzMsg.msg;
  authzAuth.authData = JSON.stringify(authData);
  await authzAuth.save();
}
