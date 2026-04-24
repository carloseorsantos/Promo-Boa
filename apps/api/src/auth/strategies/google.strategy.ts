import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

interface GoogleProfile {
  id: string;
  displayName: string;
  emails: Array<{ value: string }>;
  photos: Array<{ value: string }>;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get('GOOGLE_CLIENT_ID', ''),
      clientSecret: config.get('GOOGLE_CLIENT_SECRET', ''),
      callbackURL: `${config.get('API_URL', 'http://localhost:3000')}/v1/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ) {
    const { id, displayName, emails, photos } = profile;
    done(null, {
      oauthProvider: 'google',
      oauthProviderId: id,
      email: emails[0].value,
      name: displayName,
      avatarUrl: photos[0]?.value ?? null,
    });
  }
}
