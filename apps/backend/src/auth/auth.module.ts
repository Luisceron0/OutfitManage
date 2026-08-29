import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from '../common/strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const privateKey = configService.get<string>('JWT_PRIVATE_KEY');
        const secret = configService.get<string>('JWT_SECRET') || 'tienda360_default_dev_secret_key_change_in_prod';
        const expiration = configService.get<string>('JWT_ACCESS_EXPIRATION', '15m');

        if (privateKey) {
          return {
            privateKey,
            publicKey: configService.get<string>('JWT_PUBLIC_KEY'),
            signOptions: { algorithm: 'RS256', expiresIn: expiration as any },
          };
        }

        return {
          secret,
          signOptions: { expiresIn: expiration as any },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
