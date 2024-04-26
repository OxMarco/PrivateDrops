import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { LowercasePipe } from '../validation/lowercase';
import { CreateMediaDto } from '../dtos/create-media';
import { Media } from '../schemas/Media';
import { Public } from '../decorators/public';
import { MediaEntity } from '../entities/media';
import { FileValidationPipe } from '../validation/file';
import { LeaveFeedbackDto } from '../dtos/leave-feedback';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  async getUserMedia(@Req() req: Request): Promise<{ media: MediaEntity[] }> {
    const userId: string = (req as any).id;
    const media = await this.mediaService.getUserMedia(userId);
    return { media };
  }

  @Public()
  @Get('/:code')
  async get(
    @Param('code', LowercasePipe) code: string,
    @Ip() ip: string,
  ): Promise<any> {
    return await this.mediaService.getMedia(code, ip);
  }

  @Post()
  @UseInterceptors(FileInterceptor('mediaFile'))
  async upload(
    @Body() createMediaDto: CreateMediaDto,
    @UploadedFile(new FileValidationPipe()) mediaFile: Express.Multer.File,
    @Req() req: Request,
  ): Promise<Media> {
    const userId: string = (req as any).id;
    return await this.mediaService.upload(mediaFile, createMediaDto, userId);
  }

  @Post('delete/:id')
  async delete(@Param('id') id: string, @Req() req: Request): Promise<void> {
    const userId: string = (req as any).id;

    return await this.mediaService.deleteMedia(id, userId);
  }

  @Public()
  @Get('/pay/:code')
  async pay(@Param('code') code: string, @Ip() ip: string): Promise<void> {
    return await this.mediaService.registerPayment(code, ip);
  }

  @Public()
  @Post('/review')
  async leaveFeedback(@Body() feedbackDto: LeaveFeedbackDto, @Ip() ip: string) {
    return await this.mediaService.leaveFeedback(feedbackDto, ip);
  }
}
