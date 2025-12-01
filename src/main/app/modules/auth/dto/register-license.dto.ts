import { IsNotEmpty, IsString } from 'class-validator'

export class RegisterLicenseDto {
  @IsString()
  @IsNotEmpty()
  license_key: string

  @IsString()
  @IsNotEmpty()
  node_machine_id: string
}
