import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Headers,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { MediaService } from './media.service';
import { LowercasePipe } from 'src/validation/lowercase';
import { CreateMediaDto } from 'src/dtos/create-media';
import { Media } from 'src/schemas/media';
import { Public } from 'src/decorators/public';
import { MediaEntity } from 'src/entities/media';
import { LeaveFeedbackDto } from 'src/dtos/leave-feedback';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  async getUserMedia(@Req() req: Request): Promise<MediaEntity[]> {
    const userId: string = req.id;
    return await this.mediaService.getUserMedia(userId);
  }

  @Public()
  @Get('/:code')
  async get(
    @Param('code', LowercasePipe) code: string,
    @Headers('x-forwarded-for') ip: string,
  ): Promise<MediaEntity> {
    return await this.mediaService.getMedia(code, ip);
  }

  @Post()
  @UseInterceptors(FileInterceptor('mediaFile'))
  async upload(
    @Body() createMediaDto: CreateMediaDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 300000000,
            message:
              'File validation failed (expected size is less than 350MB)',
          }),
          new FileTypeValidator({
            fileType: '.(png|jpeg|jpg|webp|avi|webp|mp4|mpeg|webm)',
          }),
        ],
      }),
    )
    mediaFile: Express.Multer.File,
    @Req() req: Request,
  ): Promise<Media> {
    const userId: string = req.id;
    return await this.mediaService.upload(mediaFile, createMediaDto, userId);
  }

  @Delete(':id')
  async deleteMedia(@Param('id') id: string, @Req() req: Request) {
    const userId: string = req.id;

    return await this.mediaService.deleteMedia(id, userId);
  }

  @Public()
  @Post('/review')
  async leaveFeedback(
    @Body() feedbackDto: LeaveFeedbackDto,
    @Headers('x-forwarded-for') ip: string,
  ) {
    return await this.mediaService.leaveFeedback(feedbackDto, ip);
  }
}
