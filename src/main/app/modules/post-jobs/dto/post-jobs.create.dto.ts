import { Transform, Type } from 'class-transformer'
import { IsArray, IsDate, IsNotEmpty, IsOptional, IsString, Matches, ValidateNested } from 'class-validator'

export class PostJobDto {
  @IsString()
  @IsOptional()
  subject?: string

  @IsString()
  @IsNotEmpty({ message: '글 내용은 필수입니다.' })
  @Matches(/^\s*[\S\s]*\S\s*$/, { message: '글 내용은 공백이 아닌 문자를 포함해야 합니다.' })
  desc: string

  @IsNotEmpty({ message: '예약 일시는 필수입니다.' })
  @Transform(({ value }) => new Date(value))
  @IsDate({ message: '유효한 날짜 형식이어야 합니다.' })
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
