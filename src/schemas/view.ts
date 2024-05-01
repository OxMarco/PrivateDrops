import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ViewDocument = HydratedDocument<View>;

@Schema({ timestamps: true })
export class View {
  @Prop()
  id: string;

  @Prop({ required: true })
  ip: string;

  @Prop({ required: true, default: false })
  leftFeedback: boolean;

  @Prop({ required: true })
  payment: boolean;

  @Prop({ required: true, default: new Date() })
  lastSeen: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ViewSchema = SchemaFactory.createForClass(View);
