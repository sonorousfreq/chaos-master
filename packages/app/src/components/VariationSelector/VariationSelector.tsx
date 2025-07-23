import { createSignal, For, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { vec2f, vec4f } from 'typegpu/data'
import { ChangeHistoryContextProvider } from '@/contexts/ChangeHistoryContext'
import { Flam3 } from '@/flame/Flam3'
import {
  generateTransformId,
  generateVariationId,
} from '@/flame/transformFunction'
import { isParametricVariation, variationTypes } from '@/flame/variations'
import { getParamsEditor, getVariationDefault } from '@/flame/variations/utils'
import { AutoCanvas } from '@/lib/AutoCanvas'
import { Camera2D } from '@/lib/Camera2D'
import { Root } from '@/lib/Root'
import { DelayedShow } from '../DelayedShow/DelayedShow'
import ui from '../LoadFlameModal/LoadFlameModal.module.css'
import { useRequestModal } from '../Modal/ModalContext'
import { ModalTitleBar } from '../Modal/ModalTitleBar'
import type {
  FlameDescriptor,
  TransformFunction,
} from '@/flame/schema/flameSchema'
import type {
  TransformVariationDescriptor,
  TransformVariationType,
} from '@/flame/variations'
import type { ChangeHistory } from '@/utils/createStoreHistory'
import { AffineParams } from '@/flame/affineTranform'

const CANCEL = 'cancel'

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
      [generateVariationId()]: {
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

function Preview(props: { variation: TransformVariationDescriptor }) {
  const transformId = generateTransformId()
  const variationId = generateVariationId()
  const defaultAffineTransform = {
    preAffine: { a: 1, b: 0, c: 0, d: 0, e: 1, f: 0 },
    variations: undefined,
  }
  const transformSpec =
    getVariationPreviewTransform(props.variation.type) ?? defaultAffineTransform

  const flameDesc: FlameDescriptor = {
    metadata: {
      author: '<some-var-author>',
    },
    renderSettings: {
      skipIters: 1,
      camera: {
        zoom: 1,
        position: [0, 0],
      },
      exposure: 0.3,
      drawMode: 'light',
    },
    transforms: {
      [transformId]: {
        probability: 1.0,
        preAffine: transformSpec.preAffine ?? defaultAffineTransform.preAffine,
        postAffine: { a: 1, b: 0, c: 0, d: 0, e: 1, f: 0 },
        color: { x: 0, y: 0 },
        variations: {
          [variationId]: {
            ...props.variation,
            ...transformSpec.variations?.[props.variation.type],
          },
        },
      },
    },
  }
  return (
    <Root adapterOptions={{ powerPreference: 'high-performance' }}>
      <AutoCanvas pixelRatio={1}>
        <Camera2D
          position={vec2f(...flameDesc.renderSettings.camera.position)}
          zoom={flameDesc.renderSettings.camera.zoom}
        >
          <Show
            when={isParametricVariation(props.variation) && props.variation}
            keyed
          >
            {(variation) => (
              <Dynamic
                {...getParamsEditor(variation)}
                setValue={(value) => {
                  const variationDraft =
                    flameDesc.transforms[transformId]?.variations[variationId]
                  if (
                    variationDraft === undefined ||
                    !isParametricVariation(variationDraft)
                  ) {
                    throw new Error(`Unreachable code`)
                  }
                  variationDraft.params = value
                }}
              />
            )}
          </Show>
          <Flam3
            quality={0.99}
            pointCountPerBatch={4e5}
            adaptiveFilterEnabled={false}
            flameDescriptor={flameDesc}
            renderInterval={1}
            onExportImage={undefined}
            edgeFadeColor={vec4f(0)}
          />
        </Camera2D>
      </AutoCanvas>
    </Root>
  )
}

type VariationSelectorModalProps = {
  currentVar: TransformVariationDescriptor
  respond: (variation: TransformVariationDescriptor | typeof CANCEL) => void
}

function ShowVariationSelector(props: VariationSelectorModalProps) {
  const previewVariations: TransformVariationDescriptor[] = variationTypes.map(
    (name) => getVariationDefault(name, 1),
  )

  return (
    <>
      <ModalTitleBar
        onClose={() => {
          props.respond(CANCEL)
        }}
      >
        Select Variation
        <span class={ui.undoMessage}>You can undo this operation.</span>
      </ModalTitleBar>
      <h2>Example Gallery</h2>
      <section class={ui.gallery}>
        <For each={previewVariations}>
          {(variation, i) => (
            <button
              class={ui.item}
              onClick={() => {
                props.respond(variation)
              }}
            >
              <DelayedShow delayMs={i() * 30}>
                <Preview variation={variation} />
              </DelayedShow>
              <div class={ui.itemTitle}>{variation.type}</div>
            </button>
          )}
        </For>
      </section>
    </>
  )
}

export function createVariationSelector(
  history: ChangeHistory<FlameDescriptor>,
) {
  const requestModal = useRequestModal()
  const [varSelectorModalIsOpen, setVarSelectorModalIsOpen] =
    createSignal(false)

  async function showVariationSelector(
    currentVar: TransformVariationDescriptor,
  ) {
    setVarSelectorModalIsOpen(true)
    const result = await requestModal<
      TransformVariationDescriptor | typeof CANCEL
    >({
      content: ({ respond }) => (
        <ChangeHistoryContextProvider value={history}>
          <ShowVariationSelector currentVar={currentVar} respond={respond} />
        </ChangeHistoryContextProvider>
      ),
    })
    setVarSelectorModalIsOpen(false)
    if (result === CANCEL) {
      return
    }
    return result
  }

  return {
    showVariationSelector,
    varSelectorModalIsOpen,
  }
}
