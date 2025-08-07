import { isParametricVariationType, transformVariations } from '.'
import type {
  ParametricVariationDescriptor,
  TransformVariationDescriptor,
  TransformVariationType,
} from '.'
import type { EditorFor } from '@/components/Sliders/ParametricEditors/types'
import { defineExample } from '../examples/util'
import { generateTransformId, generateVariationId } from '../transformFunction'
import { TransformFunction } from '../schema/flameSchema'

export function getVariationDefault(
  type: TransformVariationType,
  weight: number,
): TransformVariationDescriptor {
  if (!isParametricVariationType(type)) {
    return { type, weight } as TransformVariationDescriptor
  }
  return {
    type,
    params: transformVariations[type].paramDefaults,
    weight,
  } as TransformVariationDescriptor
}

export function getParamsEditor<T extends ParametricVariationDescriptor>(
  variation: T,
): { component: EditorFor<T['params']>; value: T['params'] } {
  return {
    component: transformVariations[variation.type].editor as EditorFor<
      T['params']
    >,
    get value() {
      return variation.params
    },
  }
}
const varPreviewId = generateVariationId()
const variationPreviewTransforms: Partial<
  Record<TransformVariationType, Partial<TransformFunction>>
> = {
  crossVar: {
    preAffine: {
      c: -0.018140589569160814,
      f: 0.018140589569160953,
      a: 2.001308488559136,
      b: -0.009967503645097698,
      d: 0.0274246123309187,
      e: 1.955389021287148,
    },
  },
  cylinder: {
    preAffine: {
      c: 0,
      f: -0.0404040404040404,
      a: 1.0641437946855248,
      b: 3.3804745870749375,
      d: 1.0248973238554226,
      e: -0.3177801139858961,
    },
    // c: -0.013468013468013407,
    // f: 0,
    // a: 3.159352933624343,
    // b: -2.4942097830273466,
    // d: 1.6229514134593572,
    // e: 1.8246557550917812,
  },
  diamond: {
    preAffine: {
      c: 0,
      f: 0,
      a: 0.5752348183753919,
      b: 4.552930872842858,
      d: 3.306719089367465,
      e: -0.28255288522493477,
    },
  },
  fan: {
    preAffine: {
      c: 0.3030303030303029,
      f: 0.35151515151515156,
      a: 0.6931111689557807,
      b: 0.04304811234031391,
      d: 0.04827625346378865,
      e: 0.7132582839731785,
    },
  },
  waves: {
    preAffine: {
      c: -0.3636010248255146,
      f: -0.22892481667991876,
      a: 1.2052888138611,
      b: -0.2773087299704806,
      d: 0.38927695930481726,
      e: 1.149919974554039,
    },
  },
  ngonVar: {
    preAffine: {
      c: -0.01212121212121231,
      f: -0.06060606060606066,
      a: 1.2940090947979932,
      b: -0.2008651636171157,
      d: 0.37721466299031076,
      e: 1.294204089963071,
    },
    variations: {
      [varPreviewId]: {
        type: 'ngonVar',
        weight: 1.0,
        params: {
          power: 2,
          sides: 6,
          corners: 2,
          circle: 0,
        },
      },
    },
  },
  popcorn: {
    preAffine: {
      a: 1,
      b: 0,
      c: -0.28224055579678675,
      d: 0,
      e: 1,
      f: -0.39079461571862784,
    },
  },
}

function getVariationPreviewTransform(
  type: TransformVariationType,
): Partial<TransformFunction | undefined> {
  return variationPreviewTransforms[type]
}

export const transformPreviewId = generateTransformId()
export const variationPreviewId = generateVariationId()
export function getVariationPreviewFlame(type: TransformVariationType) {
  const defaultAffineTransform = {
    preAffine: { a: 1, b: 0, c: 0, d: 0, e: 1, f: 0 },
    variations: undefined,
  }
  const transformSpec =
    getVariationPreviewTransform(type) ?? defaultAffineTransform
  return defineExample({
    metadata: {
      author: type,
    },
    renderSettings: {
      exposure: 0.3,
      skipIters: 1,
      drawMode: 'light',
      backgroundColor: [0, 0, 0],
      camera: {
        zoom: 1,
        position: [0, 0],
      },
    },
    transforms: {
      [transformPreviewId]: {
        probability: 1,
        preAffine: transformSpec.preAffine
          ? transformSpec.preAffine
          : defaultAffineTransform.preAffine,
        postAffine: { a: 1, b: 0, c: 0, d: 0, e: 1, f: 0 },
        color: { x: 0, y: 0 },
        variations: {
          [variationPreviewId]: transformSpec.variations?.[varPreviewId]
            ? transformSpec.variations[varPreviewId]
            : getVariationDefault(type, 1.0),
        },
      },
    },
  })
}
