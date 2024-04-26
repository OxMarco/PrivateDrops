import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ViewDocument = HydratedDocument<View>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class View {
  @Prop({ required: true })
  ip: string;

  @Prop({ required: true, default: false })
  leftFeedback: boolean;

  @Prop({ required: true })
  payment: boolean;

  @Prop({ required: true, default: new Date() })
  lastSeen: Date;
}

export const ViewSchema = SchemaFactory.createForClass(View);
