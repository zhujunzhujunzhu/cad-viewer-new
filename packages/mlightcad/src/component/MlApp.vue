<script setup lang="ts">
import { AcDbOpenDatabaseOptions } from '@mlightcad/data-model'
import { AcApDocManager, eventBus } from '@mlightcad/viewer'
import { ElMessage } from 'element-plus'
import en from 'element-plus/es/locale/lang/en'
import zh from 'element-plus/es/locale/lang/zh-cn'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { store } from '../app'
import { MlDialogManager, MlFileReader } from './common'
import { MlLayerManager } from './layerManager'
import {
  MlCommandLine,
  MlEntityInfo,
  MlLanguageSelector,
  MlMainMenu,
  MlToolBars
} from './layout'
import { MlStatusBar } from './statusBar'

const { locale, t } = useI18n()
const elLocale = computed(() => {
  return locale.value === 'en' ? en : zh
})

const handleFileRead = async (
  fileName: string,
  fileContent: string | ArrayBuffer
) => {
  const options: AcDbOpenDatabaseOptions = { minimumChunkSize: 1000 }
  await AcApDocManager.instance.openDocument(fileName, fileContent, options)
  store.fileName = fileName
}

eventBus.on('message', params => {
  ElMessage({
    message: params.message,
    grouping: true,
    type: params.type,
    showClose: true
  })
})

eventBus.on('font-not-loaded', params => {
  ElMessage({
    message: t('main.message.fontNotLoaded', {
      fontName: params.fontName,
      url: params.url
    }),
    grouping: true,
    type: 'error',
    showClose: true
  })
})

eventBus.on('failed-to-get-avaiable-fonts', params => {
  ElMessage({
    message: t('main.message.failedToGetAvaiableFonts', { url: params.url }),
    grouping: true,
    type: 'error',
    showClose: true
  })
})

eventBus.on('failed-to-open-file', params => {
  ElMessage({
    message: t('main.message.failedToOpenFile', { fileName: params.fileName }),
    grouping: true,
    type: 'error',
    showClose: true
  })
})
</script>

<template>
  <div>
    <el-config-provider :locale="elLocale">
      <header>
        <ml-main-menu />
        <ml-language-selector />
      </header>
      <main>
        <div class="ml-file-name">{{ store.fileName }}</div>
        <ml-tool-bars />
        <ml-layer-manager :editor="AcApDocManager.instance" />
        <ml-dialog-manager />
      </main>
      <footer>
        <ml-command-line />
        <ml-status-bar />
      </footer>

      <ml-file-reader @file-read="handleFileRead" />
      <ml-entity-info />
    </el-config-provider>
  </div>
</template>

<style>
.ml-file-name {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  width: 100%;
  margin-top: 20px;
}
</style>
