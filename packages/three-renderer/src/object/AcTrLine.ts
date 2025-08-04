import { AcGePoint3dLike, AcGiLineStyle } from '@mlightcad/data-model'
import * as THREE from 'three'

import { AcTrStyleManager } from '../style/AcTrStyleManager'
import { AcTrBufferGeometryUtil } from '../util/AcTrBufferGeometryUtil'
import { AcTrEntity } from './AcTrEntity'

export class AcTrLine extends AcTrEntity {
  public geometry: THREE.BufferGeometry

  constructor(
    points: AcGePoint3dLike[],
    style: AcGiLineStyle | undefined,
    styleManager: AcTrStyleManager
  ) {
    super(styleManager)

    let material: THREE.Material
    const color = style ? style.color : 0xffffff
    if (style) {
      material = this.styleManager.getLineShaderMaterial(style, 1)
    } else {
      material = new THREE.LineBasicMaterial({ color })
    }

    const vertices = new Float32Array((points.length - 1) * 6)
    for (let i = 0, pos = 0; i < points.length - 1; i++) {
      let point = points[i]
      vertices[pos] = point.x
      vertices[pos + 1] = point.y
      vertices[pos + 2] = point.z ?? 0
      point = points[i + 1]
      vertices[pos + 3] = point.x
      vertices[pos + 4] = point.y
      vertices[pos + 5] = point.z ?? 0
      pos += 6
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    this.setBoundingBox(geometry)
    this.geometry = geometry

    const line = new THREE.LineSegments(geometry, material)
    AcTrBufferGeometryUtil.computeLineDistances(line)
    this.add(line)
  }

  private setBoundingBox(geometry: THREE.BufferGeometry) {
    geometry.computeBoundingBox()
    this.box = geometry.boundingBox!
  }
}
