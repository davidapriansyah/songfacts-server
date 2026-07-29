import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BandsService } from './bands.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('bands')
@Controller('bands')
export class BandsController {
  constructor(private readonly bandsService: BandsService) {}

  @Get(':name')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get band by name' })
  @ApiResponse({ status: 200, description: 'Band information' })
  @ApiResponse({ status: 404, description: 'Band not found' })
  async findByName(@Param('name') name: string) {
    return this.bandsService.findByName(name);
  }

  @Get(':name/timeline')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get band timeline (AI-generated)' })
  @ApiResponse({ status: 200, description: 'Band timeline' })
  async getTimeline(@Param('name') name: string) {
    return this.bandsService.getTimeline(name);
  }

  @Get(':name/discography')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get band discography' })
  @ApiResponse({ status: 200, description: 'Band discography' })
  async getDiscography(@Param('name') name: string) {
    return this.bandsService.getDiscography(name);
  }
}
