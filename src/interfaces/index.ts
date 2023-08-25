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
