import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

@Injectable()
export class LeaderboardService {
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly leaderboardFile = path.join(this.dataDir, 'leaderboard.json');

  async ensureDataFile(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      try {
        await fs.access(this.leaderboardFile);
      } catch {
        const initialData: LeaderboardEntry[] = [
          { name: 'Ahmet', score: 850, date: new Date().toISOString() },
          { name: 'Fatma', score: 920, date: new Date().toISOString() },
          { name: 'Mehmet', score: 780, date: new Date().toISOString() },
        ];
        await fs.writeFile(this.leaderboardFile, JSON.stringify(initialData, null, 2));
      }
    } catch (err) {
      console.error('Data file setup error:', err);
    }
  }

  async readLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const txt = await fs.readFile(this.leaderboardFile, 'utf8');
      return JSON.parse(txt || '[]');
    } catch (err) {
      console.error('Read error', err);
      return [];
    }
  }

  private async writeLeaderboard(list: LeaderboardEntry[]): Promise<void> {
    try {
      await fs.writeFile(this.leaderboardFile, JSON.stringify(list, null, 2));
    } catch (err) {
      console.error('Write error', err);
    }
  }

  async getLeaderboard(
    by: string = 'score',
    order: string = 'desc',
  ): Promise<LeaderboardEntry[]> {
    const list = await this.readLeaderboard();

    const compare = (a: LeaderboardEntry, b: LeaderboardEntry): number => {
      if (by === 'name') {
        const cmp = String(a.name).localeCompare(String(b.name));
        return order === 'asc' ? cmp : -cmp;
      }
      if (by === 'date') {
        const da = new Date(a.date || 0).getTime();
        const db = new Date(b.date || 0).getTime();
        return order === 'asc' ? da - db : db - da;
      }
      return order === 'asc' ? a.score - b.score : b.score - a.score;
    };

    list.sort(compare);
    return list;
  }

  async addScore(name: string, score: number): Promise<LeaderboardEntry[]> {
    const list = await this.readLeaderboard();
    list.push({ name: name.trim(), score, date: new Date().toISOString() });
    list.sort((a, b) => b.score - a.score);
    const trimmed = list.slice(0, 100);

    await this.writeLeaderboard(trimmed);
    return trimmed;
  }

  async clearLeaderboard(): Promise<void> {
    await this.writeLeaderboard([]);
  }
}