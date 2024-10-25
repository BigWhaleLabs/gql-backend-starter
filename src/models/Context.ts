import { IncomingMessage } from 'http'
import { PrismaClient, User } from '@prisma/client'

export default interface Context {
  user: User | null
  req: IncomingMessage
  prisma: PrismaClient
}

export interface AuthorizedContext extends Context {
  user: User
}
