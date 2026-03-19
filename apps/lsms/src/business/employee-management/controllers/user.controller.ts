import { Controller, Get, Post, Body, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiDataResponse } from '../../../../libs/decorators/api-responses.decorator';
import { User } from '../../../../libs/decorators/user.decorator';
import { UserResponseDto } from '../dtos/user-response.dto';
import { CheckPasswordDto } from '../dtos/check-password.dto';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { UpdateNotificationSettingsDto } from '../dtos/notification-settings.dto';
import { EmployeeManagementService } from '../employee-management.service';
import { Employee } from '@libs/modules/employee/employee.entity';
import { ChangeRoleDto } from '../dtos/change-role.dto';

@ApiTags('v2 유저')
@Controller('v2/users')
@ApiBearerAuth()
export class UserController {
    constructor(private readonly employeeManagementService: EmployeeManagementService) {}

    @Get('')
    @ApiOperation({ summary: '직원 목록 조회 - 자원담당자로 설정하기 위한 직원 목록' })
    @ApiDataResponse({ status: 200, description: '직원 목록 조회 성공', type: [UserResponseDto] })
    findUser() {
        return this.employeeManagementService.findManagerCandidates();
    }

    @Patch('change/role')
    @ApiOperation({ summary: '자원 담당자 설정 - 자원별 담당자 설정 또는 토글 방식' })
    @ApiDataResponse({ status: 200, description: '자원 담당자 설정 성공' })
    changeRole(@Body() changeRoleDto: ChangeRoleDto) {
        return this.employeeManagementService.changeRole(changeRoleDto);
    }

    @Get('me')
    @ApiOperation({ summary: '내 상세 정보 조회' })
    @ApiDataResponse({ status: 200, description: '내 상세 정보 조회 성공', type: UserResponseDto })
    findMe(@User() user: Employee) {
        return this.employeeManagementService.findEmployeeDetail(user.id);
    }

    @Post('check-password')
    @ApiOperation({ summary: '비밀번호 확인' })
    @ApiDataResponse({ status: 200, description: '비밀번호 확인 성공' })
    checkPassword(@User() user: Employee, @Body() checkPasswordDto: CheckPasswordDto) {
        return this.employeeManagementService.checkPassword(user.id, checkPasswordDto.password);
    }

    @Post('change-password')
    @ApiOperation({ summary: '비밀번호 변경' })
    @ApiDataResponse({ status: 200, description: '비밀번호 변경 성공' })
    changePassword(@User() user: Employee, @Body() changePasswordDto: ChangePasswordDto) {
        return this.employeeManagementService.changePassword(user.id, changePasswordDto.newPassword);
    }

    @Patch('me/notification-settings')
    @ApiOperation({ summary: '알림 설정' })
    @ApiDataResponse({
        status: 200,
        description: '알림 설정 성공',
        type: UserResponseDto,
    })
    async changeNotificationSettings(
        @User() user: Employee,
        @Body() updateDto: UpdateNotificationSettingsDto,
    ): Promise<UserResponseDto> {
        return this.employeeManagementService.changeNotificationSettings(user.id, updateDto);
    }
}
