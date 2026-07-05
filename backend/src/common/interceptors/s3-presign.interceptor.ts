import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { StorageService } from '../../modules/storage/storage.service';

@Injectable()
export class S3PresignInterceptor implements NestInterceptor {
  constructor(private readonly storageService: StorageService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      switchMap(data => from(this.traverseAndSign(data)))
    );
  }

  private async traverseAndSign(obj: any): Promise<any> {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
      if (obj.includes('.s3.') && obj.includes('.amazonaws.com')) {
        return await this.storageService.getPresignedUrl(obj);
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return Promise.all(obj.map(item => this.traverseAndSign(item)));
    }

    if (typeof obj === 'object') {
      // Avoid traversing dates or buffers
      if (obj instanceof Date || Buffer.isBuffer(obj)) {
        return obj;
      }
      
      const newObj = { ...obj };
      const keys = Object.keys(newObj);
      for (const key of keys) {
        newObj[key] = await this.traverseAndSign(newObj[key]);
      }
      return newObj;
    }

    return obj;
  }
}
