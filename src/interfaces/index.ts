export interface HubMetadata {
  name: string;
  hub_url: string;
  description: string;
  tags: Array<string>;
  social_links: [];
  creator: string;
  thumbnail_image_url: string;
  banner_image_url: string;
  seat_contract?: string;
}
