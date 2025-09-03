import { Entity, Column, PrimaryColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Founder } from './founder.entity';

@Entity('startups')
export class Startup {
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  legal_status: string;

  @Column('text')
  address: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ type: 'date' })
  created_at: Date;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  website_url: string;

  @Column({ nullable: true })
  social_media_url: string;

  @Column({ nullable: true })
  project_status: string;

  @Column({ nullable: true })
  needs: string;

  @Column()
  sector: string;

  @Column()
  maturity: string;

  @OneToMany(() => Founder, founder => founder.startup, { cascade: true })
  founders: Founder[];

  @CreateDateColumn()
  db_created_at: Date;

  @UpdateDateColumn()
  db_updated_at: Date;
}