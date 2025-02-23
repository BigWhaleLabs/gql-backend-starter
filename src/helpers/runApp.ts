import { relationResolvers } from '@generated/type-graphql/index.js'
import {
  GraphQLDeferDirective,
  GraphQLStreamDirective,
} from '@graphql-tools/utils'
import { GraphQLIncludeDirective } from 'graphql'
import { createYoga, type YogaInitialContext } from 'graphql-yoga'
import { verifyAuthToken } from 'helpers/jwt.js'
import prismaClient from 'helpers/prismaClient.js'
import type Context from 'models/Context.js'
import { cwd } from 'node:process'
import path from 'path'
import LoginResolver from 'resolvers/LoginResolver.js'
import PostsResolver from 'resolvers/PostsResolver.js'
import UserModelResolver from 'resolvers/UserModelResolver.js'
import { buildSchema } from 'type-graphql'

export default async function runApp() {
  const schema = await buildSchema({
    authChecker: ({ context }: { context: Context }, roles: string[]) => {
      return roles.length === 0 && !!context.user
    },
    directives: [
      GraphQLIncludeDirective,
      GraphQLDeferDirective,
      GraphQLStreamDirective,
    ],
    emitSchemaFile: path.resolve(cwd(), 'schema.graphql'),
    resolvers: [
      ...relationResolvers,
      LoginResolver,
      UserModelResolver,
      PostsResolver,
      UserModelResolver,
    ],
    validate: true,
  })

  const yoga = createYoga({
    batching: true,
    context: async ({
      connectionParams,
      request,
    }: YogaInitialContext & {
      connectionParams: {
        authorization?: string
      }
    }) => {
      const token: string | undefined =
        request?.headers.get('authorization') || connectionParams?.authorization

      if (!token) return { prisma: prismaClient }

      try {
        verifyAuthToken(token)
      } catch {
        return { prisma: prismaClient }
      }

      const user = await prismaClient.user.findFirst({
        where: {
          OR: [
            {
              authTokens: {
                some: {
                  token,
                },
              },
            },
          ],
        },
      })

      return { prisma: prismaClient, user }
    },
    graphqlEndpoint: '/',
    landingPage: false,
    schema,
  })

  const server = Bun.serve({
    fetch: yoga,
  })

  console.info(
    `Server is running on ${new URL(
      yoga.graphqlEndpoint,
      `http://${server.hostname}:${server.port}`,
    )}`,
  )
}
