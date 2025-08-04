import 'uno.css'
import 'element-plus/dist/index.css'
import '../style/style.css'
import '../style/index.scss'

import {
  AcDbDatabaseConverterManager,
  AcDbFileType
} from '@mlightcad/data-model'
import { AcDbLibreDwgConverter } from '@mlightcad/libredwg-converter'
import { AcApDocManager, AcEdCommandStack } from '@mlightcad/viewer'
import { createApp, markRaw } from 'vue'

import {
  AcApLayerStateCmd,
  AcApLogCmd,
  AcApMissedDataCmd,
  AcApPointStyleCmd
} from '../command'
import { MlApp, MlPointStyleDlg, MlReplacementDlg } from '../component'
import { useDialogManager } from '../composable'
import { i18n } from '../locale'

const { registerDialog } = useDialogManager()

const registerCmds = () => {
  AcEdCommandStack.instance.addCommand(
    AcEdCommandStack.SYSTEMT_COMMAND_GROUP_NAME,
    'log',
    'log',
    new AcApLogCmd()
  )
  AcEdCommandStack.instance.addCommand(
    AcEdCommandStack.SYSTEMT_COMMAND_GROUP_NAME,
    'la',
    'la',
    new AcApLayerStateCmd()
  )
  AcEdCommandStack.instance.addCommand(
    AcEdCommandStack.SYSTEMT_COMMAND_GROUP_NAME,
    'md',
    'md',
    new AcApMissedDataCmd()
  )
  AcEdCommandStack.instance.addCommand(
    AcEdCommandStack.SYSTEMT_COMMAND_GROUP_NAME,
    'pttype',
    'pttype',
    new AcApPointStyleCmd()
  )
}

const registerDialogs = () => {
  registerDialog({
    name: 'ReplacementDlg',
    component: markRaw(MlReplacementDlg),
    props: {}
  })
  registerDialog({
    name: 'PointStyleDlg',
    component: markRaw(MlPointStyleDlg),
    props: {}
  })
}

const registerConverters = async () => {
  try {
    const isDev = import.meta.env.DEV
    if (!isDev) {
      // Production mode - use dynamic import with explicit chunk name
      const instance = await import(
        /* webpackChunkName: "libredwg-web" */ '@mlightcad/libredwg-web'
      )
      const converter = new AcDbLibreDwgConverter(await instance.createModule())
      AcDbDatabaseConverterManager.instance.register(
        AcDbFileType.DWG,
        converter
      )
    }
  } catch (error) {
    console.error('Failed to load libredwg-web: ', error)
  }
}

// This is for development mode only. In production mode, the library is bundled
window.addEventListener('libredwg-ready', event => {
  // @ts-expect-error this is one custom event and you can get details in index.html
  const instance = event.detail as LibreDwgEx
  const converter = new AcDbLibreDwgConverter(instance)
  AcDbDatabaseConverterManager.instance.register(AcDbFileType.DWG, converter)
})

export const main = () => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  AcApDocManager.createInstance(canvas)
  registerCmds()

  const app = createApp(MlApp)
  app.use(i18n)
  app.mount('#app')
  registerDialogs()

  // Hide the loading spinner
  const loader = document.getElementById('loader')
  if (loader) {
    loader.style.display = 'none'
  }

  // Register converters after the app is mounted with a small delay
  // so that the app can be loaded faster
  setTimeout(() => {
    registerConverters().catch(error => {
      console.error('Failed to register converters:', error)
    })
  }, 100)
}
