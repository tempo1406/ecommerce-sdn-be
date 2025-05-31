import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { DatabaseService } from 'src/database/database.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  
  async create(createProductDto: Prisma.ProductCreateInput, file?: Express.Multer.File) {
    try {
      if (!createProductDto.name || !createProductDto.description || !createProductDto.price) {
        throw new Error('Missing required fields: name, description, or price');
      }

      if (typeof createProductDto.price === 'string') {
        createProductDto.price = parseFloat(createProductDto.price);
      }

      if (file) {
        const uploadResult = await this.cloudinaryService.uploadImage(file);
        createProductDto.image = uploadResult.secure_url;
      }

      const product = await this.databaseService.product.create({
        data: createProductDto,
      });

      return product;
    } catch (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  async findAll() {
    return this.databaseService.product.findMany();
  }

  async findOne(id: number) {
    return this.databaseService.product.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateProductDto: Prisma.ProductUpdateInput, file?: Express.Multer.File) {
    const existingProduct = await this.databaseService.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (file) {
      try {
        const oldImageUrl = existingProduct.image;
        
        const uploadResult = await this.cloudinaryService.uploadImage(file);
        updateProductDto.image = uploadResult.secure_url;
        
        if (oldImageUrl && this.cloudinaryService.isCloudinaryUrl(oldImageUrl)) {
          try {
            const publicId = this.cloudinaryService.getPublicIdFromUrl(oldImageUrl);
            await this.cloudinaryService.deleteImage(publicId);
          } catch (deleteError) {
            console.error('Failed to delete old image:', deleteError);
          }
        }
      } catch (uploadError) {
        throw new Error(`Failed to upload new image: ${uploadError.message}`);
      }
    }

    return this.databaseService.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: number) {
    const product = await this.databaseService.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (product.image && this.cloudinaryService.isCloudinaryUrl(product.image)) {
      try {
        const publicId = this.cloudinaryService.getPublicIdFromUrl(product.image);
        await this.cloudinaryService.deleteImage(publicId);
      } catch (error) {
        console.error(`Error deleting image from Cloudinary:`, error);
      }
    }

    const deletedProduct = await this.databaseService.product.delete({
      where: { id },
    });
    
    return deletedProduct;
  }
}
