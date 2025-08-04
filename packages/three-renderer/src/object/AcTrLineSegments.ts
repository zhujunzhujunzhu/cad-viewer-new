import { AcGiLineStyle } from '@mlightcad/data-model'
import * as THREE from 'three'

import { AcTrStyleManager } from '../style/AcTrStyleManager'
import { AcTrBufferGeometryUtil } from '../util/AcTrBufferGeometryUtil'
import { AcTrEntity } from './AcTrEntity'

export class AcTrLineSegments extends AcTrEntity {
  constructor(
    array: Float32Array,
    itemSize: number,
    indices: Uint16Array,
    style: AcGiLineStyle | undefined,
    styleManager: AcTrStyleManager
  ) {
    super(styleManager)

    let material: THREE.Material
    if (style) {
      material = this.styleManager.getLineShaderMaterial(style, 1)
    } else {
      material = new THREE.LineBasicMaterial({ color: 0xffffff })
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(array, itemSize)
    )
    geometry.setIndex(new THREE.BufferAttribute(indices, 1))
    geometry.computeBoundingBox()
    this.box = geometry.boundingBox!

    const line = new THREE.LineSegments(geometry, material)
    AcTrBufferGeometryUtil.computeLineDistances(line)
    this.add(line)
  }
}
