import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Startup } from './startup.entity';

@Entity('founders')
export class Founder {
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  startup_id: number;

  @ManyToOne(() => Startup, startup => startup.founders)
  @JoinColumn({ name: 'startup_id' })
  startup: Startup;
}