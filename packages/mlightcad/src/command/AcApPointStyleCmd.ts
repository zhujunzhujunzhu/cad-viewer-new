import { AcApContext, AcEdCommand } from '@mlightcad/viewer'

import { useDialogManager } from '../composable'

export class AcApPointStyleCmd extends AcEdCommand {
  execute(_context: AcApContext) {
    const { toggleDialog } = useDialogManager()
    toggleDialog('PointStyleDlg', true)
  }
}
