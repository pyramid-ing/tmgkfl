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
  commentAction: boolean
  maxCount: number
}
