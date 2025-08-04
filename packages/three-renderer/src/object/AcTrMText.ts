import { AcGiMTextData, AcGiTextStyle } from '@mlightcad/data-model'
import { FontManager, MText } from '@mlightcad/mtext-renderer'
import * as THREE from 'three'

import { AcTrStyleManager } from '../style/AcTrStyleManager'
import { AcTrEntity } from './AcTrEntity'

export class AcTrMText extends AcTrEntity {
  private _mtext: MText

  constructor(
    text: AcGiMTextData,
    style: AcGiTextStyle,
    styleManager: AcTrStyleManager
  ) {
    super(styleManager)
    // @ts-expect-error AcGiTextData and MTextData are compatible
    this._mtext = new MText(text, style, styleManager, FontManager.instance, {
      byLayerColor: style.byLayerColor,
      byBlockColor: style.byBlockColor
    })
    this.add(this._mtext)
    this.flatten()
    this.traverse(object => {
      // Add the flag to check intersection using bounding box of the mesh
      object.userData.bboxIntersectionCheck = true
    })
  }

  /**
   * Get intersections between a casted ray and this object. Override this method
   * to calculate intersection using the bounding box of texts.
   */
  raycast(raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) {
    this._mtext.raycast(raycaster, intersects)
  }

  protected getTextEncoding(style: AcGiTextStyle) {
    const bigFontFile = style?.bigFont
    if (!bigFontFile) {
      return 'utf8'
    }
    if (style.bigFont.toUpperCase().startsWith('GB')) {
      return 'gbk'
    } else {
      //TODO:
      return 'utf8'
    }
  }
}
