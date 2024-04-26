import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

@Injectable()
export class AwsService {
  private s3: AWS.S3;
  private aws_s3_bucket: string;

  constructor(private configService: ConfigService) {
    this.aws_s3_bucket = this.configService.get<string>('AWS_S3_BUCKET');
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get<string>('AWS_S3_ACCESS_KEY'),
      secretAccessKey: this.configService.get<string>('AWS_S3_SECRET_KEY'),
    });
  }

  async uploadFile(file: any, name: string) {
    return await this.s3_upload(
      file.buffer,
      this.aws_s3_bucket,
      name,
      file.mimetype,
    );
  }

  private async s3_upload(
    file: any,
    bucket: string,
    name: string,
    mimetype: string,
  ) {
    const params = {
      Bucket: bucket,
      Key: name,
      Body: file,
      ACL: 'public-read',
      ContentType: mimetype,
      ContentDisposition: 'inline',
      CreateBucketConfiguration: {
        LocationConstraint: 'eu-north-1',
      },
    };

    const s3Response = await this.s3.upload(params).promise();
    return s3Response.Location;
  }

  async deleteFile(key: string) {
    const params = {
      Bucket: this.aws_s3_bucket,
      Key: key,
    };

    return await this.s3.deleteObject(params).promise();
  }
}
