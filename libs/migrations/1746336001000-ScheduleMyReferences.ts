import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class ScheduleMyReferences1746336001000 implements MigrationInterface {
    name = 'ScheduleMyReferences1746336001000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'schedule_my_references',
                columns: [
                    {
                        name: 'scheduleMyReferenceId',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'gen_random_uuid()',
                    },
                    {
                        name: 'employeeId',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'scheduleId',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp with time zone',
                        default: 'now()',
                    },
                ],
                uniques: [
                    new TableUnique({
                        name: 'UQ_schedule_my_references_employee_schedule',
                        columnNames: ['employeeId', 'scheduleId'],
                    }),
                ],
                foreignKeys: [
                    new TableForeignKey({
                        columnNames: ['scheduleId'],
                        referencedTableName: 'schedules',
                        referencedColumnNames: ['scheduleId'],
                        onDelete: 'CASCADE',
                    }),
                    new TableForeignKey({
                        columnNames: ['employeeId'],
                        referencedTableName: 'employees',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    }),
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('schedule_my_references', true, true, true);
    }
}
