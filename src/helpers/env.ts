import 'dotenv/config'
import { cleanEnv, num, str } from 'envalid'
import { configDotenv } from 'dotenv'

configDotenv({
  override: true,
})

export default cleanEnv(process.env, {
  JWT_SECRET: str(),
  PORT: num({ default: 1337 }),
  POSTGRES: str(),
  PRIVY_APP_ID: str(),
  PRIVY_APP_SECRET: str(),
})
