import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication, dtos: any[]) {
    const config = new DocumentBuilder()
        .setTitle('Attendance Management System API')
        .setDescription('Attendance Management System API Description')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config, {
        // extraModels: [BaseResponseDto, PaginationData, ...dtos],
    });

    SwaggerModule.setup('api-docs', app, document, {
        jsonDocumentUrl: '/api-docs-json',
        customJs: [
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
        ],
        customCssUrl: [
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.css',
        ],

        swaggerOptions: {
            tagsSorter: (a: string, b: string) => {
                const isAEnglish = /^[A-Za-z]/.test(a);
                const isBEnglish = /^[A-Za-z]/.test(b);

                if (isAEnglish && !isBEnglish) return -1; // 알파벳(A-Z) 먼저
                if (!isAEnglish && isBEnglish) return 1; // 한글(가-힣) 뒤로

                return a.localeCompare(b, 'en'); // 같은 언어일 경우 알파벳순 정렬
            },
            docExpansion: 'none',
            persistAuthorization: true,
        },
    });
}
