import { Injectable } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'products',
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    const config = cloudinary.config();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      throw new Error('Invalid Cloudinary configuration. Check environment variables.');
    }
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          if (result) {
            resolve(result);
          } else {
            reject(new Error('Cloudinary upload returned undefined result'));
          }
        },
      );
      
      const fileStream = new Readable();
      fileStream.push(file.buffer);
      fileStream.push(null);
      fileStream.pipe(uploadStream);
    });
  }  async deleteImage(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error(`Error deleting image ${publicId}:`, error);
      throw error;
    }
  }    isCloudinaryUrl(url: string): boolean {
    return typeof url === 'string' && url.includes('cloudinary.com');
  }

  getPublicIdFromUrl(imageUrl: string): string {
    try {
      const urlParts = imageUrl.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      
      if (uploadIndex === -1) {
        throw new Error('Not a valid Cloudinary URL, missing "upload" part');
      }
      
      let startIndex = uploadIndex + 1;
      if (urlParts[startIndex]?.startsWith('v')) {
        startIndex++;
      }
      
      const publicIdParts = urlParts.slice(startIndex);
      const lastPart = publicIdParts[publicIdParts.length - 1];
      const fileNameWithoutExt = lastPart.split('.')[0];
      publicIdParts[publicIdParts.length - 1] = fileNameWithoutExt;
      
      const publicId = publicIdParts.join('/');
      return publicId;
    } catch (error) {
      console.error(`Error extracting public_id from URL: ${imageUrl}`, error);
      const filename = imageUrl.split('/').pop()?.split('.')[0];
      if (filename) {
        return `products/${filename}`;
      }
      throw new Error(`Unable to extract public_id from URL: ${imageUrl}`);
    }
  }
}
