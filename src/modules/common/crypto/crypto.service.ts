import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CryptoService {
  private encryptionKey: string;
  private iv: string;

  constructor(private configService: ConfigService) {
    this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    this.iv = this.configService.get<string>('IV');
  }

  encryptPassword(plainText: string): string {
    const key = CryptoJS.enc.Hex.parse(this.encryptionKey);
    const iv = CryptoJS.enc.Hex.parse(this.iv);

    const encrypted = CryptoJS.AES.encrypt(plainText, key, { iv: iv });

    return encrypted.toString();
  }

  decryptPassword(cipherText: string): string {
    const key = CryptoJS.enc.Hex.parse(this.encryptionKey);
    const iv = CryptoJS.enc.Hex.parse(this.iv);

    const decrypteBase64 = CryptoJS.AES.decrypt(cipherText, key, { iv: iv });

    const baseDecrypted = decrypteBase64.toString(CryptoJS.enc.Utf8);

    const passwordDecrypt = CryptoJS.AES.decrypt(baseDecrypted, key, {
      iv: iv,
    });

    const password = passwordDecrypt.toString(CryptoJS.enc.Utf8);

    return password;
  }
}
