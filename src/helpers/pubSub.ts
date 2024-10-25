import { Post } from '@generated/type-graphql/models/Post.js'
import { createPubSub } from 'graphql-yoga'

export default createPubSub<{
  'post:newPost': [userId: string, payload: Post]
}>()
