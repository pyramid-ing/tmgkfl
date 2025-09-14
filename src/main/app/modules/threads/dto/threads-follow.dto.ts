import { Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator'

/**
 * ⚠️ WARNING: 댓글 단독 처리 방지 유효성 검사
 *
 * 댓글은 확인 방법이 없어서 단독으로 처리할 수 없습니다.
 * 리포스트, 좋아요, 팔로우 중 최소 1개와 함께 사용해야 합니다.
 *
 * 이유:
 * - 댓글은 DOM에서 이미 처리되었는지 확인할 수 있는 방법이 없음
 * - 다른 액션들(follow, like, repost)은 DOM 상태로 처리 여부를 확인 가능
 * - 댓글만 단독으로 사용하면 이미 처리된 게시물에 중복 댓글을 달 수 있음
 */
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
