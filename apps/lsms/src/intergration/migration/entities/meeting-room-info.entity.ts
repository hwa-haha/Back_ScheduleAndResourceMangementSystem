import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Resource } from './resource.entity';

@Entity('meeting_room_infos')
export class MeetingRoomInfo {
  @PrimaryColumn('uuid', {
    generated: 'uuid',
  })
  meetingRoomInfoId: string;

  @Column()
  resourceId: string;

  @OneToOne(() => Resource, resource => resource.meetingRoomInfo)
  @JoinColumn({ name: 'resourceId' })
  resource: Resource;
} 