import yargs from 'yargs'
import { sdk, ux } from '@cto.ai/sdk'
import { asyncPipe } from './utils/asyncPipe'
import { pressEnterToPrompt } from './prompts/user_prompts'
import { awsPromptLoop } from './prompts/aws_help'
import { awsSetup } from './utils/awsCreds'
import { execPowerMode } from './utils/powerUser'
import { argv } from './types/argvs'
import { track, startTimer, getTotalTime } from './utils/track'

const logo = `█▀▀ ▀▀█▀▀ █▀▀█   █▀▀█ ░▀░   █▀▀█ █░░░█ █▀▀   █▀▀█ █▀▀█
█░░ ░░█░░ █░░█   █▄▄█ ▀█▀   █▄▄█ █▄█▄█ ▀▀█   █░░█ █░░█
▀▀▀ ░░▀░░ ▀▀▀▀   ▀░░▀ ▀▀▀   ▀░░▀ ░▀░▀░ ▀▀▀   ▀▀▀▀ █▀▀▀`

const showPrerunMessage = async () => {
  const greetingLines = [
    `\n🚀  ${ux.colors.bgRed('CTO.ai AWS OP')} 🚀\n`,
    `\nHi there! Welcome back and thanks for using the tool, if have any questions be sure to reach out to the CTO.ai team, we're always happy to help!`,
    `⚠️  This Op requires some setup. Here's what you'll need:`,
    `\n✅ AWS Access Key ID`,
    `✅ AWS Secret Access Key`,
    `✅ ssh public and private key pair saved in ~/creds/ directory`,
    `\nFor more info please view the README.`,
  ]

  sdk.log(logo)
  sdk.log(greetingLines.join(`\n`))
  await ux.prompt(pressEnterToPrompt('continue'))
}

const parseArguments = () => {
  const args: argv = yargs.argv
  if (args._.length === 0 && args.s) {
    sdk.log(`🛑 You must provide a service argument if using -s/--s flag
    example:
    ops run aws [service] -s`)
  }
  return args
}

const checkPowerMode = async () => {
  const args = yargs.argv
  if (args.p || args.powermode) {
    const metadata = {
      isDone: true,
    }
    track(metadata)
    const argv = process.argv.slice(2).filter(e => {
      return !(e === '-p' || e === '--powermode')
    })

    await execPowerMode(argv)
  }
}

const startPrompt = (args: argv) => {
  // checks to see if service flag is set. Passes argument as service if it is set, if not passes as command
  const service = args._ ? args._.join(' ') : ''
  return args.s
    ? awsPromptLoop(service, '', [])
    : awsPromptLoop('', service, [])
}

const main = async () => {
  const startTime = startTimer()
  const createPipeline = await asyncPipe(
    awsSetup,
    checkPowerMode,
    showPrerunMessage,
    parseArguments,
    startPrompt
  )
  try {
    await createPipeline({})
  } catch (err) {
    const totalTime = getTotalTime()
    const metadata = {
      totalTime: `${totalTime} seconds`,
      error: err,
      isDone: false,
    }
    track(metadata)
    console.error(err)
  }
}

main()
