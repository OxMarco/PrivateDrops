import { Expose } from 'class-transformer';

export class UserEntity {
  @Expose()
  id: string;

  @Expose()
  nickname: string;

  @Expose()
  email: string;

  @Expose()
  payouts: number;

  @Expose()
  ratings: number[];

  @Expose()
  stripeAccountId?: string;

  @Expose()
  stripeVerified: boolean;

  @Expose()
  currency: string;

  @Expose()
  banned: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
