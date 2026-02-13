import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('files')
export class File {
    @PrimaryGeneratedColumn('uuid')
    fileId: string;

    @Column()
    fileName: string;

    @Column({ unique: true })
    filePath: string;

    @Column({ default: true })
    isTemporary: boolean;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date;
}
