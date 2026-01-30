import {
    Controller,
    Post,
    Get,
    Body,
    Query,
    UploadedFile,
    UseInterceptors,
    ParseUUIDPipe,
    BadRequestException,
    Delete,
    Param,
    Res,
    NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth, ApiQuery, ApiResponse, ApiParam } from '@nestjs/swagger';
import { User } from '../../../libs/decorators/user.decorator';
import { FileManagementBusinessService } from '../../business/file-management-business/file-management-business.service';
import { UploadFileRequestDto, UploadFileResponseDto } from './dto/upload-file.dto';
import { ReflectFileContentRequestDto, ReflectFileContentResponseDto } from './dto/reflect-file-content.dto';
import { RestoreFromHistoryRequestDto, RestoreFromHistoryResponseDto } from './dto/restore-from-history.dto';
import {
    GetFileListWithHistoryRequestDto,
    GetFileListWithHistoryResponseDto,
} from './dto/get-file-list-with-history.dto';
import { IGetFileListWithHistoryResponse } from '../../context/file-management-context/interfaces/response/get-file-list-with-history-response.interface';
import {
    GetFileListRequestDto,
    GetFileListResponseDto,
} from './dto/get-file-list.dto';
import { IGetFileListResponse } from '../../context/file-management-context/interfaces/response/get-file-list-response.interface';
import {
    GetReflectionHistoryRequestDto,
    GetReflectionHistoryResponseDto,
} from './dto/get-reflection-history.dto';
import { IGetReflectionHistoryResponse } from '../../context/file-management-context/interfaces/response/get-reflection-history-response.interface';
import { GetFileOrgDataResponseDto } from './dto/get-file-org-data.dto';
import { IGetFileOrgDataResponse } from '../../context/file-management-context/interfaces/response/get-file-org-data-response.interface';

/**
 * 파일 관리 컨트롤러
 *
 * 파일 업로드 및 파일 내용 반영 API를 제공합니다.
 */
@ApiTags('1. 파일 관리')
@ApiBearerAuth()
@Controller('file-management')
export class FileManagementController {
    constructor(private readonly fileManagementBusinessService: FileManagementBusinessService) {}

