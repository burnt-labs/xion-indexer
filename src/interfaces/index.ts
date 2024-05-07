export interface HubMetadata {
  name: string;
  hub_url: string;
  description: string;
  tags: Array<string>;
  social_links: Array<SocialLink>;
  creator: string;
  thumbnail_image_url: string;
  banner_image_url: string;
  seat_contract?: string;
}

export interface SeatMetadata {
  name: string;
  image_uri: string;
  description: string;
  benefits: Array<SeatBenefit>;
  hub_contract: string;
}

type SocialLink = {
  name: string;
  url: string;
};

type SeatBenefit = {
  name: string;
  status: string;
};

export type ISale = {
  total_supply: string;
  tokens_minted: string;
  start_time: string;
  end_time: string;
  price: Array<ICoin>;
  disabled: boolean;
};

export type ICoin = {
  denom: string;
  amount: string;
};

enum AuthenticatorTransport {
	USB = "usb",
	NFC = "nfc",
	BLE = "ble",
	Hybrid = "hybrid",
	Internal = "internal",
}

interface CredentialFlags {
	UserPresent: boolean;
	UserVerified: boolean;
	BackupEligible: boolean;
	BackupState: boolean;
}

enum AuthenticatorAttachment {
	Platform = "platform",
	CrossPlatform = "cross-platform"
}

interface Authenticator {
	AAGUID: string;
	SignCount: number;
	CloneWarning: boolean;
	Attachment: AuthenticatorAttachment
}

export type ICredential = {
	ID: string;
	PublicKey: string;
	AttestationType: string
	Transport: AuthenticatorTransport[];
	Flags: CredentialFlags
	Authenticator: Authenticator
}

export type IAuthenticator = {
  Secp256K1?: { pubkey: string };
  Ed25519?: { pubkey: string };
  EthWallet?: { address: string };
  Jwt?: { aud: string; sub: string };
  Passkey? : { credential: string };
};

export type IAddAuthenticator = {
  Secp256K1?: { id: number; pubkey: string; signature: string };
  Ed25519?: { id: number; pubkey: string; signature: string };
  EthWallet?: { id: number; address: string; signature: string };
  Jwt?: { id: number; aud: string; sub: string; token: string };
  Passkey? : { id: number, url: string, credential: string };
};
