import { FieldResolver, Resolver, Root } from 'type-graphql'
import { User } from '@generated/type-graphql/models/User.js'

@Resolver(() => User)
export default class UserModelResolver {
  @FieldResolver(() => Boolean)
  isNewUser(@Root() user: User) {
    return user.createdAt === user.updatedAt
  }
}
