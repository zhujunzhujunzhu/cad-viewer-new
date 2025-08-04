import { AcTrStyleManager } from '../style/AcTrStyleManager'
import { AcTrEntity } from './AcTrEntity'

export class AcTrGroup extends AcTrEntity {
  constructor(entities: AcTrEntity[], styleManager: AcTrStyleManager) {
    super(styleManager)
    entities.forEach(entity => {
      if (Array.isArray(entity)) {
        const subGroup = new AcTrEntity(styleManager)
        this.add(subGroup)
        this.box.union(subGroup.box)
      } else {
        this.add(entity)
        this.box.union(entity.box)
      }
    })
    this.flatten()

    // Note: Don't merge children because the structure of is group is needed when
    // hovering over one entity. For example, when hovering on one character in one
    // block reference, its bounding box is used to check intersection instead of its
    // real shape. After merging, there is no way to do this kind of check.
  }
}
