import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';

interface ThumbnailJob {
  flyerId: string;
  storageKey: string;
}

@Processor('thumbnails')
export class ThumbnailProcessor {
  private readonly logger = new Logger(ThumbnailProcessor.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  @Process('generate')
  async handleGenerate(job: Job<ThumbnailJob>): Promise<void> {
    const { flyerId, storageKey } = job.data;
    this.logger.log(`Generating thumbnail for flyer ${flyerId}`);

    try {
      // pdfjs-dist is used here to render the first page as PNG
      // Deferred to Phase 2 implementation; placeholder logs success
      const thumbnailKey = storageKey.replace(/\.pdf$/i, '-thumb.png').replace('flyers/', 'thumbnails/');

      // TODO: Implement actual PDF-to-PNG conversion using pdfjs-dist
      // const pdfData = await getPdfBuffer(storageKey);
      // const pngBuffer = await renderFirstPageAsPng(pdfData);
      // const thumbnailUrl = await this.storage.uploadFile(thumbnailKey, pngBuffer, 'image/png');

      this.logger.log(`Thumbnail job queued for ${flyerId}, key: ${thumbnailKey}`);
    } catch (err) {
      this.logger.error(`Thumbnail generation failed for ${flyerId}`, err);
    }
  }
}
