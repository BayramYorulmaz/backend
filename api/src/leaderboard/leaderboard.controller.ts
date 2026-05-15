import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import { LeaderboardService, LeaderboardEntry } from './leaderboard.service';

@Controller()
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {
    this.leaderboardService.ensureDataFile();
  }

  @Get('/leaderboard')
  async getLeaderboard(
    @Query('by') by: string = 'score',
    @Query('order') order: string = 'desc',
  ): Promise<LeaderboardEntry[]> {
    return this.leaderboardService.getLeaderboard(by, order);
  }

  @Post('/score')
  @HttpCode(201)
  async addScore(@Body() body: any): Promise<LeaderboardEntry[]> {
    if (typeof body.name !== 'string' || typeof body.score !== 'number') {
      throw new BadRequestException(
        'Invalid payload. Expect { name: string, score: number }',
      );
    }

    return this.leaderboardService.addScore(body.name, body.score);
  }

  @Delete('/leaderboard')
  @HttpCode(204)
  async clearLeaderboard(): Promise<void> {
    await this.leaderboardService.clearLeaderboard();
  }

  @Get('/health')
  getHealth(): { status: string; timestamp: string } {
    return { status: 'OK', timestamp: new Date().toISOString() };
  }
}