    /**
     * 파일 업로드
     *
     * 엑셀 파일을 업로드하고 검증합니다.
     */
    @Post('upload')
    @ApiOperation({ summary: '파일 업로드', description: '엑셀 파일을 업로드하고 검증합니다.' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: '업로드할 엑셀 파일 (.xlsx, .xls, .csv)',
                },
                year: {
                    type: 'string',
                    description: '연도 (선택사항)',
                    example: '2026',
                },
                month: {
                    type: 'string',
                    description: '월 (선택사항)',
                    example: '01',
                },
            },
            required: ['file'],
        },
    })
    @UseInterceptors(
        FileInterceptor('file', {
            fileFilter: (req, file, callback) => {
                // 한글 파일명 디코딩 처리
                // 브라우저에서 전송된 파일명이 ISO-8859-1 (latin1)로 인코딩되어 있는 경우 UTF-8로 변환
                try {
                    const decodedFilename = Buffer.from(file.originalname, 'latin1').toString('utf8');
                    file.originalname = decodedFilename;
                } catch (error) {
                    // 디코딩 실패 시 원본 파일명 유지
                }
                callback(null, true);
            },
        }),
    )
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadFileRequestDto,
        @User('id') uploadBy: string,
    ): Promise<UploadFileResponseDto> {
        if (!file) {
            throw new BadRequestException('파일이 제공되지 않았습니다.');
        }

        if (!uploadBy) {
            throw new BadRequestException('사용자 정보를 찾을 수 없습니다.');
        }

        const result = await this.fileManagementBusinessService.파일을업로드한다(file, uploadBy, dto.year, dto.month);

        return {
            fileId: result.fileId,
            fileName: result.fileName,
            filePath: result.filePath,
            year: result.year,
            month: result.month,
        };
    }

    /**
     * 파일 내용 반영
     *
     * 업로드된 파일의 내용을 반영하고 일일/월간 요약을 생성합니다.
     */
    @Post('reflect')
    @ApiOperation({
        summary: '파일 내용 반영',
        description: '업로드된 파일의 내용을 반영하고 일일/월간 요약을 자동으로 생성합니다.',
    })
    async reflectFileContent(
        @Body() dto: ReflectFileContentRequestDto,
        @User('id') performedBy: string,
    ): Promise<ReflectFileContentResponseDto> {
        if (!performedBy) {
            throw new BadRequestException('사용자 정보를 찾을 수 없습니다.');
        }

        const result = await this.fileManagementBusinessService.파일내용을반영한다(
            dto.fileId,
            dto.employeeNumbers,
            dto.year,
            dto.month,
            performedBy,
            dto.info,
        );

        return {
            fileId: result.fileId,
            reflectionHistoryId: result.reflectionHistoryId,
        };
    }

    /**
     * 이력으로 되돌리기
     *
     * 파일 내용 반영 이력을 선택하여 해당 이력의 데이터로 되돌립니다.
     */
    @Post('restore-from-history')
    @ApiOperation({
        summary: '이력으로 되돌리기',
        description:
            '파일 내용 반영 이력을 선택하여 해당 이력의 데이터로 되돌립니다. 이력에 저장된 데이터를 그대로 사용하여 해당 연월의 데이터를 복원합니다.',
    })
    async restoreFromHistory(
        @Body() dto: RestoreFromHistoryRequestDto,
        @User('id') performedBy: string,
    ): Promise<RestoreFromHistoryResponseDto> {
        if (!performedBy) {
            throw new BadRequestException('사용자 정보를 찾을 수 없습니다.');
        }

        if (!dto.reflectionHistoryId) {
            throw new BadRequestException('반영 이력 ID는 필수입니다.');
        }

        const result = await this.fileManagementBusinessService.파일내용반영이력으로되돌리기(
            dto.reflectionHistoryId,
            dto.year,
            dto.month,
            performedBy,
        );

        return {
            reflectionHistoryId: result.reflectionHistoryId,
            restoreSnapshotResult: {
                year: result.restoreSnapshotResult.year,
                month: result.restoreSnapshotResult.month,
            },
        };
    }

    /**
     * 파일 목록 조회
     *
     * 파일 목록만 조회합니다. 반영이력은 포함되지 않습니다.
     * 연도와 월을 필수로 제공해야 합니다.
     */
    @Get('files/list')
    @ApiOperation({
        summary: '파일 목록 조회',
        description: '파일 목록만 조회합니다. 반영이력은 포함되지 않습니다. 연도와 월을 필수로 제공해야 합니다.',
    })
    @ApiQuery({ name: 'year', description: '연도', example: '2026', required: true })
    @ApiQuery({ name: 'month', description: '월', example: '01', required: true })
    @ApiResponse({
        status: 200,
        description: '파일 목록 조회 성공',
        type: GetFileListResponseDto,
    })
    async getFileList(@Query() dto: GetFileListRequestDto): Promise<IGetFileListResponse> {
        if (!dto.year || !dto.month) {
            throw new BadRequestException('연도와 월은 필수입니다.');
        }

        const result = await this.fileManagementBusinessService.파일목록을조회한다({
            year: dto.year,
            month: dto.month,
        });

        return result;
    }

    /**
     * 반영이력 조회
     *
     * 특정 파일의 반영이력만 조회합니다.
     * 파일 ID를 필수로 제공해야 합니다.
     */
    @Get('files/:fileId/reflection-history')
    @ApiOperation({
        summary: '반영이력 조회',
        description: '특정 파일의 반영이력만 조회합니다. 파일 ID를 필수로 제공해야 합니다.',
    })
    @ApiParam({ name: 'fileId', description: '파일 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({
        status: 200,
        description: '반영이력 조회 성공',
        type: GetReflectionHistoryResponseDto,
    })
    async getReflectionHistory(
        @Param('fileId', ParseUUIDPipe) fileId: string,
    ): Promise<IGetReflectionHistoryResponse> {
        const result = await this.fileManagementBusinessService.반영이력을조회한다({
            fileId,
        });

        return result;
    }

    /**
     * 파일 orgData 조회
     *
     * 특정 파일의 orgData(조직/부서 정보)만 조회합니다.
     * 파일 ID를 필수로 제공해야 합니다.
     */
    @Get('files/:fileId/org-data')
    @ApiOperation({
        summary: '파일 orgData 조회',
        description: '특정 파일의 orgData(조직/부서 정보)만 조회합니다. 파일 ID를 필수로 제공해야 합니다.',
    })
    @ApiParam({ name: 'fileId', description: '파일 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({
        status: 200,
        description: '파일 orgData 조회 성공',
        type: GetFileOrgDataResponseDto,
    })
    async getFileOrgData(@Param('fileId', ParseUUIDPipe) fileId: string): Promise<IGetFileOrgDataResponse> {
        const result = await this.fileManagementBusinessService.파일orgData를조회한다({
            fileId,
        });

        return result;
    }

    /**
     * 파일 다운로드
     *
     * 파일 ID로 파일을 다운로드합니다.
     */
    @Get('files/:id/download')
    @ApiOperation({
        summary: '파일 다운로드',
        description: '파일 ID로 파일을 다운로드합니다.',
    })
    @ApiParam({ name: 'id', description: '파일 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({
        status: 200,
        description: '파일 다운로드 성공',
    })
    async downloadFile(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
        try {
            const result = await this.fileManagementBusinessService.파일을다운로드한다(id);

            // 파일명 인코딩 처리 (한글 파일명 지원)
            const encodedFileName = encodeURIComponent(result.fileName);

            // 응답 헤더 설정
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`);
            res.setHeader('Content-Length', result.buffer.length);

            // 파일 전송
            res.send(result.buffer);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`파일 다운로드 중 오류가 발생했습니다: ${error.message}`);
        }
    }

    /**
     * 파일 삭제
     *
     * 파일 ID로 파일을 삭제합니다. (Soft Delete)
     */
    @Delete('files/:id')
    @ApiOperation({
        summary: '파일 삭제',
        description: '파일 ID로 파일을 삭제합니다. (Soft Delete)',
    })
    @ApiParam({ name: 'id', description: '파일 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({
        status: 200,
        description: '파일 삭제 성공',
    })
    async deleteFile(@Param('id', ParseUUIDPipe) id: string, @User('id') userId: string) {
        if (!userId) {
            throw new BadRequestException('사용자 정보를 찾을 수 없습니다.');
        }

        try {
            await this.fileManagementBusinessService.파일을삭제한다(id, userId);
            return { message: '파일이 성공적으로 삭제되었습니다.', fileId: id };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`파일 삭제 중 오류가 발생했습니다: ${error.message}`);
        }
    }
}
