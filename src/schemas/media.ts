import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';
import { View } from './view';
import { User } from './user';

export type MediaDocument = HydratedDocument<Media>;

@Schema({ timestamps: true })
export class Media {
  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, unique: true })
  originalName: string;

  @Prop({ required: true })
  blurredName: string;

  @Prop({ required: true, unique: true })
  originalUrl: string;

  @Prop({ required: true })
  blurredUrl: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  owner: any;

  @Prop({ required: true })
  mime: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  singleView: boolean;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'View' }] })
  views: any[];

  @Prop({ required: true, default: false })
  flagged: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const MediaSchema = SchemaFactory.createForClass(Media);
