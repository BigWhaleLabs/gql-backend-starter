import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { AuthorizedContext } from 'src/models/Context.js'
import { prismaClient } from 'src/helpers/prismaClient.js'
import { Post } from '@generated/type-graphql/models/Post.js'

@Resolver()
export default class PostsResolver {
  @Authorized()
  @Mutation(() => String)
  async createPost(
    @Arg('title') title: string,
    @Ctx() { user }: AuthorizedContext
  ) {
    const post = await prismaClient.post.create({
      data: {
        authorId: user.id,
        content: '',
        title,
      },
    })

    return post.id
  }

  @Query(() => Post)
  async getPost(@Arg('id') id: string) {
    return prismaClient.post.findUnique({
      where: {
        id,
      },
    })
  }
}
