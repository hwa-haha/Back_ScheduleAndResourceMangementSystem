import { ApiProperty } from '@nestjs/swagger';

export class FcmSubscribeResponseDto {
    @ApiProperty({
        description: '甑弲 ?标车 ??',
        example: true,
    })
    success: boolean;

    @ApiProperty({
        description: '?戨嫷 氅旍嫓歆�',
        example: 'FCM ?犿伆???标车?侅溂搿??彪?橃棃?惦媹??',
    })
    message: string;

    @ApiProperty({
        description: '甑弲 ID (?犿儩??',
        required: false,
        example: 'sub_12345',
    })
    subscriptionId?: string;
}
