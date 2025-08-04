import * as THREE from 'three'

/**
 * Extension of THREE.Object3D by adding some methods needed
 */
export class AcTrBaseObject extends THREE.Object3D {
  /**
   * Flatten the hierarchy of the specified object so that all children are moved to be direct
   * children of this object. Preserve transformations.
   * @param root Input object to be flatten
   * @returns Return the flatten object
   */
  static flattenObject(root: THREE.Object3D) {
    // Temporary array to store children that will be re-parented
    const objectsToReparent: THREE.Object3D[] = []

    function resetObjectMatrix(object: THREE.Object3D) {
      // Clear local transformations of the child (now global transformations are applied)
      object.position.set(0, 0, 0)
      object.rotation.set(0, 0, 0)
      object.scale.set(1, 1, 1)
      object.matrix.identity()
    }

    // Helper function to recursively traverse the tree
    function traverseAndCollectChildren(
      object: THREE.Object3D,
      parentMatrixWorld: THREE.Matrix4
    ) {
      const children = [...object.children] // Copy the children array
      for (const child of children) {
        // Update the child's world matrix to preserve its world transform
        child.applyMatrix4(parentMatrixWorld)

        // Clear local transformations of the child (now global transformations are applied)
        resetObjectMatrix(child)

        if (child.children.length > 0) {
          // Recursively process the child's children
          traverseAndCollectChildren(child, child.matrixWorld)
        } else {
          // Collect the child for re-parenting
          objectsToReparent.push(child)
        }
      }
      object.children = [] // Clear children of the current object
    }

    // Start recursive traversal with the root's matrix world
    root.updateMatrixWorld(true) // Ensure the root's matrixWorld is up to date
    traverseAndCollectChildren(root, root.matrixWorld)

    // Add all collected children directly to the root
    for (const child of objectsToReparent) {
      // need to clone geometry, because a geometry can be shared by many objects
      if ('geometry' in child) {
        const geom = child.geometry as THREE.BufferGeometry
        geom.applyMatrix4(child.matrixWorld)

        child.matrixWorld.identity()
        child.matrixWorldNeedsUpdate = false
        root.add(child)
      }
    }

    resetObjectMatrix(root)
    root.matrixWorld.identity()
    root.matrixWorldNeedsUpdate = false
  }

  /**
   * Remove the specified object from its parent and release geometry and material resource used
   * by the object.
   * @param object Input object to dispose
   */
  static disposeObject(
    object: THREE.Object3D,
    isRemoveFromParent: boolean = true
  ) {
    // Step 1: Remove the object from the parent if it exists
    if (isRemoveFromParent) object.removeFromParent()

    // Step 2: Dispose of geometry if it exists
    if (
      object instanceof THREE.Mesh ||
      object instanceof THREE.Line ||
      object instanceof THREE.Points
    ) {
      if (object.geometry) {
        object.geometry.dispose()
      }
    }

    // Step 3: Dispose of material(s)
    if (
      object instanceof THREE.Mesh ||
      object instanceof THREE.Line ||
      object instanceof THREE.Points
    ) {
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material]
      materials.forEach(material => {
        material.dispose()
        // Dispose textures (if any) used by the material
        material.map?.dispose()
        material.envMap?.dispose()
        material.lightMap?.dispose()
        material.bumpMap?.dispose()
        material.normalMap?.dispose()
        material.roughnessMap?.dispose()
        material.metalnessMap?.dispose()
        material.alphaMap?.dispose()
      })
    }

    // Step 4: Recursively dispose of all child objects
    object.children.forEach(child => this.disposeObject(child))

    // Step 5: Clean up references
    if ('geometry' in object) object.geometry = null // This clears the geometry reference
    if ('material' in object) object.material = null // This clears the material reference
    object.children = [] // Clear children array
  }

  /**
   * Flatten the hierarchy of this object so that all children are moved to be direct children of
   * this entity. Preserve transformations.
   */
  flatten() {
    AcTrBaseObject.flattenObject(this)
  }

  /**
   * Remove this object from its parent and release geometry and material resource used by this object.
   */
  dispose() {
    AcTrBaseObject.disposeObject(this)
  }
}
