import { Module } from '@nestjs/common';
import { OrganizationSeedController } from './organization-seed.controller';
import { OrganizationSeedService } from './organization-seed.service';

@Module({
    controllers: [OrganizationSeedController],
    providers: [OrganizationSeedService],
})
export class OrganizationSeedModule {}
