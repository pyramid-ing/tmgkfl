import { Transform, Type } from 'class-transformer'
import { IsArray, IsDate, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator'

export class PostJobDto {
  @IsString()
  @IsOptional()
  subject?: string

  @IsString()
  @IsNotEmpty()
  desc: string

  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  scheduledAt: Date
}

export class PostJobsCreateReqDto {
  @IsString()
  @IsNotEmpty()
  loginId: string

  @IsString()
  @IsNotEmpty()
  loginPw: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostJobDto)
  posts: PostJobDto[]
}
