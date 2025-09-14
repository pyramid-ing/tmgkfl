import { Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator'

@ValidatorConstraint({ name: 'commentRequiresOtherActions', async: false })
export class CommentRequiresOtherActionsConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as ThreadsFollowDto
    // 댓글이 활성화된 경우, 팔로우, 좋아요, 리포스트 중 최소 1개가 활성화되어야 함
    if (object.commentAction) {
      return object.followAction || object.likeAction || object.repostAction
    }
    return true
  }

  defaultMessage(args: ValidationArguments) {
    return '댓글은 팔로우, 좋아요, 리포스트 중 최소 1개와 함께 사용해야 합니다.'
  }
}

export class ThreadsFollowDto {
  id: string
  pw: string
  keyword: string
  minDelay: number
  maxDelay: number
  followMessages: string[]
  followAction: boolean
  likeAction: boolean
  repostAction: boolean

  @Validate(CommentRequiresOtherActionsConstraint)
  commentAction: boolean

  maxCount: number
}
