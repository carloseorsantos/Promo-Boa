import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.supabase = createClient(
      config.getOrThrow('SUPABASE_URL'),
      config.getOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
    );
    this.bucket = config.get('SUPABASE_STORAGE_BUCKET', 'flyers');
  }

  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(key, buffer, { contentType, upsert: false });

    if (error) throw new InternalServerErrorException(`Storage upload failed: ${error.message}`);

    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(key);
    return data.publicUrl;
  }

  async getSignedUrl(key: string, expiresInSeconds = 900): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(key, expiresInSeconds);

    if (error || !data) {
      throw new InternalServerErrorException('Failed to generate signed URL');
    }
    return data.signedUrl;
  }

  async deleteFile(key: string): Promise<void> {
    const { error } = await this.supabase.storage.from(this.bucket).remove([key]);
    if (error) throw new InternalServerErrorException(`Storage delete failed: ${error.message}`);
  }
}
