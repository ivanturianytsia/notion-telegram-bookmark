import { config } from 'dotenv'
import { launchBot } from './bot'
import { launchServer } from './server'

config()

launchBot()

launchServer()
