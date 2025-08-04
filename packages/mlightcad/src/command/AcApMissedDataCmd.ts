import { AcApContext, AcEdCommand } from '@mlightcad/viewer'

import { useDialogManager } from '../composable'

export class AcApMissedDataCmd extends AcEdCommand {
  execute(_context: AcApContext) {
    const { toggleDialog } = useDialogManager()
    toggleDialog('ReplacementDlg', true)
  }
}
