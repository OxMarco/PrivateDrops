import { Expose } from 'class-transformer';

export class MediaEntity {
  @Expose()
  id: string;

  @Expose()
  code: string;

  @Expose()
  price: number;

  @Expose()
  currency: string;

  @Expose()
  url: string;

  @Expose()
  singleView: boolean;

  @Expose()
  totalViews: number;

  @Expose()
  earnings: number;
}
