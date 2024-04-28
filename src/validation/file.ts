import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { fromBuffer } from 'file-type';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  async transform(value: Express.Multer.File) {
    if (!value || !value.buffer) {
      throw new BadRequestException('No file uploaded.');
    }

    const { mime } = await fromBuffer(value.buffer);
    const MIME_TYPES = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/mpeg',
      'video/webm',
    ];

    if (!mime || !MIME_TYPES.includes(mime)) {
      throw new BadRequestException(
        'The file should be either an image or a video.',
      );
    }

    const minFileSize = 10 * 1024; // 10KB
    if (value.size < minFileSize) {
      throw new BadRequestException('The file should be min 10KB.');
    }

    const maxFileSize = 300 * 1024 * 1024; // 300MB
    if (value.size > maxFileSize) {
      throw new BadRequestException('The file should be under 300MB.');
    }

    return value;
  }
}
