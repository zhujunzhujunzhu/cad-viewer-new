import {
  AcGiHatchPatternLine,
  AcGiHatchStyle,
  AcGiLineStyle
} from '@mlightcad/data-model'
import * as THREE from 'three'

import {
  AcTrPatternLine,
  createHatchPatternShaderMaterial
} from './AcTrHatchPatternShaders'
import { AcTrLinePatternShaders } from './AcTrLinePatternShaders'

/**
 * Class to manage line type and hatch type.
 * @internal
 */
export class AcTrStyleManager {
  /**
   * Uniform shared by all materials
   */
  static CameraZoomUniform = { value: 1.0 }
  /**
   * Used for drawing dashed lines properly in a viewport.
   */
  static ViewportScaleUniform = { value: 1.0 }

  /**
   * WebGL has a limited capability for FragmentUniforms. Thus, cannot have as many
   * clippingPlanes as expected.
   */
  static MaxFragmentUniforms = 1024

  /**
   * The format of key is as follows.
   * `${color}_${size}`
   */
  private pointMaterials: { [key: string]: THREE.Material } = {}
  /**
   * The format of key is as follows.
   * `${linePattern}_${color}_${lineTypeScale}`
   */
  private lineShaderMaterials: { [key: string]: THREE.Material } = {}
  private lineBasicMaterials: { [color: number]: THREE.Material } = {}
  private hatchShaderMaterials: {
    patternLines: AcGiHatchPatternLine[]
    patternAngle: number
    color: number
    material: THREE.Material
  }[] = []
  private meshBasicMaterials: { [color: number]: THREE.Material } = {}

  public unsupportedTextStyles: Record<string, number> = {}

  getPointsMaterial(color: number, size: number = 2): THREE.Material {
    const key = `${color}_${size}`
    if (!this.pointMaterials[key]) {
      this.pointMaterials[key] = new THREE.PointsMaterial({
        size,
        color
      })
    }
    return this.pointMaterials[key]
  }

  getMeshBasicMaterial(color: number): THREE.Material {
    if (!this.meshBasicMaterials[color]) {
      this.meshBasicMaterials[color] = new THREE.MeshBasicMaterial({
        color
      })
    }
    return this.meshBasicMaterials[color]
  }

  getLineBasicMaterial(color: number): THREE.Material {
    if (!this.lineBasicMaterials[color]) {
      this.lineBasicMaterials[color] = new THREE.LineBasicMaterial({
        color
      })
    }
    return this.lineBasicMaterials[color]
  }

  getLineShaderMaterial(style: AcGiLineStyle, lineTypeScale: number) {
    if (style.pattern && style.pattern.length !== 0) {
      const key = `${style.name}_${style.color}_${lineTypeScale}`
      if (!this.lineShaderMaterials[key]) {
        this.lineShaderMaterials[key] =
          AcTrLinePatternShaders.createLineShaderMaterial(
            style.pattern,
            style.color,
            lineTypeScale,
            AcTrStyleManager.ViewportScaleUniform,
            AcTrStyleManager.CameraZoomUniform
          )
      }
      return this.lineShaderMaterials[key]
    } else {
      return this.getLineBasicMaterial(style.color)
    }
  }

