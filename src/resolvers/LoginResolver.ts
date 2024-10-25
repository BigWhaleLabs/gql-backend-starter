import { Args, ArgsType, Ctx, Field, Mutation, Resolver } from 'type-graphql'
import { GraphQLError } from 'graphql'
import { getAuthToken } from 'src/helpers/jwt.js'
import Context from 'src/models/Context.js'
import privy from 'src/helpers/privy.js'

@ArgsType()
class LoginParams {
  @Field()
  token!: string
}
@Resolver()
export default class LoginResolver {
  @Mutation(() => String)
  async loginWithPrivy(
    @Args()
    { token }: LoginParams,
    @Ctx() { prisma, req }: Context
  ) {
    // Get user
    const { wallet } = await privy.getUser({
      idToken: token,
    })
    // Check if there is an embedded user wallet
    if (!wallet) throw new GraphQLError('No wallet data provided')
    // See if it's a login
    const user = await prisma.user.findFirst({
      where: {
        ethAddress: wallet.address,
      },
    })
    if (user) {
      const authToken = await prisma.authToken.create({
        data: {
          token: getAuthToken(user),
          userAgent: req.headers['user-agent'] || 'Unknown',
          userId: user.id,
        },
      })
      return authToken.token
    }
    // Signup the user
    const newUser = await prisma.user.create({
      data: {
        ethAddress: wallet.address,
      },
    })

    const authToken = await prisma.authToken.create({
      data: {
        token: getAuthToken(newUser),
        userAgent: req.headers['user-agent'] || 'Unknown',
        userId: newUser.id,
      },
    })
    return authToken.token
  }
}
