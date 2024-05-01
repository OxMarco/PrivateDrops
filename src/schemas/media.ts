import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';
import { View } from './view';

export type MediaDocument = HydratedDocument<Media>;

@Schema({ timestamps: true })
export class Media {
  @Prop()
  id: string;

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
  owner: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true })
  mime: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  singleView: boolean;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'View' }] })
  views: View[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const MediaSchema = SchemaFactory.createForClass(Media);