  getHatchShaderMaterial(
    style: AcGiHatchStyle,
    rebaseOffset: THREE.Vector2
  ): THREE.Material | undefined {
    if (!style.patternLines || style.patternLines.length < 1) {
      return this.getMeshBasicMaterial(style.color)
    }

    let hasInvalidDashPattern = false
    style.patternLines.forEach(patternLine => {
      if (!patternLine.dashPattern) {
        hasInvalidDashPattern = true
        console.log('Invalid dash pattern: ', style)
      }
    })
    if (hasInvalidDashPattern) return undefined

    const matchedMaterial = this.findMatchedHatchShaderMaterial(style)
    if (matchedMaterial) {
      return matchedMaterial
    }

    const RATIO_FOR_NONDOT_PATTERN = 0.005
    const RATIO_FOR_DOT_PATTERN = 0.05

    // Get a max size to be used for all patternLines, this value will be used during
    // glsl compile time, and it cannot be 0 (compile error) and cannot be 1 (run time warning).
    let maxPatternSegmentCount = 2
    style.patternLines.forEach(patternLine => {
      maxPatternSegmentCount = Math.max(
        patternLine.dashPattern.length,
        maxPatternSegmentCount
      )
    })

    let currentUniformCount = 0

    const patternLines: AcTrPatternLine[] = []
    const tempCenter = new THREE.Vector2()
    for (const hatchPatternLine of style.patternLines) {
      const origin = new THREE.Vector2(
        hatchPatternLine.origin.x,
        hatchPatternLine.origin.y
      )
        .sub(rebaseOffset)
        .rotateAround(tempCenter, -THREE.MathUtils.degToRad(style.patternAngle))

      const delta = new THREE.Vector2(
        hatchPatternLine.delta.x,
        hatchPatternLine.delta.y
      ).rotateAround(
        tempCenter,
        -THREE.MathUtils.degToRad(hatchPatternLine.angle)
      )

      if (delta.y === 0) {
        console.warn('delta.y is equal to zero!')
        return undefined
      }

      const patternCount = hatchPatternLine.dashPattern.length
      // Indicates the dot pattern when the dashPatterns contain only 0 and negative numbers
      let bDotPattern = true
      // calculates the total length of the pattern
      let length = 0
      for (let i = 0; i < patternCount; ++i) {
        const value = hatchPatternLine.dashPattern[i]
        if (value > 0) {
          bDotPattern = false
        }
        length += Math.abs(value)
      }

      // TODO: because we cannot (or, it's kind of hard to) draw a dot, let's draw a short dash.
      const ratio = bDotPattern
        ? RATIO_FOR_DOT_PATTERN
        : RATIO_FOR_NONDOT_PATTERN

      const pattern: number[] = []
      const patternSum: number[] = []
      let patternLength = 0
      patternSum[0] = patternLength
      for (let i = 0; i < patternCount; ++i) {
        pattern[i] = hatchPatternLine.dashPattern[i]
        if (pattern[i] === 0) {
          pattern[i] = ratio * length
        }
        patternLength += Math.abs(pattern[i])
        patternSum[i + 1] = patternLength
      }

      // fill 0 for extra pattern segments in case a pattern doesn't have maxPatternSegmentCount segments
      for (let i = patternCount; i < maxPatternSegmentCount; ++i) {
        pattern[i] = 0
      }
      for (let i = patternSum.length; i < maxPatternSegmentCount + 1; ++i) {
        patternSum[i] = patternLength
      }

      const patternLine = {
        origin,
        delta,
        angle: hatchPatternLine.angle - style.patternAngle,
        pattern,
        patternSum,
        patternLength
      }

      currentUniformCount += 4 // orgin,delta,angle,patternLength
      currentUniformCount += maxPatternSegmentCount //pattern, consistent with HatchPatternShader
      currentUniformCount += maxPatternSegmentCount + 1 //patternSum, consistent with HatchPatternShader
      if (currentUniformCount > AcTrStyleManager.MaxFragmentUniforms) {
        console.warn(
          'There will be warning in fragment shader when number of uniforms exceeds 1024, so extra hatch line patterns are ignored here!'
        )
        break
      }
      patternLines.push(patternLine)
    }

    const material = createHatchPatternShaderMaterial(
      patternLines,
      style.patternAngle,
      AcTrStyleManager.CameraZoomUniform,
      new THREE.Color(style.color)
    )
    material.defines = {
      MAX_PATTERN_SEGMENT_COUNT: maxPatternSegmentCount
    }
    // cache it
    this.hatchShaderMaterials.push({
      patternLines: style.patternLines,
      patternAngle: style.patternAngle,
      color: style.color,
      material: material
    })
    return material
  }

  private findMatchedHatchShaderMaterial(
    style: AcGiHatchStyle
  ): THREE.Material | undefined {
    const hatchPatternLines = style.patternLines
    if (!hatchPatternLines || hatchPatternLines.length < 1) {
      return undefined
    }

    const numberEqual = (a: number, b: number): boolean => {
      // ignore tiny difference
      const delta = Math.abs(a - b)
      return delta < 0.00001
    }
    const patternEqual = (a: number[], b: number[]): boolean => {
      if (a.length !== b.length) {
        return false
      }
      for (let i = 0; i < a.length; ++i) {
        if (!numberEqual(a[i], b[i])) {
          return false
        }
      }
      return true
    }
    const patternLineEqual = (
      a: AcGiHatchPatternLine,
      b: AcGiHatchPatternLine
    ): boolean => {
      return (
        numberEqual(a.angle, b.angle) &&
        numberEqual(a.delta.x, b.delta.x) &&
        numberEqual(a.delta.y, b.delta.y) &&
        numberEqual(a.origin.x, b.origin.x) &&
        numberEqual(a.origin.y, b.origin.y) &&
        patternEqual(a.dashPattern, b.dashPattern)
      )
    }
    const patternLinesEqual = (
      a: AcGiHatchPatternLine[],
      b: AcGiHatchPatternLine[]
    ): boolean => {
      if (a.length !== b.length) {
        return false
      }
      for (let i = 0; i < a.length; ++i) {
        if (!patternLineEqual(a[i], b[i])) {
          return false
        }
      }
      return true
    }

    const matchedHatchShaderMaterial = this.hatchShaderMaterials.find(item => {
      return (
        item.color === style.color &&
        item.patternAngle === style.patternAngle &&
        patternLinesEqual(item.patternLines, hatchPatternLines)
      )
    })

    return matchedHatchShaderMaterial?.material
  }
}
