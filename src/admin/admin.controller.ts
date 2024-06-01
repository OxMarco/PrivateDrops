import { Body, Controller, Delete, Get, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { Media } from 'src/schemas/media';
import { User } from 'src/schemas/user';
import { View } from 'src/schemas/view';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('/users')
  async getAllUsers(@Req() req: Request): Promise<User[]> {
    const userId: string = req.id;
    return await this.adminService.getAllUsers(userId);
  }

  @Get('/user/:id')
  async getUserData(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<any> {
    const userId: string = req.id;
    return await this.adminService.getUserData(id, userId);
  }

  @Get('/media')
  async getAllMedia(@Req() req: Request): Promise<Media[]> {
    const userId: string = req.id;
    return await this.adminService.getAllMedia(userId);
  }

  @Get('/media/flagged')
  async getFlaggedMedia(@Req() req: Request): Promise<Media[]> {
    const userId: string = req.id;
    return await this.adminService.getFlaggedMedia(userId);
  }

  @Get('/views')
  async getAllViews(@Req() req: Request): Promise<View[]> {
    const userId: string = req.id;
    return await this.adminService.getAllViews(userId);
  }

  @Delete('/media')
  async mediaCleanup(
    @Body() mediaId: string,
    @Req() req: Request,
  ): Promise<any> {
    const userId: string = req.id;
    return await this.adminService.mediaCleanup(mediaId, userId);
  }
}
