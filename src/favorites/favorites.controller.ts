import { Controller, Get, Post, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Get user favorites' })
  @ApiResponse({ status: 200, description: 'List of favorite songs' })
  async findAll(@Req() req) {
    return this.favoritesService.findByUser(req.user.id);
  }

  @Post(':songId')
  @ApiOperation({ summary: 'Add song to favorites' })
  @ApiResponse({ status: 201, description: 'Song added to favorites' })
  @ApiResponse({ status: 409, description: 'Song already in favorites' })
  async add(@Req() req, @Param('songId') songId: number) {
    return this.favoritesService.add(req.user.id, songId);
  }

  @Delete(':songId')
  @ApiOperation({ summary: 'Remove song from favorites' })
  @ApiResponse({ status: 200, description: 'Song removed from favorites' })
  @ApiResponse({ status: 404, description: 'Favorite not found' })
  async remove(@Req() req, @Param('songId') songId: number) {
    return this.favoritesService.remove(req.user.id, songId);
  }
}
