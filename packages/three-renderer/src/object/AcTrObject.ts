import { AcTrStyleManager } from '../style/AcTrStyleManager'
import { AcTrBaseObject } from './AcTrBaseObject'

/**
 * Base class for all drawable object
 */
export class AcTrObject extends AcTrBaseObject {
  private _styleManager: AcTrStyleManager

  constructor(styleManager: AcTrStyleManager) {
    super()
    this._styleManager = styleManager
  }

  get styleManager() {
    return this._styleManager
  }

  /**
   * @inheritdoc
   */
  copy(object: AcTrObject, recursive?: boolean) {
    this._styleManager = object._styleManager
    return super.copy(object, recursive)
  }
}
