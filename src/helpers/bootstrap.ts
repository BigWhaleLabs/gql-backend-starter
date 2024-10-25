import {
  GraphQLDeferDirective,
  GraphQLStreamDirective,
} from '@graphql-tools/utils'
import { GraphQLIncludeDirective } from 'graphql'
import { GraphQLLiveDirective } from '@n1ru4l/graphql-live-query'
import { createYoga, YogaInitialContext } from 'graphql-yoga'
import { applyLiveQueryJSONDiffPatchGenerator } from '@n1ru4l/graphql-live-query-patch-jsondiffpatch'
import { buildSchema } from 'type-graphql'
import { createServer } from 'http'
import { fileURLToPath } from 'node:url'
import { relationResolvers } from '@generated/type-graphql/index.js'
import { useLiveQuery } from '@envelop/live-query'
import { verifyAuthToken } from 'src/helpers/jwt.js'
import Context from 'src/models/Context.js'
import env from 'src/helpers/env.js'
import { Express } from 'express'
import liveQueryStore from 'src/helpers/liveQueryStore.js'
import path, { dirname } from 'path'
import prismaClient from 'src/helpers/prismaClient.js'
import pubSub from 'src/helpers/pubSub.js'
import UserModelResolver from 'src/resolvers/UserModelResolver.js'
import { useGraphQlJit } from '@envelop/graphql-jit'
import { useGraphQLSSE } from '@graphql-yoga/plugin-graphql-sse'
import { useDeferStream } from '@graphql-yoga/plugin-defer-stream'
import PostsResolver from 'src/resolvers/PostsResolver.js'
import LoginResolver from 'src/resolvers/LoginResolver.js'

export default async function bootstrap(app: Express) {
  const schema = await buildSchema({
    authChecker: ({ context }: { context: Context }, roles: string[]) => {
      return roles.length === 0 && !!context.user
    },
    directives: [
      GraphQLLiveDirective,
      GraphQLIncludeDirective,
      GraphQLDeferDirective,
      GraphQLStreamDirective,
    ],
    emitSchemaFile: path.resolve(
      dirname(fileURLToPath(import.meta.url)),
      'schema.graphql'
    ),
    pubSub,
    resolvers: [
      ...relationResolvers,
      LoginResolver,
      UserModelResolver,
      PostsResolver,
      UserModelResolver,
    ],
    validate: true,
  })

  const yoga = createYoga<Express.Request>({
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
    plugins: [
      useGraphQLSSE(),
      useGraphQlJit(),
      useLiveQuery({
        applyLiveQueryPatchGenerator: applyLiveQueryJSONDiffPatchGenerator,
        liveQueryStore,
      }),
      useDeferStream(),
    ],
    schema,
  })

  const server = createServer(app)

  app.use(yoga.graphqlEndpoint, yoga.handle)

  server.listen(env.PORT, () => {
    console.log(`GraphQL server running on http://localhost:${env.PORT}`)
  })

  // Graceful shutdown function
  const gracefulShutdown = () => {
    console.log('Received kill signal, shutting down gracefully')

    server.close(() => {
      console.log('Closed out remaining connections')
      void prismaClient.$disconnect()
      console.log('Shutting down')
      process.exit(0)
    })

    setTimeout(() => {
      console.error(
        'Could not close connections in time, forcefully shutting down'
      )
      process.exit(1)
    }, 10000)
  }

  // Listen for termination signals
  process.on('SIGTERM', gracefulShutdown)
  process.on('SIGINT', gracefulShutdown)

  return { gracefulShutdown, server }
}
